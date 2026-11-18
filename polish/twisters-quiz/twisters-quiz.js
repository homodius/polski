// Tongue twister quiz page: each card shows a tongue twister with one word left out and four
// spellings to choose from, the word itself and look-alikes with one tricky sound swapped
// (drill.js). After answering, the whole tongue twister is shown with its tricky sounds linked to
// the Letters page, and can be heard at normal speed and slowly. Filters pick the level and the
// Hard / Normal / Easy / Picked sets shared with the tongue twister list (ratings.js).
//
// Storage (exported with every other "polish." key):
//   polish.mistakes      {"twister:<id>": count, ...}  shared with letters, words and cases
//   polish.quiz          [{at, kind: "twister", set, total, right, wrong: [ids]}, ...]  newest last
//   polish.twistersQuiz  {level}  the last level picked
(function () {
  var D = window.PolishTwisterDrill;
  var Q = window.PolishQuiz;
  var R = window.PolishRatings;
  var P = window.PolishPage;
  var TWISTERS = window.POLISH_TWISTERS || [];
  var LETTERS = window.POLISH_LETTERS || [];
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var FILTERS_KEY = "polish.twistersQuiz";
  var SLOW = 0.6;
  if (!D || !Q || !P || !TWISTERS.length) return;

  var byId = {};
  TWISTERS.forEach(function (t) { byId[t.id] = t; });
  var LETTER = {};
  LETTERS.forEach(function (l) { LETTER[l.id] = l; });
  var node = P.node;

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

  function button(cls, text, onClick) {
    var b = node("button", cls, text);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  var TURTLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15a8 6 0 0 1 16 0z"/>' +
    '<path d="M20 13h1.5a1.5 1.5 0 0 0 0-3H19"/><path d="M7 15v3M17 15v3"/><path d="M4 15H2"/></svg>';

  // Normal speed and slowly, as on the tongue twister list.
  function sayButtons(text) {
    var box = node("span", "pl-speaks");
    var normal = P.iconButton(P.SPEAKER, "Say it (S)", "Say " + text);
    normal.addEventListener("click", function () { P.sayGenerated(text, true); });
    var slow = P.iconButton(TURTLE, "Say it slowly", "Say " + text + " slowly");
    slow.classList.add("pl-speak-slow");
    slow.addEventListener("click", function () { P.sayGenerated(text, true, SLOW); });
    box.appendChild(normal);
    box.appendChild(slow);
    return box;
  }

  // ---------- Filters ----------

  var levelSelect = $("tq-level");
  var setSelect = $("tq-set");

  var saved = load(FILTERS_KEY, {});
  if (/^(easy|medium|hard)$/.test(saved.level)) levelSelect.value = saved.level;

  function id(t) { return t.id; }

  function filtered() {
    return TWISTERS.filter(function (t) { return levelSelect.value === "all" || t.level === levelSelect.value; });
  }

  // The set menu is the tongue twisters' own, so its choice is not saved over the words' one.
  function fillSets() {
    if (!R) {
      setSelect.hidden = true;
      return;
    }
    var keep = setSelect.value || "all";
    R.fillSelect(setSelect, filtered(), "twister", id);
    setSelect.value = keep;
    if (!setSelect.value) setSelect.value = "all";
  }
  fillSets();

  function onFilter() {
    save(FILTERS_KEY, { level: levelSelect.value });
    fillSets();
    startFiltered();
  }
  levelSelect.addEventListener("change", onFilter);
  setSelect.addEventListener("change", onFilter);
  window.addEventListener("polish:ratings", function (e) {
    if (!e.detail || e.detail.kind === "twister") fillSets();
  });

  // ---------- Card ----------

  var card = $("tq-card"), level = $("tq-level-label"), front = $("tq-front"), meaning = $("tq-meaning"),
    options = $("tq-options"), feedback = $("tq-feedback"), next = $("tq-next"), stats = $("tq-stats"),
    done = $("tq-done"), doneText = $("tq-done-text"), retry = $("tq-retry"), again = $("tq-again");

  // Show / Hide Ukrainian at the top: the Ukrainian line can give the missing word away.

  var rate = R ? R.control(document, "twister", TWISTERS[0].id) : null;
  if (rate) {
    rate.classList.add("lq-rate");
    $("tq-rate").appendChild(rate);
  }

  next.addEventListener("click", function () { advance(); });
  retry.addEventListener("click", function () { start(round.wrong.map(function (x) { return byId[x]; }), "missed"); });
  again.addEventListener("click", function () { startFiltered(); });

  var round = null; // {set, deck, index, right, wrong, answered, twister, blank, answer}

  function startFiltered() {
    var pool = filtered();
    var set = R ? setSelect.value || "all" : "all";
    if (R && set !== "all") pool = R.filter(pool, "twister", set, id);
    if (!pool.length) {
      round = null;
      card.hidden = true;
      done.hidden = true;
      stats.textContent = set === "manual"
        ? "No tongue twisters picked here yet. Tap Pick on a card to add it."
        : set !== "all" ? "No tongue twisters marked " + set + " here yet. Rate them with the buttons on each card."
          : "Nothing to practise with these filters.";
      return;
    }
    start(pool, set);
  }

  function start(items, set) {
    if (!items.length) return;
    round = { set: set, deck: Q.shuffle(items), index: 0, right: 0, wrong: [], answered: false };
    done.hidden = true;
    card.hidden = false;
    show();
  }

  // The tricky sounds of the tongue twister, as links to the Letters page.
  function letterLink(text, letterId) {
    var a = node("a", "pl-twister-mark", text);
    a.href = "../letters/#letter-" + encodeURIComponent(letterId);
    a.lang = "pl";
    if (LETTER[letterId]) a.title = LETTER[letterId].text + ": " + LETTER[letterId].sound;
    return a;
  }

  // The tongue twister with the missing word as a gap, or filled in and highlighted.
  function renderText(t, answered) {
    front.textContent = "";
    D.parts(t.pl).forEach(function (p) {
      if (p.index !== round.blank) {
        front.appendChild(document.createTextNode(p.text));
      } else if (answered) {
        front.appendChild(node("span", "tq-word", p.text));
      } else {
        front.appendChild(node("span", "tq-gap", "_____"));
      }
    });
    front.dataset.say = answered ? t.pl : "off";
  }

  function line(label, text, lang) {
    var p = node("p", "pl-muted");
    p.appendChild(node("span", "pl-label", label));
    p.appendChild(document.createTextNode(" "));
    var span = node("span", "", text);
    if (lang) span.lang = lang;
    // The whole Ukrainian line, label too, so Show / Hide Ukrainian hides it all.
    if (lang === "uk") p.lang = "uk";
    p.appendChild(span);
    return p;
  }

  function show() {
    var t = round.deck[round.index];
    round.twister = t;
    round.answered = false;
    round.blank = D.pickBlank(t, Math.random);
    var made = D.makeOptions(t, round.blank, TWISTERS, Math.random);
    round.answer = made.answer;
    level.textContent = "Tongue twister " + (TWISTERS.indexOf(t) + 1) + " · " + t.level;
    if (rate) rate.update("twister", t.id);

    renderText(t, false);
    meaning.textContent = "";
    meaning.appendChild(line("EN", t.en));
    meaning.appendChild(line("UK", t.uk, "uk"));

    options.textContent = "";
    made.options.forEach(function (word, i) {
      var b = button("pl-button lq-option tq-option", null, function () { answer(b, word); });
      b.appendChild(node("span", "lq-key", String(i + 1)));
      b.appendChild(node("span", "tq-option-text", word));
      b.dataset.word = word;
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

  function answer(chosen, word) {
    if (round.answered) return;
    round.answered = true;
    var t = round.twister;
    var right = word === round.answer;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.word === round.answer) b.classList.add("is-right");
    });
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(t.id);
      mistakes = Object.assign({}, mistakes);
      mistakes[D.mistakeKey(t)] = (mistakes[D.mistakeKey(t)] || 0) + 1;
      save(MISTAKES_KEY, mistakes);
    }
    renderText(t, true);
    showFeedback(t, right, word, mistakes[D.mistakeKey(t)] || 0);
    P.sayGenerated(t.pl, true);
    renderStats();
    next.hidden = false;
    next.textContent = round.index + 1 < round.deck.length ? "Next" : "See results";
    next.focus();
  }

  function showFeedback(t, right, picked, missed) {
    feedback.textContent = "";
    var verdict = node("p", "lq-verdict " + (right ? "is-right" : "is-wrong"));
    var text = node("span");
    text.appendChild(document.createTextNode(right ? "Right! " : "Not quite. It's "));
    var w = node("span", null, round.answer);
    w.lang = "pl";
    text.appendChild(w);
    if (!right) {
      text.appendChild(document.createTextNode(", not "));
      var p = node("span", null, picked);
      p.lang = "pl";
      text.appendChild(p);
    }
    verdict.appendChild(text);
    feedback.appendChild(verdict);

    var whole = node("p", "tq-whole");
    var said = node("span", null, t.pl);
    said.lang = "pl";
    whole.appendChild(said);
    whole.appendChild(sayButtons(t.pl));
    feedback.appendChild(whole);

    var sounds = (t.sounds || []).filter(function (s) { return LETTER[s]; });
    if (sounds.length) {
      var list = node("p", "pl-small pl-twister-sounds", "Sounds: ");
      sounds.forEach(function (s, n) {
        if (n) list.appendChild(document.createTextNode(" · "));
        list.appendChild(letterLink(LETTER[s].text, s));
      });
      feedback.appendChild(list);
    }
    if (t.note) feedback.appendChild(P.noteText(t.note, "pl-muted pl-small"));
    if (missed) {
      feedback.appendChild(node("p", "pl-muted pl-small",
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
      at: new Date().toISOString(), kind: "twister", set: round.set, total: total, right: round.right, wrong: round.wrong.slice(),
    }));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" + (round.wrong.length
      ? ". Missed " + round.wrong.length + (round.wrong.length === 1 ? " tongue twister." : " tongue twisters.")
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
      P.sayGenerated(round.twister.pl, true);
    }
  });

  startFiltered();
})();
