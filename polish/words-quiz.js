// Word quiz: each card shows a Polish word (with its voice and recording buttons) and four
// meanings in English and Ukrainian; pick the right one. Words come from the topic, Words and
// Practise menus shared with the list and flashcards, and are shuffled. Mistakes are counted
// per word and each finished round is saved. Adds a Cards / Quiz switch to the Flashcards tab,
// using PolishQuiz (quiz.js), PolishPage (polish.js) and PolishRatings (ratings.js).
//
// Storage (exported with every other "polish." key):
//   polish.mistakes        {"word:<pl>": count, ...}  shared with letter mistakes ("letter:<id>")
//   polish.quiz            [{at, kind: "word", set, total, right, wrong: [pl]}, ...]  newest last
//   polish.wordQuiz.size   how many words a round has: "10", "20" or "all"
(function () {
  var Q = window.PolishQuiz;
  var P = window.PolishPage;
  var R = window.PolishRatings;
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var SIZE_KEY = "polish.wordQuiz.size";

  var pane = document.getElementById("pane-flashcards");
  var cardsView = document.getElementById("fc-cards-view");
  if (!pane || !cardsView || !Q || !P || !P.words) return;

  // ---------- Storage ----------

  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || typeof v !== typeof fallback || Array.isArray(v) !== Array.isArray(fallback) ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  // ---------- Building blocks ----------

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(cls, text, onClick) {
    var b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function line(label, text, lang) {
    var p = el("p", lang === "uk" ? "pl-uk-only" : null);
    p.appendChild(el("span", "pl-label", label));
    p.appendChild(document.createTextNode(" "));
    var span = el("span", null, text);
    if (lang) span.lang = lang;
    p.appendChild(span);
    return p;
  }

  // ---------- Layout ----------

  // Cards / Quiz switch at the top of the Flashcards tab. Cards is the flashcard trainer.
  var root = el("div", "lq wq");
  root.id = "words-quiz";
  root.hidden = true;
  var modes = el("div", "pl-tabs lq-modes");
  modes.setAttribute("role", "group");
  modes.setAttribute("aria-label", "Flashcards view");
  var cardsMode = button("pl-tab active", "Cards", function () { setMode(false); });
  var quizMode = button("pl-tab", "Quiz", function () { setMode(true); });
  cardsMode.setAttribute("aria-pressed", "true");
  quizMode.setAttribute("aria-pressed", "false");
  modes.appendChild(cardsMode);
  modes.appendChild(quizMode);
  pane.insertBefore(modes, cardsView);
  pane.appendChild(root);

  function setMode(quiz) {
    cardsMode.classList.toggle("active", !quiz);
    quizMode.classList.toggle("active", quiz);
    cardsMode.setAttribute("aria-pressed", quiz ? "false" : "true");
    quizMode.setAttribute("aria-pressed", quiz ? "true" : "false");
    cardsView.hidden = quiz;
    root.hidden = !quiz;
    if (quiz && !round) startFromMenus();
    // Keep the address linkable: flashcards/#quiz opens the quiz.
    if ((location.hash === "#quiz") !== quiz) {
      history.replaceState(null, "", location.pathname + location.search + (quiz ? "#quiz" : ""));
    }
  }

  var sizeSelect = el("select", "pl-input");
  sizeSelect.setAttribute("aria-label", "How many words in a round");
  [["10", "10 words a round"], ["20", "20 words a round"], ["all", "Every word in the set"]].forEach(function (s) {
    var o = el("option", null, s[1]);
    o.value = s[0];
    sizeSelect.appendChild(o);
  });
  sizeSelect.value = load(SIZE_KEY, "10");
  if (!sizeSelect.value) sizeSelect.value = "10";
  sizeSelect.addEventListener("change", function () {
    save(SIZE_KEY, sizeSelect.value);
    startFromMenus();
  });
  var filters = el("div", "pl-filters");
  filters.appendChild(sizeSelect);

  var stats = el("p", "pl-muted pl-small");

  var card = el("div", "pl-card lq-card wq-card");
  card.setAttribute("aria-live", "polite");
  var badge = el("span", "pl-card-mine");
  badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 ' +
    '1.2-6.5-4.8-4.6 6.6-.9z"/></svg>';
  var badgeText = el("span");
  badge.appendChild(badgeText);
  var cardLabel = el("p", "pl-card-topic");
  // Easy / Normal / Hard / Pick for the word on the card.
  var rate = R ? R.control(document, "word", "") : null;
  var rateRow = el("div", "pl-card-rate");
  if (rate) rateRow.appendChild(rate);
  var front = el("p", "pl-card-front");
  front.lang = "pl";
  var sayRow = el("div", "pl-say-row");
  var question = el("p", "pl-muted pl-small wq-question", "What does it mean?");
  var options = el("div", "lq-options");
  var feedback = el("div", "pl-card-back lq-feedback");
  feedback.hidden = true;
  var next = button("pl-button pl-primary", "Next", function () { advance(); });
  next.hidden = true;
  var undo = P.undoButton(function () { undoAnswer(); });
  [badge, cardLabel, rateRow, front, sayRow, question, options, undo, feedback, next].forEach(function (n) {
    if (n) card.appendChild(n);
  });
  // Show / Hide Ukrainian: the Ukrainian meanings on the options can give the word away.

  var done = el("div", "pl-card");
  done.hidden = true;
  var doneTitle = el("p", "pl-card-front", "Gotowe!");
  doneTitle.lang = "pl";
  var doneText = el("p", "pl-muted");
  var missedList = el("ul", "wq-missed");
  var retryMissed = button("pl-button pl-primary", "Practise the ones I missed", function () {
    start(round.wrong.slice(), "missed");
  });
  var again = button("pl-link", "New round", function () { startFromMenus(); });
  [doneTitle, doneText, missedList, retryMissed, again].forEach(function (n) { done.appendChild(n); });

  var keys = el("p", "pl-muted pl-small pl-keys",
    "Keyboard: 1 to 4 pick an answer, Enter goes to the next word, U takes back a wrong tap, S says the word, R plays a recording.");

  [filters, stats, card, done, keys].forEach(function (n) { root.appendChild(n); });

  // ---------- Round ----------

  var round = null; // {set, words, deck, index, right, wrong: [words], answered, word, choices}

  function roundSize() {
    return sizeSelect.value === "all" ? Infinity : parseInt(sizeSelect.value, 10) || 10;
  }

  function practiceSet() {
    var select = document.getElementById("practice-set");
    return (select && select.value) || "all";
  }

  // A new round on the words the topic, Words and Practise menus select.
  function startFromMenus() {
    var words = P.words();
    if (!words.length) {
      round = null;
      card.hidden = true;
      done.hidden = true;
      stats.textContent = practiceSet() === "all"
        ? "No words match the menus above."
        : "No words in this set yet. Mark words as hard, normal or easy, or pick them, in the list or on a card.";
      return;
    }
    start(Q.shuffle(words, Math.random).slice(0, roundSize()), practiceSet());
  }

  function start(words, label) {
    if (!words.length) return;
    round = { set: label, words: words, deck: Q.shuffle(words, Math.random), index: 0, right: 0, wrong: [], answered: false };
    done.hidden = true;
    card.hidden = false;
    show();
  }

  // Wrong answers come from every word on the page, not only the chosen set, so even a set of
  // two words gets four choices.
  function show() {
    var word = round.deck[round.index];
    round.word = word;
    round.answered = false;
    var mine = P.isMine(word);
    badge.classList.toggle("is-mine", mine);
    badgeText.textContent = mine ? "My word" : "Not my word";
    cardLabel.textContent = mine ? "" : word.topic;
    if (rate) rate.update("word", word.pl);
    front.textContent = word.pl;
    sayRow.textContent = "";
    sayRow.appendChild(P.speakButtons(word.pl));
    options.textContent = "";
    round.choices = Q.makeMeaningOptions(word, P.allWords, Math.random);
    round.choices.forEach(function (choice, i) {
      var b = button("pl-button lq-option wq-option", null, function () { answer(b, choice); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      var text = el("span", "wq-meaning");
      text.appendChild(el("span", "wq-en", choice.en));
      var uk = el("span", "wq-uk", choice.uk);
      uk.lang = "uk";
      text.appendChild(uk);
      b.appendChild(text);
      b.dataset.pl = choice.pl;
      options.appendChild(b);
    });
    question.hidden = false;
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
  }

  function renderStats() {
    stats.textContent = "Word " + (round.index + 1) + " of " + round.deck.length +
      " · " + round.right + " right · " + round.wrong.length + " wrong";
  }

  function answer(chosen, choice) {
    if (round.answered) return;
    round.answered = true;
    var word = round.word;
    var right = choice === word;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.pl === word.pl) b.classList.add("is-right");
    });
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(word);
      mistakes = Q.addMistake(mistakes, word);
      save(MISTAKES_KEY, mistakes);
    }
    showFeedback(word, right, choice, mistakes[Q.mistakeKey(word)] || 0);
    renderStats();
    P.sayGenerated(word.pl);
    next.hidden = false;
    next.textContent = round.index + 1 < round.deck.length ? "Next" : "See results";
    undo.hidden = right;
    next.focus();
  }

  // A mistap: forget the mistake and ask the same word again with the same options.
  function undoAnswer() {
    if (!round || !round.answered || undo.hidden) return;
    round.wrong.pop();
    P.forgetMistake(Q.mistakeKey(round.word));
    round.answered = false;
    question.hidden = false;
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    P.reopenOptions(options);
  }

  function showFeedback(word, right, choice, missed) {
    feedback.textContent = "";
    question.hidden = true;
    var verdict = el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"), right ? "Right!" : "Not quite. ");
    if (!right) {
      verdict.appendChild(P.sayable(el("span", null, word.pl)));
      verdict.appendChild(document.createTextNode(" means:"));
    }
    feedback.appendChild(verdict);
    feedback.appendChild(line("EN", word.en));
    feedback.appendChild(line("UK", word.uk, "uk"));
    if (word.note) {
      var note = el("p", "pl-muted pl-small");
      note.appendChild(P.noteText(word.note));
      feedback.appendChild(note);
    }
    if (!right) {
      // What the picked meaning is in Polish, so the wrong guess teaches a word too.
      var other = el("p", "pl-muted pl-small", "You picked the meaning of ");
      var pl = el("strong", null, choice.pl);
      pl.lang = "pl";
      other.appendChild(pl);
      other.appendChild(document.createTextNode("."));
      feedback.appendChild(other);
    }
    if (word.example) {
      var ex = el("div", "pl-card-example");
      ex.appendChild(P.exampleLine(word.example));
      feedback.appendChild(ex);
    }
    if (missed) {
      feedback.appendChild(el("p", "pl-muted pl-small",
        "Missed " + missed + (missed === 1 ? " time" : " times") + " so far."));
    }
    feedback.hidden = false;
  }

  function advance() {
    if (!round || !round.answered) return;
    if (round.index + 1 < round.deck.length) {
      round.index++;
      show();
    } else {
      finish();
    }
  }

  function finish() {
    var total = round.deck.length;
    save(HISTORY_KEY, Q.addResult(load(HISTORY_KEY, []), {
      at: new Date().toISOString(), kind: "word", set: round.set, total: total, right: round.right,
      wrong: round.wrong.map(function (w) { return w.pl; }),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" + (round.wrong.length ? ". Missed:" : ". No mistakes!");
    missedList.textContent = "";
    round.wrong.forEach(function (w) {
      var li = el("li");
      var pl = el("strong", null, w.pl);
      pl.lang = "pl";
      li.appendChild(pl);
      li.appendChild(document.createTextNode(" · " + w.en));
      var uk = el("span", null, " · " + w.uk);
      uk.lang = "uk";
      li.appendChild(uk);
      missedList.appendChild(li);
    });
    missedList.hidden = !round.wrong.length;
    retryMissed.hidden = !round.wrong.length;
    stats.textContent = "";
    (round.wrong.length ? retryMissed : again).focus();
  }

  // The topic, Words or Practise menu changed: start over on the new selection, or wait until
  // Quiz is opened.
  window.addEventListener("polish:filters", function () {
    if (root.hidden) round = null;
    else startFromMenus();
  });

  // Keyboard shortcuts while the quiz is on screen and you're not typing.
  document.addEventListener("keydown", function (e) {
    if (!round || card.hidden || !root.offsetParent) return;
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.children.length && !round.answered) {
      e.preventDefault();
      options.children[n - 1].click();
    } else if (e.key === "Enter" && round.answered && e.target !== next) {
      e.preventDefault();
      advance();
    } else if (P.isUndoKey(e) && !undo.hidden) {
      e.preventDefault();
      undoAnswer();
    } else if (e.key === "s" || e.key === "S") {
      P.sayGenerated(round.word.pl, true);
    } else if (e.key === "r" || e.key === "R") {
      P.sayRecorded(round.word.pl);
    }
  });
  if (location.hash === "#quiz") setMode(true);
  window.addEventListener("hashchange", function () { setMode(location.hash === "#quiz"); });
})();
