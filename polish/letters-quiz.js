// Letters quiz: each card shows a Polish letter or combination and four ways it might sound;
// pick one. Cards are shuffled, mistakes are counted per letter, and each finished round is
// saved. Shown instead of the list at letters/#quiz (the Quiz side of the Learn / Quiz switch), using
// window.POLISH_LETTERS (letters.js), PolishQuiz (quiz.js) and, when present, PolishPage for
// audio and PolishRatings for Hard / Normal / Easy sets.
//
// Storage (exported with every other "polish." key):
//   polish.mistakes        {"letter:<id>": count, ...}  shared with word mistakes ("word:<pl>")
//   polish.quiz            [{at, set, total, right, wrong: [ids]}, ...]  newest last
//   polish.letters.manual  [ids] picked under "Choose letters"
//
// Other scripts can start a round on any set of letters with PolishLettersQuiz.start(ids, label).
(function () {
  var Q = window.PolishQuiz;
  var LETTERS = window.POLISH_LETTERS || [];
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var MANUAL_KEY = "polish.letters.manual";

  var pane = document.getElementById("pane-letters");
  if (!pane || !Q || !LETTERS.length) return;
  var P = window.PolishPage;

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

  var SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z" />' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>';

  function say(text) {
    if (!text) return;
    if (P) return P.sayGenerated(text, true);
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    var voice = speechSynthesis.getVoices().filter(function (v) { return v.lang.toLowerCase().indexOf("pl") === 0; })[0];
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  function speakButton(text) {
    if (P) return P.speakButtons(text);
    var b = button("pl-speak", null, function () { say(text); });
    b.innerHTML = SPEAKER;
    b.title = "Say it";
    b.setAttribute("aria-label", "Say " + text);
    if (!("speechSynthesis" in window)) b.disabled = true;
    return b;
  }

  // ---------- Layout ----------

  // The list is everything already on the page; the quiz is the page's Quiz variant, shown at
  // letters/#quiz by the Learn / Quiz switch (pages.js) under the Polish menu.
  var listParts = Array.prototype.slice.call(pane.children);
  var root = el("div", "lq");
  root.id = "letters-quiz";
  root.hidden = true;
  pane.appendChild(root);
  var started = false;

  function setMode(quiz) {
    listParts.forEach(function (n) { n.hidden = quiz || n.dataset.lqHidden === "1"; });
    root.hidden = !quiz;
    if (quiz && !started) {
      started = true;
      startSet(R ? R.savedSet() : "all");
    }
  }

  function fromHash() { setMode(location.hash === "#quiz"); }
  window.addEventListener("hashchange", fromHash);

  // Remember which list parts were hidden by the list itself (e.g. "Nothing matches"), so
  // switching back to List doesn't show them.
  listParts.forEach(function (n) {
    n.dataset.lqHidden = n.hidden ? "1" : "";
    new MutationObserver(function () { if (root.hidden) n.dataset.lqHidden = n.hidden ? "1" : ""; })
      .observe(n, { attributes: true, attributeFilter: ["hidden"] });
  });

  // Ratings (ratings.js) are optional: with them the menu also offers Hard, Normal, Easy and
  // the hand-picked set shared with the word cards; without them, All or Choose letters.
  var R = window.PolishRatings;

  var setSelect = el("select", "pl-input");
  setSelect.setAttribute("aria-label", "Which letters to practise");
  var customLabel = "Selected letters"; // a round started by another script

  function option(value, text) {
    var o = el("option", null, text);
    o.value = value;
    setSelect.appendChild(o);
  }

  function fillSets(choose) {
    var current = choose || setSelect.value;
    if (R) {
      R.fillSelect(setSelect, LETTERS, "letter", id);
      option("choose", "Choose letters to pick…");
    } else {
      setSelect.textContent = "";
      option("all", "All letters and combinations");
      option("choose", "Choose letters…");
    }
    if (current === "custom") option("custom", customLabel);
    if (current) setSelect.value = current;
  }
  fillSets();
  var filters = el("div", "pl-filters");
  filters.appendChild(setSelect);

  var picker = el("div", "lq-picker");
  picker.hidden = true;
  var chips = el("div", "lq-chips");
  var pickerActions = el("div", "lq-picker-actions");
  pickerActions.appendChild(button("pl-link pl-small", "Select all", function () { setAllPicked(true); }));
  pickerActions.appendChild(button("pl-link pl-small", "Clear", function () { setAllPicked(false); }));
  var startPicked = button("pl-button pl-primary", "Start", function () { startManual(); });
  picker.appendChild(chips);
  picker.appendChild(pickerActions);
  picker.appendChild(startPicked);

  var stats = el("p", "pl-muted pl-small");

  var card = el("div", "pl-card lq-card");
  card.setAttribute("aria-live", "polite");
  var cardLabel = el("p", "pl-card-topic", "How does it sound?");
  var front = el("p", "pl-card-front");
  front.lang = "pl";
  var options = el("div", "lq-options");
  var feedback = el("div", "pl-card-back lq-feedback");
  feedback.hidden = true;
  var next = button("pl-button pl-primary", "Next", function () { advance(); });
  next.hidden = true;
  // Easy / Normal / Hard / Pick for the letter on the card, when ratings.js is on the page.
  var rate = R ? R.control(document, "letter", LETTERS[0].id) : null;
  if (rate) rate.classList.add("lq-rate");
  [cardLabel, front, rate, options, feedback, next].forEach(function (n) { if (n) card.appendChild(n); });
  var undo = P.undoButton(function () { undoAnswer(); });
  options.insertAdjacentElement("afterend", undo);

  var done = el("div", "pl-card");
  done.hidden = true;
  var doneTitle = el("p", "pl-card-front", "Gotowe!");
  doneTitle.lang = "pl";
  var doneText = el("p", "pl-muted");
  var retryMissed = button("pl-button pl-primary", "Practise the ones I missed", function () {
    start(round.wrong, "Missed letters");
  });
  var again = button("pl-link", "Start again", function () { start(round.ids, round.set); });
  [doneTitle, doneText, retryMissed, again].forEach(function (n) { done.appendChild(n); });

  var keys = el("p", "pl-muted pl-small pl-keys", "Keyboard: 1 to 4 pick an answer, Enter goes to the next card, U takes back a wrong tap, S says the example once you've answered.");

  [filters, picker, stats, card, done, keys].forEach(function (n) { root.appendChild(n); });

  function id(item) { return item.id; }

  // ---------- Hand-picked set ----------

  var manual = load(MANUAL_KEY, []);

  function pickedIds() {
    return R ? LETTERS.filter(function (item) { return R.isPicked("letter", item.id); }).map(id) : manual;
  }

  function togglePicked(item, on) {
    if (R) {
      R.setPicked("letter", item.id, on);
    } else {
      manual = on ? manual.concat([item.id]) : manual.filter(function (x) { return x !== item.id; });
      save(MANUAL_KEY, manual);
    }
    renderChips();
  }

  function setAllPicked(on) {
    LETTERS.forEach(function (item) { if (R) R.setPicked("letter", item.id, on); });
    if (!R) {
      manual = on ? LETTERS.map(id) : [];
      save(MANUAL_KEY, manual);
    }
    renderChips();
  }

  function renderChips() {
    var picked = pickedIds();
    chips.textContent = "";
    LETTERS.forEach(function (item) {
      var on = picked.indexOf(item.id) !== -1;
      var chip = button("lq-chip" + (on ? " is-on" : ""), item.text, function () { togglePicked(item, !on); });
      chip.lang = "pl";
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      chips.appendChild(chip);
    });
    startPicked.disabled = !picked.length;
    startPicked.textContent = picked.length ? "Start with " + picked.length : "Pick some letters";
  }

  function startManual() {
    var picked = pickedIds();
    if (!picked.length) return;
    picker.hidden = true;
    if (R) {
      R.saveSet("manual");
      fillSets();
      setSelect.value = "manual";
    }
    start(picked, "manual");
  }

  function showPicker() {
    renderChips();
    picker.hidden = false;
    card.hidden = true;
    done.hidden = true;
    stats.textContent = "";
  }

  // A letter said just as in English is described with itself ("b as in bed"), so its card gives
  // the answer away. The "all" round leaves those out; a set you rated or picked keeps them.
  function saysItself(item) {
    return item.sound.toLowerCase().indexOf(item.text.toLowerCase() + " as in ") === 0;
  }
  var PLAIN = LETTERS.filter(saysItself);
  var plainNote = el("p", "pl-muted pl-small", "Letters said as in English (" +
    PLAIN.map(function (item) { return item.text; }).join(", ") + ") are left out of this round. Rate or pick them to practise them.");
  plainNote.hidden = true;
  filters.insertAdjacentElement("afterend", plainNote);

  // Starts a round on one of the menu's sets: all, or with ratings hard, normal, easy, manual.
  function startSet(name) {
    if (name === "all") return start(LETTERS.filter(function (item) { return !saysItself(item); }).map(id), "all");
    var ids = R ? R.filter(LETTERS, "letter", name, id).map(id) : [];
    if (ids.length) return start(ids, name);
    card.hidden = true;
    done.hidden = true;
    stats.textContent = name === "manual"
      ? "No letters picked yet. Choose some, or tap Pick on a card."
      : "No letters marked " + name + " yet. Rate letters with the buttons on each card.";
  }

  setSelect.addEventListener("change", function () {
    var v = setSelect.value;
    if (v === "choose") return showPicker();
    if (v === "custom") return;
    picker.hidden = true;
    if (R) R.saveSet(v);
    startSet(v);
  });

  // Ratings changed (here or on a word card): refresh the counts in the menu.
  window.addEventListener("polish:ratings", function () {
    if (R) fillSets();
  });

  // ---------- Round ----------

  var round = null; // {set, ids, deck, index, right, wrong, answered, item}

  function start(ids, label) {
    var deck = Q.buildDeck(LETTERS, ids, Math.random);
    if (!deck.length) return;
    round = { set: label || "custom", ids: ids, deck: deck, index: 0, right: 0, wrong: [], answered: false };
    plainNote.hidden = label !== "all" || !PLAIN.length;
    picker.hidden = true;
    done.hidden = true;
    card.hidden = false;
    show();
  }

  function show() {
    var item = round.deck[round.index];
    round.item = item;
    round.answered = false;
    front.textContent = item.text;
    // Hearing the letter would give the answer away, so it can be tapped only once answered.
    front.dataset.say = "off";
    if (rate) rate.update("letter", item.id);
    options.textContent = "";
    Q.makeOptions(item, LETTERS, Math.random).forEach(function (sound, i) {
      var b = button("pl-button lq-option", null, function () { answer(b, sound); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      b.appendChild(document.createTextNode(sound));
      b.dataset.sound = sound;
      options.appendChild(b);
    });
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
  }

  function renderStats() {
    stats.textContent = "Card " + (round.index + 1) + " of " + round.deck.length +
      " · " + round.right + " right · " + round.wrong.length + " wrong";
  }

  function answer(chosen, sound) {
    if (round.answered) return;
    round.answered = true;
    var item = round.item;
    var right = sound === item.sound;
    delete front.dataset.say;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.sound === item.sound) b.classList.add("is-right");
    });
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(item.id);
      mistakes = Q.addMistake(mistakes, item);
      save(MISTAKES_KEY, mistakes);
    }
    showFeedback(item, right, mistakes[Q.mistakeKey(item)] || 0);
    renderStats();
    next.hidden = false;
    next.textContent = round.index + 1 < round.deck.length ? "Next" : "See results";
    undo.hidden = right;
    next.focus();
  }

  // A mistap: forget the mistake and ask the same card again with the same options.
  function undoAnswer() {
    if (!round || !round.answered || undo.hidden) return;
    round.wrong.pop();
    P.forgetMistake(Q.mistakeKey(round.item));
    round.answered = false;
    front.dataset.say = "off";
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    P.reopenOptions(options);
  }

  function showFeedback(item, right, missed) {
    feedback.textContent = "";
    feedback.appendChild(el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"),
      right ? "Right!" : "Not quite. " + item.text + " sounds like: " + item.sound));
    if (item.ipa) feedback.appendChild(el("p", "pl-muted pl-small", "/" + item.ipa + "/"));
    var example = firstExample(item);
    if (example) {
      var ex = el("p", "lq-example");
      var word = el("strong", null, example[0]);
      word.lang = "pl";
      ex.appendChild(word);
      if (example[1]) ex.appendChild(document.createTextNode(" · " + example[1]));
      ex.appendChild(speakButton(example[0]));
      feedback.appendChild(ex);
    }
    if (item.en) feedback.appendChild(line("EN", item.en));
    if (item.uk) feedback.appendChild(line("UK", item.uk, "uk"));
    if (item.note) {
      var note = el("p", "pl-muted pl-small");
      if (P) {
        var text = P.noteText(item.note);
        note.appendChild(text);
        if (text.classList.contains("pl-uk-only")) note.classList.add("pl-uk-only");
      } else note.textContent = item.note;
      feedback.appendChild(note);
    }
    if (item.softSign) {
      feedback.appendChild(P ? P.softSignNote(item.softSign) : el("p", "pl-small", "ь " + item.softSign));
    }
    if (item.exceptions && item.exceptions.length) {
      if (P) {
        feedback.appendChild(P.exceptionList(item.exceptions));
      } else {
        item.exceptions.forEach(function (text) { feedback.appendChild(el("p", "pl-small", "⚠ " + text)); });
      }
    }
    if (missed) {
      feedback.appendChild(el("p", "pl-muted pl-small",
        "Missed " + missed + (missed === 1 ? " time" : " times") + " so far."));
    }
    feedback.hidden = false;
  }

  function firstExample(item) {
    return item.examples && item.examples[0];
  }

  function line(label, text, lang) {
    var p = el("p", lang === "uk" ? "pl-uk-only" : null);
    p.appendChild(el("span", "pl-label", label));
    var span = el("span", null, text);
    if (lang) span.lang = lang;
    p.appendChild(span);
    return p;
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
      at: new Date().toISOString(), set: round.set, total: total, right: round.right, wrong: round.wrong.slice(),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" +
      (round.wrong.length ? ". Missed: " + round.wrong.map(function (x) { return byId[x].text; }).join(", ") : ". No mistakes!");
    retryMissed.hidden = !round.wrong.length;
    stats.textContent = "";
    (round.wrong.length ? retryMissed : again).focus();
  }

  var byId = {};
  LETTERS.forEach(function (item) { byId[item.id] = item; });

  // Keyboard shortcuts while the quiz is on screen and you're not typing.
  document.addEventListener("keydown", function (e) {
    if (!round || card.hidden || !root.offsetParent) return;
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.children.length && !round.answered) {
      e.preventDefault();
      options.children[n - 1].click();
    } else if (P.isUndoKey(e) && round.answered && !undo.hidden) {
      e.preventDefault();
      undoAnswer();
    } else if (e.key === "Enter" && round.answered && e.target !== next) {
      e.preventDefault();
      advance();
    } else if ((e.key === "s" || e.key === "S") && round.answered && firstExample(round.item)) {
      say(firstExample(round.item)[0]);
    }
  });

  window.PolishLettersQuiz = {
    // Starts a round on these letter ids (all letters when empty). `label` is saved with the result.
    start: function (ids, label) {
      started = true;
      var some = ids && ids.length;
      customLabel = label || "Selected letters";
      fillSets(some ? "custom" : "all");
      start(some ? ids : null, label || "custom");
    },
    // letters-page.js shows the list before bringing a letter (#letter-<id>) into view.
    showList: function () { setMode(false); },
  };

  fromHash();

})();
