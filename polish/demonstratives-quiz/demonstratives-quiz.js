// This and that quiz: each card is a sentence with a gap for a form of ten, tamten, ten sam or
// taki, with the case and gender at the top and four forms to choose from. After answering the
// whole sentence is shown (and can be heard) with the ending highlighted; a wrong pick shows the
// rule in English and Ukrainian. Filters pick the word, the case and the Hard / Normal / Easy /
// Picked sets from ratings.js.
//
// Storage (exported with every other "polish." key):
//   polish.mistakes             {"demo:<word>:<slot>:<case>": count, ...}  shared with the other quizzes
//   polish.quiz                 [{at, kind: "demo", set, total, right, wrong: [ids]}, ...]  newest last
//   polish.demonstrativesQuiz   {word, caseId}  the last filters
(function () {
  var D = window.PolishDemonstratives;
  var Q = window.PolishQuiz;
  var R = window.PolishRatings;
  var DATA = window.POLISH_DEMONSTRATIVES;
  var A = window.PolishPage;
  var CASE_INFO = window.POLISH_CASES ? window.POLISH_CASES.cases : [];
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var FILTERS_KEY = "polish.demonstrativesQuiz";
  var ROUND_SIZE = 20;
  if (!D || !Q || !DATA || !A) return;

  var ITEMS = D.buildItems(DATA);
  var byId = {};
  ITEMS.forEach(function (item) { byId[item.id] = item; });
  var BY_CASE = {};
  CASE_INFO.forEach(function (c) { BY_CASE[c.id] = c; });

  function $(id) { return document.getElementById(id); }

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

  function say(text) { if (text) A.say(text, true); }

  function capital(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  // ---------- Filters ----------

  var wordSelect = $("dq-word");
  var caseSelect = $("dq-case");
  var setSelect = $("dq-set");

  function option(select, value, text) {
    var o = el("option", null, text);
    o.value = value;
    select.appendChild(o);
  }

  option(wordSelect, "all", "All words");
  DATA.words.forEach(function (w) {
    var forms = D.plain(D.formOf(w, "m", "nom")) + " / " + D.plain(D.formOf(w, "f", "nom")) + " / " + D.plain(D.formOf(w, "n", "nom"));
    option(wordSelect, w.id, forms + " (" + w.en + ")");
  });
  option(caseSelect, "all", "All cases");
  DATA.CASES.forEach(function (id) {
    var c = BY_CASE[id];
    option(caseSelect, id, c ? capital(c.en) + " · " + c.pl + " (" + c.q + ")" : id);
  });

  var saved = load(FILTERS_KEY, {});
  if (saved.word && DATA.words.some(function (w) { return w.id === saved.word; })) wordSelect.value = saved.word;
  if (saved.caseId && DATA.CASES.indexOf(saved.caseId) !== -1) caseSelect.value = saved.caseId;

  function id(item) { return item.id; }

  function filtered() {
    return D.filterItems(ITEMS, wordSelect.value, caseSelect.value);
  }

  function fillSets() {
    if (!R) {
      setSelect.hidden = true;
      return;
    }
    R.fillSelect(setSelect, filtered(), "demo", id);
  }
  fillSets();

  function onFilter() {
    save(FILTERS_KEY, { word: wordSelect.value, caseId: caseSelect.value });
    if (R) R.saveSet(setSelect.value);
    fillSets();
    startFiltered();
  }
  wordSelect.addEventListener("change", onFilter);
  caseSelect.addEventListener("change", onFilter);
  setSelect.addEventListener("change", onFilter);
  window.addEventListener("polish:ratings", function () { fillSets(); });

  // ---------- Card ----------

  var card = $("dq-card"), caseLabel = $("dq-case-label"), base = $("dq-base"), front = $("dq-front"),
    cue = $("dq-cue"), options = $("dq-options"), feedback = $("dq-feedback"), next = $("dq-next"),
    stats = $("dq-stats"), done = $("dq-done"), doneText = $("dq-done-text"), retry = $("dq-retry"), again = $("dq-again");

  // Show / Hide Ukrainian at the top: цю or тією gives the answer away.

  var rate = R ? R.control(document, "demo", ITEMS[0].id) : null;
  if (rate) {
    rate.classList.add("lq-rate");
    $("dq-rate").appendChild(rate);
  }

  next.addEventListener("click", function () { advance(); });
  var undo = A.undoButton(function () { undoAnswer(); });
  options.insertAdjacentElement("afterend", undo);
  retry.addEventListener("click", function () { start(round.wrong.map(function (x) { return byId[x]; }), "missed"); });
  again.addEventListener("click", function () { startFiltered(); });

  var round = null; // {set, deck, index, right, wrong, answered, item}

  function startFiltered() {
    var pool = filtered();
    var set = R ? setSelect.value : "all";
    if (R && set !== "all") pool = R.filter(pool, "demo", set, id);
    if (!pool.length) {
      round = null;
      card.hidden = true;
      done.hidden = true;
      stats.textContent = set === "manual"
        ? "No cards picked here yet. Tap Pick on a card to add it."
        : set !== "all" ? "No cards marked " + set + " here yet. Rate cards with the buttons on each card."
          : "Nothing to practise with these filters.";
      return;
    }
    start(Q.shuffle(pool).slice(0, ROUND_SIZE), set);
  }

  function start(items, set) {
    if (!items.length) return;
    round = { set: set, deck: Q.shuffle(items), index: 0, right: 0, wrong: [], answered: false };
    done.hidden = true;
    card.hidden = false;
    show();
  }

  function caseText(item) {
    var c = BY_CASE[item.caseId];
    var name = c ? capital(c.en) + " · " + c.pl + " · " + c.q : item.caseId;
    // Singular slots say so too, so number and gender are always both on the card.
    var slot = D.SLOT_NAMES[item.slot][0].toLowerCase();
    return name + " · " + (/^pl/.test(item.slot) ? "" : "singular · ") + slot;
  }

  // "t|ego sam|ego" with the endings picked out in colour.
  function appendForm(box, form) {
    form.split(" ").forEach(function (part, i) {
      if (i) box.appendChild(document.createTextNode(" "));
      var bits = part.split("|");
      box.appendChild(el("span", "cq-stem", bits[0]));
      if (bits.length > 1 && bits[1]) box.appendChild(el("span", "cq-ending", bits[1]));
    });
  }

  function renderForm(item, answered) {
    front.textContent = "";
    if (answered) appendForm(front, item.form);
    else front.appendChild(el("span", "cq-gap", "___"));
    front.dataset.say = answered ? item.answer : "off";
  }

  function renderCue(item, answered) {
    cue.textContent = "";
    var parts = item.cue.split("___");
    var line = el("span", "cq-sentence");
    line.lang = "pl";
    line.appendChild(document.createTextNode(parts[0]));
    if (answered) {
      var w = el("strong");
      appendForm(w, D.inSentence(item, item.form));
      line.appendChild(w);
    } else {
      line.appendChild(el("span", "cq-gap", "___"));
    }
    line.appendChild(document.createTextNode(parts[1] || ""));
    line.dataset.say = answered ? D.sentence(item) : "off";
    cue.appendChild(line);
    if (answered) cue.appendChild(A.speakButtons(D.sentence(item)));
  }

  function show() {
    var item = round.deck[round.index];
    round.item = item;
    round.answered = false;
    caseLabel.textContent = caseText(item);
    if (rate) rate.update("demo", item.id);

    // Which word, and what the sentence means.
    base.textContent = "";
    var w = el("strong", null, item.word.pl);
    w.lang = "pl";
    base.appendChild(w);
    base.appendChild(A.speakButtons(item.word.pl));
    base.appendChild(el("span", "pl-muted", " " + item.word.en));
    var meaning = el("span", "pl-muted dq-meaning", item.en);
    var uk = el("span", null, " · " + item.uk);
    uk.lang = "uk";
    meaning.appendChild(uk);
    base.appendChild(meaning);

    renderForm(item, false);
    renderCue(item, false);
    options.textContent = "";
    D.makeOptions(item, Math.random).forEach(function (form, i) {
      var b = button("pl-button lq-option cq-option", null, function () { answer(b, form); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      var text = el("span", "cq-option-text", form);
      b.appendChild(text);
      b.dataset.form = form;
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

  function answer(chosen, form) {
    if (round.answered) return;
    round.answered = true;
    var item = round.item;
    var right = form === item.answer;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.form === item.answer) b.classList.add("is-right");
    });
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(item.id);
      mistakes = Object.assign({}, mistakes);
      mistakes[D.mistakeKey(item)] = (mistakes[D.mistakeKey(item)] || 0) + 1;
      save(MISTAKES_KEY, mistakes);
    }
    renderForm(item, true);
    renderCue(item, true);
    showFeedback(item, right, mistakes[D.mistakeKey(item)] || 0);
    say(D.sentence(item));
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
    A.forgetMistake(D.mistakeKey(round.item));
    round.answered = false;
    renderForm(round.item, false);
    renderCue(round.item, false);
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    A.reopenOptions(options);
  }

  function showFeedback(item, right, missed) {
    feedback.textContent = "";
    var verdict = el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"));
    var text = el("span");
    text.appendChild(document.createTextNode(right ? "Right! " : "Not quite. It's "));
    var form = el("span", null, item.answer);
    form.lang = "pl";
    text.appendChild(form);
    text.appendChild(document.createTextNode(right ? "" : "."));
    var ukForm = el("span", "pl-muted", " · " + item.ukForm);
    ukForm.lang = "uk";
    text.appendChild(ukForm);
    verdict.appendChild(text);
    verdict.appendChild(A.speakButtons(item.answer));
    feedback.appendChild(verdict);
    // A wrong pick gets the rule for this case and gender, in English and Ukrainian.
    if (!right && A.ruleBox) feedback.appendChild(A.ruleBox(D.rule(item, CASE_INFO)));
    var link = el("a", "pl-small", "All forms of " + item.word.pl);
    link.href = "../demonstratives/#" + item.word.id;
    var more = el("p");
    more.appendChild(link);
    feedback.appendChild(more);
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
      at: new Date().toISOString(), kind: "demo", set: round.set, total: total, right: round.right, wrong: round.wrong.slice(),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" + (round.wrong.length
      ? ". Missed: " + round.wrong.map(function (x) { return D.sentence(byId[x]); }).join(" ")
      : ". No mistakes!");
    retry.hidden = !round.wrong.length;
    stats.textContent = "";
    (round.wrong.length ? retry : again).focus();
  }

  document.addEventListener("keydown", function (e) {
    if (!round || card.hidden) return;
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.children.length && !round.answered) {
      e.preventDefault();
      options.children[n - 1].click();
    } else if (A.isUndoKey(e) && round.answered && !undo.hidden) {
      e.preventDefault();
      undoAnswer();
    } else if (e.key === "Enter" && round.answered && e.target !== next) {
      e.preventDefault();
      advance();
    } else if ((e.key === "s" || e.key === "S") && round.answered) {
      say(D.sentence(round.item));
    }
  });

  startFiltered();
})();
