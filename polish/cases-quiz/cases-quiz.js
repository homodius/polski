// Case endings quiz page: each card shows a noun's unchanging stem in a sentence with a gap
// and four endings to choose from. After answering, the whole form and sentence are shown
// (and can be heard), with the ending highlighted. Filters pick the case, singular or plural,
// and the Hard / Normal / Easy / Picked sets from ratings.js.
//
// Storage (exported with every other "polish." key):
//   polish.mistakes  {"case:<word>.<sg|pl>.<case>": count, ...}  shared with letters and words
//   polish.quiz      [{at, kind: "case", set, total, right, wrong: [ids]}, ...]  newest last
//   polish.casesQuiz {caseId, num}  the last filters
(function () {
  var D = window.PolishCaseDrill;
  var Q = window.PolishQuiz;
  var R = window.PolishRatings;
  var DATA = window.POLISH_CASE_DRILL;
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var FILTERS_KEY = "polish.casesQuiz";
  var ROUND_SIZE = 20;
  if (!D || !Q || !DATA) return;

  var ITEMS = D.buildItems(DATA);
  var byId = {};
  ITEMS.forEach(function (item) { byId[item.id] = item; });

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

  // ---------- Listening ----------
  // Shared audio (common.js) when it is loaded; otherwise the browser's Polish voice, or
  // Google Translate's speech audio in Firefox, whose built-in voices click.

  var A = window.PolishAudio || window.PolishPage || null;
  var player = null;

  function say(text) {
    if (!text) return;
    if (A) return (A.say || A.sayGenerated)(text, true);
    if (/Firefox\//.test(navigator.userAgent) || !("speechSynthesis" in window)) {
      if (!player) player = new Audio();
      player.src = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pl&q=" + encodeURIComponent(text);
      player.play().catch(function () { /* blocked or offline */ });
      return;
    }
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    var voice = speechSynthesis.getVoices().filter(function (v) { return v.lang.toLowerCase().indexOf("pl") === 0; })[0];
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  var SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z" />' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>';

  function speakButton(text) {
    if (A && A.speakButtons) return A.speakButtons(text);
    var box = el("span", "pl-speaks");
    var b = button("pl-speak", null, function () { say(text); });
    b.innerHTML = SPEAKER;
    b.title = "Say it";
    b.setAttribute("aria-label", "Say " + text);
    box.appendChild(b);
    return box;
  }

  // ---------- Filters ----------

  var caseSelect = $("cq-case");
  var numSelect = $("cq-num");
  var setSelect = $("cq-set");

  function option(select, value, text) {
    var o = el("option", null, text);
    o.value = value;
    select.appendChild(o);
  }

  option(caseSelect, "all", "All cases");
  DATA.cases.forEach(function (c) { option(caseSelect, c.id, c.name + " · " + c.pl + " (" + c.q + ")"); });

  var saved = load(FILTERS_KEY, {});
  if (byCase(saved.caseId)) caseSelect.value = saved.caseId;
  if (saved.num === "sg" || saved.num === "pl") numSelect.value = saved.num;

  function byCase(id) {
    return id === "all" || DATA.cases.some(function (c) { return c.id === id; });
  }

  function id(item) { return item.id; }

  function filtered() {
    return D.filterItems(ITEMS, caseSelect.value, numSelect.value);
  }

  function fillSets() {
    if (!R) {
      setSelect.hidden = true;
      return;
    }
    R.fillSelect(setSelect, filtered(), "case", id);
  }
  fillSets();

  function onFilter() {
    save(FILTERS_KEY, { caseId: caseSelect.value, num: numSelect.value });
    if (R) R.saveSet(setSelect.value);
    fillSets();
    startFiltered();
  }
  caseSelect.addEventListener("change", onFilter);
  numSelect.addEventListener("change", onFilter);
  setSelect.addEventListener("change", onFilter);
  window.addEventListener("polish:ratings", function () { fillSets(); });

  // ---------- Card ----------

  var whoBox = $("cq-who"), contextBox = $("cq-context");
  var card = $("cq-card"), caseLabel = $("cq-case-label"), word = $("cq-word"), front = $("cq-front"),
    cue = $("cq-cue"), options = $("cq-options"), feedback = $("cq-feedback"), next = $("cq-next"),
    stats = $("cq-stats"), done = $("cq-done"), doneText = $("cq-done-text"), retry = $("cq-retry"), again = $("cq-again");

  // Show / Hide Ukrainian at the top: the Ukrainian of the word can hint at the ending.

  var rate = R ? R.control(document, "case", ITEMS[0].id) : null;
  if (rate) {
    rate.classList.add("lq-rate");
    $("cq-rate").appendChild(rate);
  }

  next.addEventListener("click", function () { advance(); });
  retry.addEventListener("click", function () { start(round.wrong.map(function (x) { return byId[x]; }), "missed"); });
  again.addEventListener("click", function () { startFiltered(); });

  var round = null; // {set, deck, index, right, wrong, answered, item}

  function startFiltered() {
    var pool = filtered();
    var set = R ? setSelect.value : "all";
    if (R && set !== "all") pool = R.filter(pool, "case", set, id);
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
    var c = item.caseInfo;
    return c.name + " · " + c.pl + " · " + c.q;
  }

  // The stem, then either a gap or the ending picked out in colour.
  function renderForm(item, answered) {
    front.textContent = "";
    front.appendChild(el("span", "cq-stem", item.stem));
    if (answered) front.appendChild(el("span", "cq-ending" + (item.ending ? "" : " is-zero"), item.ending || "∅"));
    else front.appendChild(el("span", "cq-gap", "___"));
    front.dataset.say = answered ? item.form : "off";
  }

  // The sentence with a gap, or with the answer in place and highlighted.
  function renderCue(item, answered) {
    cue.textContent = "";
    var parts = item.cue.split("___");
    var line = el("span", "cq-sentence");
    line.lang = "pl";
    line.appendChild(document.createTextNode(parts[0]));
    if (answered) {
      var w = el("strong");
      w.appendChild(document.createTextNode(item.stem));
      w.appendChild(el("span", "cq-ending", item.ending));
      line.appendChild(w);
    } else {
      line.appendChild(el("span", "cq-gap", "___"));
    }
    line.appendChild(document.createTextNode(parts[1] || ""));
    line.dataset.say = answered ? D.sentence(item) : "off";
    cue.appendChild(line);
    if (answered) cue.appendChild(speakButton(D.sentence(item)));
  }

  function show() {
    var item = round.deck[round.index];
    round.item = item;
    round.answered = false;
    caseLabel.textContent = caseText(item);
    // Singular or plural, the gender, and the pronoun, always spelled out under the case.
    whoBox.textContent = "";
    if (A && A.whoLine) whoBox.appendChild(A.whoLine(D.who(item)));
    // A sentence that says who or what we are talking about, before the one with the gap.
    contextBox.textContent = "";
    if (item.ctx && A && A.contextLine) contextBox.appendChild(A.contextLine(item.ctx[0], item.ctx[1]));
    if (rate) rate.update("case", item.id);

    word.textContent = "";
    var base = el("strong", null, item.word);
    base.lang = "pl";
    word.appendChild(base);
    word.appendChild(speakButton(item.word));
    word.appendChild(el("span", "pl-muted", " " + item.en));
    if (item.uk) {
      var uk = el("span", "pl-muted", " · " + item.uk);
      uk.lang = "uk";
      word.appendChild(uk);
    }

    renderForm(item, false);
    renderCue(item, false);
    options.textContent = "";
    D.makeOptions(item, ITEMS, Math.random).forEach(function (ending, i) {
      var b = button("pl-button lq-option cq-option", null, function () { answer(b, ending); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      b.appendChild(el("span", "cq-option-text", D.label(ending)));
      if (!ending) b.setAttribute("aria-label", "No ending");
      b.dataset.ending = ending;
      options.appendChild(b);
    });
    feedback.hidden = true;
    next.hidden = true;
    renderStats();
  }

  function renderStats() {
    stats.textContent = "Card " + (round.index + 1) + " of " + round.deck.length +
      " · " + round.right + " right · " + round.wrong.length + " wrong";
  }

  function isRight(item, ending) {
    return ending === item.ending || item.also.indexOf(ending) !== -1;
  }

  function answer(chosen, ending) {
    if (round.answered) return;
    round.answered = true;
    var item = round.item;
    var right = isRight(item, ending);
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (isRight(item, b.dataset.ending)) b.classList.add("is-right");
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
    say(item.form);
    renderStats();
    next.hidden = false;
    next.textContent = round.index + 1 < round.deck.length ? "Next" : "See results";
    next.focus();
  }

  function showFeedback(item, right, missed) {
    feedback.textContent = "";
    var verdict = el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"));
    var text = el("span");
    text.appendChild(document.createTextNode(right ? "Right! " : "Not quite. It's "));
    var form = el("span", null, item.form);
    form.lang = "pl";
    text.appendChild(form);
    text.appendChild(document.createTextNode(right ? "" : "."));
    verdict.appendChild(text);
    verdict.appendChild(speakButton(item.form));
    feedback.appendChild(verdict);
    // A wrong pick gets the rule for this case, number and gender, in English and Ukrainian.
    if (!right && A && A.ruleBox) feedback.appendChild(A.ruleBox(D.rule(item, ITEMS)));
    if (item.also.length) {
      feedback.appendChild(el("p", "pl-muted pl-small", "Also right: " + item.also.map(function (e) {
        return item.stem + e;
      }).join(", ") + "."));
    }
    if (item.cueEn) feedback.appendChild(el("p", null, item.cueEn));
    if (item.note && A && A.noteText) {
      var why = el("p", "pl-muted pl-small");
      why.appendChild(A.noteText(item.note));
      feedback.appendChild(why);
    }
    if (item.stemChanged) {
      var note = el("p", "pl-muted pl-small cq-change");
      note.appendChild(document.createTextNode("The stem changes here: "));
      var a = el("span", null, item.stemChanged);
      a.lang = "pl";
      var b = el("span", null, item.stem + "-");
      b.lang = "pl";
      b.dataset.say = item.form;
      note.appendChild(a);
      note.appendChild(document.createTextNode(" → "));
      note.appendChild(b);
      feedback.appendChild(note);
    }
    var link = el("a", "pl-small", "Rules for the " + item.caseInfo.name.toLowerCase());
    link.href = "../cases/#" + item.caseId;
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
      at: new Date().toISOString(), kind: "case", set: round.set, total: total, right: round.right, wrong: round.wrong.slice(),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" + (round.wrong.length
      ? ". Missed: " + round.wrong.map(function (x) { return byId[x].form; }).join(", ")
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
    } else if (e.key === "Enter" && round.answered && e.target !== next) {
      e.preventDefault();
      advance();
    } else if ((e.key === "s" || e.key === "S") && round.answered) {
      say(D.sentence(round.item));
    }
  });

  startFiltered();
})();
