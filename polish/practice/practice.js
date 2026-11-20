// Endless mixed Practice: one card after another from every quiz topic (word meanings, case
// endings, verb endings, ten / ta / to, phrases), never a "round" end. Each card can be answered or
// skipped; both are counted in polish.practice (practice-stats.js). Wrong answers also count in
// polish.mistakes under the same keys as the topic's own quiz, and show the rule in EN + UK.
//
// Storage (exported with every other "polish." key):
//   polish.practice        see practice-stats.js
//   polish.practiceTopics  [topic ids] switched on (default: all)
(function () {
  var P = window.PolishPage;
  var Q = window.PolishQuiz;
  var S = window.PolishPracticeStats;
  var STATS_KEY = "polish.practice";
  var TOPICS_KEY = "polish.practiceTopics";
  var MISTAKES_KEY = "polish.mistakes";
  if (!P || !Q || !S) return;

  function $(id) { return document.getElementById(id); }
  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || typeof v !== typeof fallback || Array.isArray(v) !== Array.isArray(fallback) ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pl(tag, text, cls) {
    var n = el(tag, cls, text);
    n.lang = "pl";
    return n;
  }
  function ukSpan(text) {
    var n = el("span", null, " · " + text);
    n.lang = "uk";
    return n;
  }
  function pickOne(list) { return list[Math.floor(Math.random() * list.length)]; }

  // ---------- Card makers, one per topic ----------
  // A card: {key, label, who, word: [pl, en, uk], ctx: [pl, en], before, after, big, options:
  // [{value, text, lang, uk}], right(value), answer (Polish shown in the gap), say, sentence,
  // rule {en, uk}, link [text, href]}.

  var TOPICS = [];

  var WORDS = (window.POLISH_VOCAB || []).filter(function (w) { return w.pl && w.en; });
  if (WORDS.length > 4) TOPICS.push({ id: "words", title: "Words", make: function () {
    var w = pickOne(WORDS);
    return {
      key: Q.mistakeKey(w), label: "Words · what does it mean?", big: w.pl, say: w.pl,
      options: Q.makeMeaningOptions(w, WORDS, Math.random).map(function (o) {
        return { value: o.pl, text: o.en, uk: o.uk };
      }),
      right: function (v) { return v === w.pl; },
      answer: w.pl, sentence: w.pl,
      rule: { en: "{" + w.pl + "} means **" + w.en + "**.", uk: w.uk ? "{" + w.pl + "} означає **" + w.uk + "**." : "" },
      note: w.note, link: ["All words", "../words/"],
    };
  } });

  var CD = window.PolishCaseDrill, CDATA = window.POLISH_CASE_DRILL;
  var CASE_ITEMS = CD && CDATA ? CD.buildItems(CDATA) : [];
  if (CASE_ITEMS.length) TOPICS.push({ id: "cases", title: "Cases", make: function () {
    var it = pickOne(CASE_ITEMS);
    var parts = it.cue.split("___");
    var c = it.caseInfo;
    return {
      key: CD.mistakeKey(it), label: "Cases · " + c.name + " · " + c.pl + " · " + c.q, who: CD.who(it),
      word: [it.word, it.en, it.uk], ctx: it.ctx, before: parts[0], stem: it.stem, after: parts[1] || "",
      options: CD.makeOptions(it, CASE_ITEMS, Math.random).map(function (e) {
        return { value: e, text: CD.label(e), lang: "pl" };
      }),
      right: function (v) { return v === it.ending || it.also.indexOf(v) !== -1; },
      ending: it.ending, say: it.form, sentence: CD.sentence(it), en: it.cueEn,
      rule: CD.rule(it, CASE_ITEMS), note: it.note,
      link: ["Rules for the " + c.name.toLowerCase(), "../cases/#" + it.caseId],
    };
  } });

  var VQ = window.PolishVerbsQuiz, VDATA = window.POLISH_VERBS;
  var VERB_QS = VQ && VDATA ? VQ.buildQuestions(VDATA, VDATA.verbs, null) : [];
  if (VERB_QS.length) TOPICS.push({ id: "verbs", title: "Tenses", make: function () {
    var q = pickOne(VERB_QS);
    // The form in an example sentence ("Dziecko zrobi___ to."), from ../verbs/verbs-examples.js.
    var ex = VQ.example ? VQ.example(q) : null;
    var ctx = ex && ex.named ? null : VQ.context(q);
    var cut = ex ? ex.before.lastIndexOf(" ") + 1 : 0;
    return {
      key: q.key, label: "Tenses · " + (q.tense.name || q.tense.id), who: VQ.who(q),
      word: [q.verb.inf, q.verb.en, q.verb.uk], ctx: ctx,
      before: ex ? ex.before.slice(0, cut) : "", stem: ex ? ex.before.slice(cut) : q.before, after: ex ? ex.after : q.after,
      en: ex ? ex.en : null, enUk: ex ? ex.uk : null,
      options: VQ.makeOptions(q, VERB_QS, Math.random).map(function (e) {
        return { value: e, text: e || "∅", lang: "pl" };
      }),
      right: function (v) { return v === q.ending; },
      ending: q.ending, say: ex ? ex.pl : q.text, sentence: ex ? ex.pl : q.text,
      rule: VQ.rule(VDATA, q), link: ["How to form this tense", "../verbs/"],
    };
  } });

  var DM = window.PolishDemonstratives, DDATA = window.POLISH_DEMONSTRATIVES;
  var DEMO_ITEMS = DM && DDATA ? DM.buildItems(DDATA) : [];
  var CASE_INFO = window.POLISH_CASES ? window.POLISH_CASES.cases : [];
  if (DEMO_ITEMS.length) TOPICS.push({ id: "demonstratives", title: "This & that", make: function () {
    var it = pickOne(DEMO_ITEMS);
    var parts = it.cue.split("___");
    return {
      key: DM.mistakeKey(it), label: "This & that · " + DM.SLOT_NAMES[it.slot][0],
      word: [it.word.pl, it.word.en, null], before: parts[0], stem: "", after: parts[1] || "",
      options: DM.makeOptions(it, Math.random).map(function (f) {
        return { value: f, text: DM.inSentence(it, f), lang: "pl" };
      }),
      right: function (v) { return v === it.answer; },
      ending: DM.inSentence(it, it.answer), say: DM.sentence(it), sentence: DM.sentence(it), en: it.en, enUk: it.uk,
      rule: DM.rule(it, CASE_INFO), link: ["ten, ta, to in every case", "../demonstratives/"],
    };
  } });

  // Phrases for real situations (../phrases/phrases-data.js): hear a phrase, pick what it means.
  var PHRASES = window.POLISH_PHRASE_LIST || [];
  function stop(text) { return /[.?!]$/.test(text) ? "" : "."; }
  if (PHRASES.length > 4) TOPICS.push({ id: "phrases", title: "Phrases", make: function () {
    var p = pickOne(PHRASES);
    var why = p.why || {};
    return {
      key: "phrase:" + p.pl, label: "Phrases · " + p.setting.title + " · what does it mean?", big: p.pl, say: p.pl,
      options: Q.makeMeaningOptions(p, PHRASES, Math.random).map(function (o) {
        return { value: o.pl, text: o.en, uk: o.uk };
      }),
      right: function (v) { return v === p.pl; },
      answer: p.pl, sentence: p.pl,
      rule: { en: "{" + p.pl + "} means **" + p.en + "**" + stop(p.en) + " " + (why.en || ""),
        uk: p.uk ? "{" + p.pl + "} означає **" + p.uk + "**" + stop(p.uk) + " " + (why.uk || "") : "" },
      link: ["All phrases: " + p.setting.title, "../phrases/#" + p.setting.id],
    };
  } });

  // ---------- Topic switches ----------

  var topicBox = $("pr-topics");
  var chosen = load(TOPICS_KEY, TOPICS.map(function (t) { return t.id; }));
  function active() {
    var on = TOPICS.filter(function (t) { return chosen.indexOf(t.id) !== -1; });
    return on.length ? on : TOPICS;
  }
  TOPICS.forEach(function (t) {
    var label = el("label");
    var box = el("input");
    box.type = "checkbox";
    box.checked = chosen.indexOf(t.id) !== -1;
    box.addEventListener("change", function () {
      chosen = TOPICS.filter(function (x) {
        return x === t ? box.checked : chosen.indexOf(x.id) !== -1;
      }).map(function (x) { return x.id; });
      save(TOPICS_KEY, chosen);
      if (!card || !card.answered) show(); // the current card may be from a topic just switched off
    });
    label.appendChild(box);
    label.appendChild(document.createTextNode(t.title));
    topicBox.appendChild(label);
  });

  // ---------- The card ----------

  var topicLine = $("pr-topic"), whoBox = $("pr-who"), wordLine = $("pr-word"), ctxBox = $("pr-context"),
    cue = $("pr-cue"), options = $("pr-options"), feedback = $("pr-feedback"),
    skip = $("pr-skip"), next = $("pr-next"), statsLine = $("pr-stats");
  var card = null, lastKey = null, session = { right: 0, wrong: 0, skipped: 0 };

  function nextCard() {
    for (var i = 0; i < 5; i++) {
      var t = pickOne(active());
      var c = t.make();
      c.topic = t.id;
      if (c.key !== lastKey) return c;
    }
    return c;
  }

  function renderCue(answered) {
    cue.textContent = "";
    if (card.big != null) {
      cue.appendChild(pl("span", card.big, "pr-big"));
      cue.appendChild(P.speakButtons(card.big));
      return;
    }
    var line = pl("span", null, "cq-sentence");
    line.appendChild(document.createTextNode(card.before));
    var w = el(answered ? "strong" : "span");
    if (card.stem) w.appendChild(document.createTextNode(card.stem));
    if (answered) w.appendChild(el("span", "cq-ending" + (card.ending ? "" : " is-zero"), card.ending || "∅"));
    else w.appendChild(el("span", "cq-gap", "___"));
    line.appendChild(w);
    line.appendChild(document.createTextNode(card.after));
    line.dataset.say = answered ? card.sentence : "off";
    cue.appendChild(line);
    if (answered) cue.appendChild(P.speakButtons(card.sentence));
  }

  function show() {
    card = nextCard();
    card.answered = false;
    lastKey = card.key;
    topicLine.textContent = card.label;
    whoBox.textContent = "";
    if (card.who && P.whoLine) whoBox.appendChild(P.whoLine(card.who));
    wordLine.textContent = "";
    if (card.word) {
      wordLine.appendChild(pl("strong", card.word[0]));
      wordLine.appendChild(P.speakButtons(card.word[0]));
      if (card.word[1]) wordLine.appendChild(el("span", "pl-muted", " " + card.word[1]));
      if (card.word[2]) wordLine.appendChild(ukSpan(card.word[2]));
    }
    ctxBox.textContent = "";
    if (card.ctx && P.contextLine) ctxBox.appendChild(P.contextLine(card.ctx[0], card.ctx[1]));
    renderCue(false);
    options.textContent = "";
    card.options.forEach(function (o, i) {
      var b = el("button", "pl-button lq-option cq-option");
      b.type = "button";
      b.appendChild(el("span", "lq-key", String(i + 1)));
      var text = el("span", "cq-option-text", o.text);
      if (o.lang) { text.lang = o.lang; text.dataset.say = "off"; }
      b.appendChild(text);
      if (o.uk) b.appendChild(ukSpan(o.uk));
      if (o.value === "") b.setAttribute("aria-label", "No ending");
      b.addEventListener("click", function () { answer(b, o.value); });
      b._value = o.value;
      options.appendChild(b);
    });
    feedback.hidden = true;
    next.hidden = true;
    skip.hidden = false;
    renderStats();
  }

  function count(outcome) {
    session[outcome]++;
    save(STATS_KEY, S.record(load(STATS_KEY, S.empty()), card.topic, card.key, outcome, S.today()));
    renderStats();
    renderTotals();
  }

  function answer(btn, value) {
    if (card.answered) return;
    card.answered = true;
    var right = card.right(value);
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (card.right(b._value)) b.classList.add("is-right");
    });
    if (!right) {
      btn.classList.add("is-wrong");
      var m = Object.assign({}, load(MISTAKES_KEY, {}));
      m[card.key] = (m[card.key] || 0) + 1;
      save(MISTAKES_KEY, m);
    }
    count(right ? "right" : "wrong");
    renderCue(true);
    showFeedback(right);
    P.say(card.say, true);
    skip.hidden = true;
    next.hidden = false;
    next.focus();
  }

  function showFeedback(right) {
    feedback.textContent = "";
    var verdict = el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"));
    verdict.appendChild(document.createTextNode(right ? "Right! " : "Not quite. It's "));
    verdict.appendChild(pl("span", card.say));
    verdict.appendChild(P.speakButtons(card.say));
    feedback.appendChild(verdict);
    if (!right && card.rule && P.ruleBox) feedback.appendChild(P.ruleBox(card.rule));
    if (card.en) {
      var en = el("p", null, card.en);
      if (card.enUk) en.appendChild(ukSpan(card.enUk));
      feedback.appendChild(en);
    }
    if (card.note && P.noteText) {
      var why = el("p", "pl-muted pl-small");
      why.appendChild(P.noteText(card.note));
      feedback.appendChild(why);
    }
    if (card.link) {
      var a = el("a", "pl-small", card.link[0]);
      a.href = card.link[1];
      var p = el("p");
      p.appendChild(a);
      feedback.appendChild(p);
    }
    feedback.hidden = false;
  }

  skip.addEventListener("click", function () {
    if (card.answered) return;
    count("skipped");
    show();
  });
  next.addEventListener("click", show);

  // ---------- Statistics ----------

  function renderStats() {
    statsLine.textContent = "This session: " + session.right + " right · " + session.wrong + " wrong · " +
      session.skipped + " skipped";
  }

  var totalsBox = $("pr-totals");
  function renderTotals() {
    var st = load(STATS_KEY, S.empty());
    var all = S.totals(st);
    totalsBox.textContent = "";
    if (!all.seen) {
      totalsBox.appendChild(el("p", "pl-muted pl-small", "Nothing yet. Answer or skip a card."));
      return;
    }
    var table = el("table");
    var head = el("tr");
    ["Topic", "Right", "Wrong", "Skipped"].forEach(function (h) { head.appendChild(el("th", null, h)); });
    table.appendChild(head);
    TOPICS.forEach(function (t) {
      var r = (st.topics || {})[t.id];
      if (!r) return;
      var tr = el("tr");
      [t.title, r.right || 0, r.wrong || 0, r.skipped || 0].forEach(function (v) { tr.appendChild(el("td", null, String(v))); });
      table.appendChild(tr);
    });
    var tr = el("tr");
    ["All", all.right, all.wrong, all.skipped].forEach(function (v) { tr.appendChild(el("th", null, String(v))); });
    table.appendChild(tr);
    totalsBox.appendChild(table);
    var answered = all.right + all.wrong;
    totalsBox.appendChild(el("p", "pl-muted pl-small", all.seen + " cards seen" +
      (answered ? " · " + Math.round(100 * all.right / answered) + "% of answered right" : "") +
      " · " + Math.round(100 * all.skipped / all.seen) + "% skipped."));
  }

  $("pr-reset").addEventListener("click", function () {
    try { localStorage.removeItem(STATS_KEY); } catch (e) { /* storage blocked */ }
    renderTotals();
  });

  document.addEventListener("keydown", function (e) {
    if (!card || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.children.length && !card.answered) {
      e.preventDefault();
      options.children[n - 1].click();
    } else if ((e.key === "k" || e.key === "K") && !card.answered) {
      skip.click();
    } else if (e.key === "Enter" && card.answered && e.target !== next) {
      e.preventDefault();
      show();
    }
  });

  window.addEventListener("storage", function (e) { if (e.key === STATS_KEY || e.key === null) renderTotals(); });
  renderTotals();
  show();
})();
