// Phrases quiz: each card is a phrase from phrases-data.js. "English → Polish" shows what you want
// to say (and the setting) and offers four Polish phrases; "Polish → English" says a phrase and
// offers four meanings. Wrong answers come from the same setting first and never mean the same
// (quiz.js makeMeaningOptions, with the `near` groups). After a wrong pick the card shows what
// both phrases mean and why the right one is said that way, in English and Ukrainian.
//
// Storage (exported with every other "polish." key):
//   polish.mistakes      {"phrase:<pl>": count, ...}  shared with the other quizzes
//   polish.quiz          [{at, kind: "phrase", set, total, right, wrong: [pl]}, ...]  newest last
//   polish.phrasesQuiz   {setting, mode}  the last filters
(function () {
  var Q = window.PolishQuiz;
  var R = window.PolishRatings;
  var A = window.PolishPage;
  var DATA = window.POLISH_PHRASES;
  var ITEMS = window.POLISH_PHRASE_LIST || [];
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var FILTERS_KEY = "polish.phrasesQuiz";
  var ROUND_SIZE = 15;
  if (!Q || !A || !DATA || !ITEMS.length) return;

  var byId = {};
  ITEMS.forEach(function (item) { byId[item.pl] = item; });

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

  function ukSpan(text, cls) {
    var n = el("span", cls, " · " + text);
    n.lang = "uk";
    return n;
  }

  function mistakeKey(item) { return "phrase:" + item.pl; }
  function id(item) { return item.pl; }

  // ---------- Filters ----------

  var settingSelect = $("phq-setting");
  var modeSelect = $("phq-mode");
  var setSelect = $("phq-set");

  function option(select, value, text) {
    var o = el("option", null, text);
    o.value = value;
    select.appendChild(o);
  }

  option(settingSelect, "all", "All settings");
  DATA.settings.forEach(function (s) { option(settingSelect, s.id, s.title + " (" + s.phrases.length + ")"); });

  function hasSetting(v) { return DATA.settings.some(function (s) { return s.id === v; }); }
  var saved = load(FILTERS_KEY, {});
  var fromHash = decodeURIComponent(location.hash.slice(1));
  if (hasSetting(fromHash)) settingSelect.value = fromHash;
  else if (saved.setting && hasSetting(saved.setting)) settingSelect.value = saved.setting;
  if (saved.mode === "mean") modeSelect.value = "mean";

  function filtered() {
    var s = settingSelect.value;
    return s === "all" ? ITEMS : ITEMS.filter(function (p) { return p.topic === s; });
  }

  function fillSets() {
    if (!R) {
      setSelect.hidden = true;
      return;
    }
    R.fillSelect(setSelect, filtered(), "phrase", id);
  }
  fillSets();

  function onFilter() {
    save(FILTERS_KEY, { setting: settingSelect.value, mode: modeSelect.value });
    if (R) R.saveSet(setSelect.value);
    fillSets();
    startFiltered();
  }
  settingSelect.addEventListener("change", onFilter);
  modeSelect.addEventListener("change", onFilter);
  setSelect.addEventListener("change", onFilter);
  window.addEventListener("polish:ratings", function () { fillSets(); });

  // ---------- Card ----------

  var card = $("phq-card"), label = $("phq-label"), prompt = $("phq-prompt"), options = $("phq-options"),
    feedback = $("phq-feedback"), next = $("phq-next"), stats = $("phq-stats"),
    done = $("phq-done"), doneText = $("phq-done-text"), retry = $("phq-retry"), again = $("phq-again");

  var rate = R ? R.control(document, "phrase", ITEMS[0].pl) : null;
  if (rate) {
    rate.classList.add("lq-rate");
    $("phq-rate").appendChild(rate);
  }

  next.addEventListener("click", function () { advance(); });
  var undo = A.undoButton(function () { undoAnswer(); });
  options.insertAdjacentElement("afterend", undo);
  retry.addEventListener("click", function () { start(round.wrong.map(function (x) { return byId[x]; }), "missed"); });
  again.addEventListener("click", function () { startFiltered(); });

  var round = null; // {set, mode, deck, index, right, wrong, answered, item, picked}

  function startFiltered() {
    var pool = filtered();
    var set = R ? setSelect.value : "all";
    if (R && set !== "all") pool = R.filter(pool, "phrase", set, id);
    if (!pool.length) {
      round = null;
      card.hidden = true;
      done.hidden = true;
      stats.textContent = set === "manual"
        ? "No phrases picked here yet. Tap Pick on a card to add it."
        : set !== "all" ? "No phrases marked " + set + " here yet. Rate phrases with the buttons on each card."
          : "Nothing to practise with these filters.";
      return;
    }
    start(Q.shuffle(pool).slice(0, ROUND_SIZE), set);
  }

  function start(items, set) {
    if (!items.length) return;
    round = { set: set, mode: modeSelect.value, deck: Q.shuffle(items), index: 0, right: 0, wrong: [], answered: false };
    done.hidden = true;
    card.hidden = false;
    show();
  }

  function say(text) { if (text) A.say(text, true); }

  // English → Polish: the meaning is the question and the Polish shows once answered.
  // Polish → English: the Polish phrase, heard and seen, is the question.
  function renderPrompt(item, answered) {
    prompt.textContent = "";
    if (round.mode === "say") {
      prompt.appendChild(el("p", "pl-muted pl-small phq-sub", "How do you say it in Polish?"));
      var q = el("p", "phq-say", item.en);
      if (item.uk) q.appendChild(ukSpan(item.uk, "pl-muted"));
      prompt.appendChild(q);
      if (answered) prompt.appendChild(polishLine(item));
    } else {
      prompt.appendChild(el("p", "pl-muted pl-small phq-sub", "What does it mean?"));
      prompt.appendChild(polishLine(item));
    }
  }

  function polishLine(item) {
    var line = el("p", "phq-say phq-say-pl");
    var t = el("span", null, item.pl);
    t.lang = "pl";
    line.appendChild(t);
    line.appendChild(A.speakButtons(item.pl));
    return line;
  }

  function show() {
    var item = round.deck[round.index];
    round.item = item;
    round.answered = false;
    label.textContent = item.setting.title + " · " + item.setting.pl;
    if (rate) rate.update("phrase", item.pl);
    renderPrompt(item, false);
    options.textContent = "";
    // Wrong answers from the same setting first; the whole list when the deck is one setting.
    Q.makeMeaningOptions(item, ITEMS, Math.random).forEach(function (o, i) {
      var b = el("button", "pl-button lq-option cq-option");
      b.type = "button";
      b.addEventListener("click", function () { answer(b, o); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      var text = el("span", "cq-option-text");
      if (round.mode === "say") {
        // A button, so tapping picks it rather than reading it out (it is read out after).
        text.textContent = o.pl;
        text.lang = "pl";
      } else {
        text.textContent = o.en;
        if (o.uk) text.appendChild(ukSpan(o.uk, "pl-muted"));
      }
      b.appendChild(text);
      b.dataset.pl = o.pl;
      options.appendChild(b);
    });
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    if (round.mode === "mean") say(item.pl);
  }

  function renderStats() {
    stats.textContent = "Card " + (round.index + 1) + " of " + round.deck.length +
      " · " + round.right + " right · " + round.wrong.length + " wrong";
  }

  function answer(chosen, picked) {
    if (round.answered) return;
    round.answered = true;
    var item = round.item;
    var right = picked.pl === item.pl;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.pl === item.pl) b.classList.add("is-right");
    });
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(item.pl);
      mistakes = Object.assign({}, mistakes);
      mistakes[mistakeKey(item)] = (mistakes[mistakeKey(item)] || 0) + 1;
      save(MISTAKES_KEY, mistakes);
    }
    renderPrompt(item, true);
    showFeedback(item, picked, right, mistakes[mistakeKey(item)] || 0);
    if (round.mode === "say") say(item.pl);
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
    A.forgetMistake(mistakeKey(round.item));
    round.answered = false;
    renderPrompt(round.item, false);
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    A.reopenOptions(options);
  }

  // What the right phrase and the picked one mean, then why the right one is said that way.
  function rule(item, picked) {
    var en = "{" + item.pl + "} means **" + item.en + "**" + stop(item.en);
    var uk = item.uk ? "{" + item.pl + "} означає **" + item.uk + "**" + stop(item.uk) : "";
    if (picked && picked.pl !== item.pl) {
      var pickedPl = picked.pl.replace(/\.$/, "");
      en += " You picked {" + pickedPl + "}: " + picked.en + stop(picked.en);
      if (uk && picked.uk) uk += " Ви вибрали {" + pickedPl + "}: " + picked.uk + stop(picked.uk);
    }
    if (item.why) {
      en += " " + item.why.en;
      if (uk && item.why.uk) uk += " " + item.why.uk;
    }
    return { en: en, uk: uk };
  }

  // A full stop after a meaning, unless it already ends a sentence.
  function stop(text) { return /[.?!]$/.test(text) ? "" : "."; }

  // English → Polish: the other three choices, so each Polish phrase on the card can be heard.
  function otherChoices(item) {
    var box = el("ul", "phq-others pl-small");
    Array.prototype.forEach.call(options.children, function (b) {
      var o = byId[b.dataset.pl];
      if (!o || o.pl === item.pl) return;
      var li = el("li");
      var t = el("span", "pl-say-inline", o.pl);
      t.lang = "pl";
      t.tabIndex = 0;
      t.title = "Tap to hear";
      li.appendChild(t);
      li.appendChild(el("span", "pl-muted", " = " + o.en));
      if (o.uk) li.appendChild(ukSpan(o.uk, "pl-muted"));
      box.appendChild(li);
    });
    return box;
  }

  function showFeedback(item, picked, right, missed) {
    feedback.textContent = "";
    var verdict = el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"));
    verdict.appendChild(document.createTextNode(right ? "Right!" : "Not quite."));
    feedback.appendChild(verdict);
    if (right) {
      // A right answer still gets the explanation, without the comparison.
      if (item.why) feedback.appendChild(A.ruleBox(item.why)).classList.add("phq-why");
    } else if (A.ruleBox) {
      feedback.appendChild(A.ruleBox(rule(item, picked)));
    }
    if (round.mode === "say") {
      var others = el("details", "phq-others-box");
      others.appendChild(el("summary", "pl-small", "The other choices"));
      others.appendChild(otherChoices(item));
      feedback.appendChild(others);
    }
    var link = el("a", "pl-small", "All phrases: " + item.setting.title);
    link.href = "../phrases/#" + item.setting.id;
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
      at: new Date().toISOString(), kind: "phrase", set: round.set, total: total, right: round.right, wrong: round.wrong.slice(),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = "";
    doneText.appendChild(document.createTextNode(round.right + " of " + total + " right" + (round.wrong.length ? ". Missed: " : ". No mistakes!")));
    round.wrong.forEach(function (x, i) {
      if (i) doneText.appendChild(document.createTextNode(" "));
      var s = el("span", null, x);
      s.lang = "pl";
      doneText.appendChild(s);
    });
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
    } else if ((e.key === "s" || e.key === "S") && (round.answered || round.mode === "mean")) {
      say(round.item.pl);
    }
  });

  startFiltered();
})();
