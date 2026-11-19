// Verb tenses quiz page. Each card shows a verb, a person and a tense, and an example sentence
// with the form's ending left blank ("Dziecko zrobi___ to." / "The child would do it."); pick
// the ending from four. The answer then fills in, with the whole sentence to hear. Sentences
// come from ../verbs/verbs-examples.js; without them the card shows the bare form ("ono zrobi___"). Questions come from the verb tables in
// ../verbs/verbs-data.js, logic from verbs-quiz-core.js, audio from ../common.js
// (PolishAudio / PolishPage), and Hard / Normal / Easy sets from PolishRatings (kind "verb", id = infinitive).
//
// Storage (exported with every other "polish." key):
//   polish.mistakes      {"verb:<infinitive>:<tense>:<person>[:<gender>]": count, ...}  shared with words and letters
//   polish.quiz          [{at, kind: "verb", set, tense, total, right, wrong: [keys]}, ...]  newest last
//   polish.verbsQuiz     {tense, size}  the last choices
(function () {
  var Q = window.PolishVerbsQuiz;
  var R = window.PolishRatings;
  var MISTAKES_KEY = "polish.mistakes";
  var HISTORY_KEY = "polish.quiz";
  var PREFS_KEY = "polish.verbsQuiz";
  var HISTORY_LIMIT = 200;
  var SIZES = [10, 20, 40, 0];

  var root = document.getElementById("verbs-quiz");
  var DATA = window.POLISH_VERBS;
  if (!root || !Q) return;
  if (!DATA || !DATA.verbs || !DATA.verbs.length) {
    document.getElementById("vq-empty").hidden = false;
    return;
  }
  var VERBS = DATA.verbs;
  var TENSES = DATA.tenses;
  var ALL = Q.buildQuestions(DATA, VERBS, null); // wrong endings come from every form, not just this round's

  // Who the form is for, in English: "I · masculine", "she", "we (let's)".
  var THIRD = { m: "he", f: "she", n: "it", v: "they · men or mixed", nv: "they · women, children, things" };
  function personText(q) {
    if (q.gender && q.gender !== "inf" && q.person.charAt(0) === "3") return THIRD[q.gender];
    var p = DATA.persons.filter(function (x) { return x.id === q.person; })[0];
    var text = p ? p.en : q.person;
    if (q.tense.id === "imperative" && q.person === "1p") text = "we (let's)";
    if (q.gender && q.gender !== "inf" && DATA.genders[q.gender]) text += " · " + DATA.genders[q.gender].en;
    return text;
  }

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

  function polish(tag, cls, text) {
    var n = el(tag, cls, text);
    n.lang = "pl";
    return n;
  }

  // ---------- Listening ----------

  var SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z" />' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></svg>';

  // The shared audio in ../common.js (PolishAudio / PolishPage); a plain speaker if it's missing.
  function audio() { return window.PolishAudio || window.PolishPage; }

  // Firefox's own voices click after each word, so there (as on the main Polish page) the
  // fallback plays Google Translate's speech audio.
  var fallbackPlayer = null;
  function say(text) {
    if (!text) return;
    var P = audio();
    if (P && P.say) return P.say(text, true);
    if (P && P.sayGenerated) return P.sayGenerated(text, true);
    if (/Firefox\//.test(navigator.userAgent) || !("speechSynthesis" in window)) {
      if (!fallbackPlayer) fallbackPlayer = new Audio();
      fallbackPlayer.src = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pl&q=" + encodeURIComponent(text);
      fallbackPlayer.play().catch(function () { /* blocked or offline */ });
      return;
    }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    var voice = speechSynthesis.getVoices().filter(function (v) { return v.lang.toLowerCase().indexOf("pl") === 0; })[0];
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }

  function speakButton(text) {
    var P = audio();
    if (P && P.speakButtons) return P.speakButtons(text);
    var box = el("span", "pl-speaks");
    var b = button("pl-speak", null, function () { say(text); });
    b.innerHTML = SPEAKER;
    b.title = "Say it";
    b.setAttribute("aria-label", "Say " + text);
    box.appendChild(b);
    return box;
  }

  // ---------- Layout ----------

  var prefs = load(PREFS_KEY, {});
  if (!TENSES.some(function (t) { return t.id === prefs.tense; })) prefs.tense = "all";
  if (SIZES.indexOf(prefs.size) === -1) prefs.size = 20;

  var tenseSelect = el("select", "pl-input");
  tenseSelect.setAttribute("aria-label", "Which tense");
  addOption(tenseSelect, "all", "All tenses");
  TENSES.forEach(function (t) { addOption(tenseSelect, t.id, t.name); });
  tenseSelect.value = prefs.tense;

  var setSelect = el("select", "pl-input");
  setSelect.setAttribute("aria-label", "Which verbs: all, or the ones you marked hard, normal or easy, or picked");
  function fillSets() { if (R) R.fillSelect(setSelect, VERBS, "verb", verbId); }
  fillSets();
  if (!R) setSelect.hidden = true;

  var sizeSelect = el("select", "pl-input");
  sizeSelect.setAttribute("aria-label", "Cards per round");
  SIZES.forEach(function (n) { addOption(sizeSelect, String(n), n ? n + " cards" : "Every form"); });
  sizeSelect.value = String(prefs.size);

  function addOption(select, value, text) {
    var o = el("option", null, text);
    o.value = value;
    select.appendChild(o);
  }

  var filters = el("div", "pl-filters");
  [tenseSelect, setSelect, sizeSelect].forEach(function (n) { filters.appendChild(n); });

  var stats = el("p", "pl-muted pl-small");

  var card = el("div", "pl-card lq-card vq-card");
  card.setAttribute("aria-live", "polite");
  var cue = el("p", "pl-card-topic");
  var whoBox = el("div");
  var contextBox = el("div");
  var verbLine = el("p", "vq-verb");
  var word = polish("p", "pl-card-front vq-front");
  var meaningLine = el("p", "vq-meaning");
  var options = el("div", "lq-options");
  var feedback = el("div", "pl-card-back lq-feedback");
  feedback.hidden = true;
  var next = button("pl-button pl-primary", "Next", function () { advance(); });
  next.hidden = true;
  var rate = R ? R.control(document, "verb", VERBS[0].inf) : null;
  if (rate) rate.classList.add("lq-rate");
  [cue, whoBox, rate, verbLine, contextBox, word, meaningLine, options, feedback, next].forEach(function (n) { if (n) card.appendChild(n); });
  var undo = audio().undoButton(function () { undoAnswer(); });
  options.insertAdjacentElement("afterend", undo);
  // Show / Hide Ukrainian at the top: the Ukrainian of a form often is the answer (czytali, читали).

  var done = el("div", "pl-card");
  done.hidden = true;
  var doneTitle = polish("p", "pl-card-front", "Gotowe!");
  var doneText = el("p", "pl-muted");
  var doneList = el("div", "vq-missed");
  var retryMissed = button("pl-button pl-primary", "Practise the ones I missed", function () {
    start(round.missed, "missed");
  });
  var again = button("pl-link", "New round", function () { startFromMenus(); });
  [doneTitle, doneText, doneList, retryMissed, again].forEach(function (n) { done.appendChild(n); });

  var keys = el("p", "pl-muted pl-small pl-keys",
    "Keyboard: 1 to 4 pick an ending, Enter goes to the next card, U takes back a wrong tap, S says the whole sentence.");

  [filters, stats, card, done, keys].forEach(function (n) { root.appendChild(n); });

  function verbId(v) { return v.inf; }

  // ---------- Round ----------

  var round = null; // {set, tense, deck, index, right, wrong: [keys], missed: [questions], answered, q}

  function chosenVerbs() {
    return R ? R.filter(VERBS, "verb", setSelect.value, verbId) : VERBS;
  }

  function startFromMenus() {
    var tense = tenseSelect.value;
    var verbs = chosenVerbs();
    var pool = Q.buildQuestions(DATA, verbs, tense === "all" ? null : [tense]);
    if (!pool.length) {
      round = null;
      card.hidden = true;
      done.hidden = true;
      stats.textContent = setSelect.value === "manual"
        ? "No verbs picked yet. Tap Pick on a card to add one."
        : "No verbs marked " + setSelect.value + " yet. Rate verbs with the buttons on each card.";
      return;
    }
    start(Q.buildRound(pool, Number(sizeSelect.value), Math.random), setSelect.value || "all");
  }

  function start(deck, label) {
    if (!deck.length) return;
    round = { set: label, tense: tenseSelect.value, deck: Q.shuffle(deck), index: 0, right: 0, wrong: [], missed: [],
      answered: false };
    done.hidden = true;
    card.hidden = false;
    show();
  }

  function cueText(q) {
    return [q.tense.name, personText(q)];
  }

  function show() {
    var q = round.deck[round.index];
    round.q = q;
    round.answered = false;

    cue.textContent = cueText(q).join(" · ");
    // Singular or plural and the gender, always spelled out; then who is talking, as a sentence.
    var P = audio();
    whoBox.textContent = "";
    if (P && P.whoLine) whoBox.appendChild(P.whoLine(Q.who(q)));
    contextBox.textContent = "";
    // Who is talking (Mówi Ewa:), unless the sentence already names who it's about (Dziecko ...).
    var ctx = Q.context(q);
    var ex = exampleOf(q);
    if (ctx && !(ex && ex.named) && P && P.contextLine) contextBox.appendChild(P.contextLine(ctx[0], ctx[1]));

    verbLine.textContent = "";
    verbLine.appendChild(polish("strong", null, q.verb.inf));
    verbLine.appendChild(speakButton(q.verb.inf));
    var meaning = el("span", "pl-muted", q.verb.en || "");
    if (q.verb.uk) {
      var uk = el("span", null, (q.verb.en ? " · " : "") + q.verb.uk);
      uk.lang = "uk";
      meaning.appendChild(uk);
    }
    if (q.verb.en || q.verb.uk) verbLine.appendChild(meaning);

    renderWord(q, null);
    renderMeaning(q);
    if (rate) rate.update("verb", q.verb.inf);

    options.textContent = "";
    Q.makeOptions(q, ALL, Math.random).forEach(function (ending, i) {
      var b = button("pl-button lq-option", null, function () { answer(b, ending); });
      b.appendChild(el("span", "lq-key", String(i + 1)));
      b.appendChild(endingLabel(ending));
      if (!ending) b.setAttribute("aria-label", "No ending");
      b.dataset.ending = ending;
      options.appendChild(b);
    });
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
  }

  // An ending as shown on a button: "-łem", or ∅ for the bare stem (rób), as in the case quiz.
  function endingLabel(ending) {
    var span = polish("span", "vq-option-text", ending ? "-" + ending : "\u2205");
    span.dataset.say = "off";
    return span;
  }

  // The example sentence for a question, worked out once: see PolishVerbsQuiz.example.
  function exampleOf(q) {
    if (!("example" in q)) q.example = Q.example ? Q.example(q) : null;
    return q.example;
  }

  // The sentence being built: the words before, the part that stays, then a gap, or once
  // answered the chosen ending in colour, then the rest (" się", " to."). Without an example
  // sentence, the pronoun and the bare form ("ja robi___").
  function renderWord(q, chosen) {
    word.textContent = "";
    var ex = exampleOf(q);
    word.classList.toggle("vq-sentence", !!ex);
    // Half a word says nothing; once answered, a tap says the whole sentence.
    word.dataset.say = chosen === null ? "off" : spoken(q);
    var before = ex ? ex.before : q.before;
    var cut = before.lastIndexOf(" ") + 1;
    if (ex && cut) word.appendChild(document.createTextNode(before.slice(0, cut)));
    else if (!ex && q.pronoun) word.appendChild(el("span", "vq-pronoun", q.pronoun + " "));
    // The stem and its ending stay on one line, so the ending never looks like a separate word.
    var stem = el("span", "vq-stem", ex ? before.slice(cut) : q.before);
    if (chosen === null) {
      stem.appendChild(el("span", "vq-gap", "___"));
    } else {
      var end = el("span", "vq-ending" + (chosen ? "" : " is-zero") + (chosen === q.ending ? "" : " is-wrong"), chosen || "\u2205");
      stem.appendChild(end);
    }
    word.appendChild(stem);
    var after = ex ? ex.after : q.after;
    if (after) word.appendChild(document.createTextNode(after));
  }

  // What the sentence means: "The child would do it. · Дитина зробила б це.", or without a
  // sentence what this exact form means: "they would read · вони читали б".
  function renderMeaning(q) {
    meaningLine.textContent = "";
    var T = window.PolishVerbsTranslate;
    var gender = q.gender === "inf" ? null : q.gender;
    var ex = exampleOf(q);
    var enText = ex ? ex.en : T ? T.en(q.verb, q.tense.id, q.person, gender) : "";
    var ukText = ex ? ex.uk : T ? T.uk(q.verb, q.tense.id, q.person, gender) : "";
    if (enText) meaningLine.appendChild(el("span", "vq-meaning-en", enText));
    if (ukText) {
      // The separator sits inside the Ukrainian span, so hiding Ukrainian hides it too.
      var ukSpan = el("span", "vq-meaning-uk", (enText ? " · " : "") + ukText);
      ukSpan.lang = "uk";
      meaningLine.appendChild(ukSpan);
    }
    meaningLine.hidden = !enText && !ukText;
  }

  function renderStats() {
    stats.textContent = "Card " + (round.index + 1) + " of " + round.deck.length +
      " · " + round.right + " right · " + round.wrong.length + " wrong";
  }

  function spoken(q) {
    var ex = exampleOf(q);
    return ex ? ex.pl : (q.pronoun ? q.pronoun + " " : "") + q.text;
  }

  function answer(chosen, ending) {
    if (round.answered) return;
    round.answered = true;
    var q = round.q;
    var right = ending === q.ending;
    Array.prototype.forEach.call(options.children, function (b) {
      b.disabled = true;
      if (b.dataset.ending === q.ending) b.classList.add("is-right");
    });
    renderWord(q, ending);
    var mistakes = load(MISTAKES_KEY, {});
    if (right) {
      round.right++;
    } else {
      chosen.classList.add("is-wrong");
      round.wrong.push(q.key);
      round.missed.push(q);
      mistakes = Q.addMistake(mistakes, q);
      save(MISTAKES_KEY, mistakes);
    }
    showFeedback(q, right, mistakes[q.key] || 0);
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
    round.missed.pop();
    audio().forgetMistake(round.q.key);
    round.answered = false;
    renderWord(round.q, null);
    feedback.hidden = true;
    next.hidden = true;
    undo.hidden = true;
    renderStats();
    audio().reopenOptions(options);
  }

  // The whole sentence (or form), with the ending coloured, and a button to hear it.
  function formLine(q) {
    var p = polish("p", "vq-answer");
    p.dataset.say = spoken(q);
    var ex = exampleOf(q);
    var text = el("span");
    if (!ex && q.pronoun) text.appendChild(el("span", "vq-pronoun", q.pronoun + " "));
    text.appendChild(document.createTextNode(ex ? ex.before : q.before));
    text.appendChild(el("span", "vq-ending", q.ending));
    var after = ex ? ex.after : q.after;
    if (after) text.appendChild(document.createTextNode(after));
    p.appendChild(text);
    p.appendChild(speakButton(spoken(q)));
    return p;
  }

  // The conditional said the other common way, with by moved forward: "Dziecko by to zrobiło."
  function altLine(q) {
    var ex = exampleOf(q);
    if (!ex || !ex.alt) return null;
    var box = el("div", "vq-alt");
    box.appendChild(el("p", "pl-muted pl-small", "Also said, with by moved forward:"));
    var p = polish("p", "vq-answer vq-alt-pl");
    p.dataset.say = ex.alt;
    p.appendChild(el("span", null, ex.alt));
    p.appendChild(speakButton(ex.alt));
    box.appendChild(p);
    return box;
  }

  function showFeedback(q, right, missed) {
    feedback.textContent = "";
    feedback.appendChild(el("p", "lq-verdict " + (right ? "is-right" : "is-wrong"), right ? "Right!" : "Not quite."));
    // A wrong pick gets the rule for this tense and person, in English and Ukrainian.
    var P = audio();
    if (!right && P && P.ruleBox) feedback.appendChild(P.ruleBox(Q.rule(DATA, q)));
    feedback.appendChild(formLine(q));
    var alt = altLine(q);
    if (alt) feedback.appendChild(alt);
    if (missed) {
      feedback.appendChild(el("p", "pl-muted pl-small",
        "Missed " + missed + (missed === 1 ? " time" : " times") + " so far."));
    }
    feedback.hidden = false;
    say(spoken(q));
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
    var history = load(HISTORY_KEY, []).concat([{
      at: new Date().toISOString(), kind: "verb", set: round.set, tense: round.tense, total: total,
      right: round.right, wrong: round.wrong.slice(),
    }]);
    save(HISTORY_KEY, history.slice(-HISTORY_LIMIT));
    card.hidden = true;
    done.hidden = false;
    doneText.textContent = round.right + " of " + total + " right" + (round.missed.length ? ". Missed:" : ". No mistakes!");
    doneList.textContent = "";
    round.missed.forEach(function (q) {
      var line = formLine(q);
      line.insertBefore(el("span", "pl-muted pl-small", q.tense.name + " · " + personText(q)), line.firstChild);
      doneList.appendChild(line);
    });
    retryMissed.hidden = !round.missed.length;
    stats.textContent = "";
    (round.missed.length ? retryMissed : again).focus();
  }

  // ---------- Menus ----------

  function savePrefs() {
    save(PREFS_KEY, { tense: tenseSelect.value, size: Number(sizeSelect.value) });
  }

  tenseSelect.addEventListener("change", function () { savePrefs(); startFromMenus(); });
  sizeSelect.addEventListener("change", function () { savePrefs(); startFromMenus(); });
  setSelect.addEventListener("change", function () {
    if (R) R.saveSet(setSelect.value);
    startFromMenus();
  });
  // Marking a verb only refreshes the menu's numbers; the round in progress stays as it is.
  window.addEventListener("polish:ratings", function (e) {
    if (e.detail.kind === "verb") fillSets();
  });

  // Keyboard shortcuts while you're not typing in a menu.
  document.addEventListener("keydown", function (e) {
    if (!round || card.hidden) return;
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.children.length && !round.answered) {
      e.preventDefault();
      options.children[n - 1].click();
    } else if (audio().isUndoKey(e) && round.answered && !undo.hidden) {
      e.preventDefault();
      undoAnswer();
    } else if (e.key === "Enter" && round.answered && e.target !== next) {
      e.preventDefault();
      advance();
    } else if ((e.key === "s" || e.key === "S") && round.answered) {
      say(spoken(round.q));
    }
  });

  startFromMenus();
})();
