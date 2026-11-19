// The translation quiz: an English sentence (with its Ukrainian, shown only while the menu's Show
// Ukrainian switch is on) from the Words page's examples (examples.js); the visitor writes it in Polish and gets
// the example's Polish as the answer, compared word by word (translator.js), plus what a free
// translator says and their own Polish translated back. Settings in polish.translateQuiz.
(function () {
  var PP = window.PolishPage, TR = window.PolishTranslate, Q = window.PolishQuiz;
  var SETTINGS_KEY = "polish.translateQuiz";
  var GOOD = 80;

  function $(id) { return document.getElementById(id); }
  function node(tag, cls, text) { return PP.node(tag, cls, text); }

  function load() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
  }
  function save(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked */ }
  }

  // Every example sentence, once: {pl, en, uk, word, mine}.
  var mineWords = {};
  (window.POLISH_VOCAB || []).forEach(function (w) { if (w.topic === "my words") mineWords[w.pl] = true; });
  var seen = {};
  var ALL = [];
  Object.keys(window.POLISH_EXAMPLES || {}).forEach(function (word) {
    var ex = window.POLISH_EXAMPLES[word];
    if (!Array.isArray(ex)) return;
    (Array.isArray(ex[0]) ? ex : [ex]).forEach(function (e) {
      if (!e || !e[0] || !e[1] || seen[e[0]]) return;
      seen[e[0]] = true;
      ALL.push({ pl: e[0], en: e[1], uk: e[2] || "", word: word, mine: !!mineWords[word] });
    });
  });

  var settings = load();
  var setSel = $("trq-set"), sizeSel = $("trq-size");
  setSel.value = settings.set === "mine" ? "mine" : "all";
  sizeSel.value = String([5, 10, 20].indexOf(settings.size) !== -1 ? settings.size : 10);

  var card = $("trq-card"), mine = $("trq-mine"), feedback = $("trq-feedback");
  var nextBtn = $("trq-next"), checkBtn = $("trq-check"), skipBtn = $("trq-skip");

  var mineSay = PP.iconButton(PP.SPEAKER, "Hear your Polish", "Say your Polish");
  mineSay.addEventListener("click", function () { if (mine.value.trim()) PP.say(mine.value.trim(), true); });
  $("trq-mine-say").appendChild(mineSay);

  var deck = [], at = 0, scores = [], answered = false;

  // A typo or a Check pressed too early: take the answer back and keep typing. It's practice.
  var editBtn = PP.undoButton(function () { reopen(); });
  editBtn.textContent = "Mistyped? Edit my answer";
  editBtn.title = "Take back this answer and change it";
  nextBtn.insertAdjacentElement("afterend", editBtn);

  function reopen() {
    if (!answered || editBtn.hidden) return;
    scores.pop();
    answered = false;
    mine.readOnly = false;
    feedback.hidden = true;
    feedback.innerHTML = "";
    nextBtn.hidden = true;
    editBtn.hidden = true;
    checkBtn.hidden = false;
    skipBtn.hidden = false;
    mine.focus({ preventScroll: true });
  }

  function pool() {
    return setSel.value === "mine" ? ALL.filter(function (s) { return s.mine; }) : ALL;
  }

  function start(items) {
    var size = Number(sizeSel.value);
    deck = (items || Q.shuffle(pool())).slice(0, items ? items.length : size);
    at = 0;
    scores = [];
    $("trq-done").hidden = true;
    $("trq-empty").hidden = !!deck.length;
    if (!deck.length) { card.hidden = true; return; }
    showCard();
  }

  function showCard() {
    var s = deck[at];
    answered = false;
    card.hidden = false;
    $("trq-count").textContent = "Sentence " + (at + 1) + " of " + deck.length;
    $("trq-prompt").textContent = s.en;
    $("trq-uk").textContent = s.uk;
    $("trq-uk").hidden = !s.uk;
    mine.value = "";
    mine.readOnly = false;
    feedback.hidden = true;
    feedback.innerHTML = "";
    nextBtn.hidden = true;
    editBtn.hidden = true;
    checkBtn.hidden = false;
    skipBtn.hidden = false;
    mine.focus({ preventScroll: true });
  }

  function block(label, content) {
    var b = node("div", "tr-block");
    b.appendChild(node("p", "tr-block-label", label));
    if (content) b.appendChild(content);
    return b;
  }

  function polishLine(text) {
    var p = node("p", "tr-big");
    var span = node("span", "", text);
    span.lang = "pl";
    span.tabIndex = 0;
    span.title = "Tap to hear";
    p.appendChild(span);
    p.appendChild(document.createTextNode(" "));
    p.appendChild(TR.sayRow(text, "the answer"));
    return p;
  }

  function check() {
    if (answered) return;
    var s = deck[at];
    var attempt = mine.value.trim();
    answered = true;
    mine.readOnly = true;
    checkBtn.hidden = true;
    skipBtn.hidden = true;
    feedback.hidden = false;
    feedback.innerHTML = "";

    var result = attempt ? TR.compare(attempt, s.pl) : { score: 0 };
    scores.push({ item: s, score: result.score });
    feedback.appendChild(block("Answer", polishLine(s.pl)));
    if (attempt) feedback.appendChild(TR.compareView(result, attempt, s.pl, "Answer"));

    // What a translator makes of the English, and what yours says: both arrive a moment later.
    var tBlock = block("Translator says");
    var tLine = node("p", "pl-muted", "Asking…");
    tBlock.appendChild(tLine);
    feedback.appendChild(tBlock);
    TR.translate(s.en, "en", "pl").then(function (r) {
      var p = node("p", "tr-line");
      var span = node("span", "", r.text);
      span.lang = "pl";
      span.tabIndex = 0;
      p.appendChild(span);
      p.appendChild(document.createTextNode(" "));
      p.appendChild(TR.sayRow(r.text, "the translation"));
      tLine.replaceWith(p);
      tBlock.firstChild.textContent = "Translator says (" + r.by + ")";
      if (attempt && TR.compare(attempt, r.text).score > result.score) {
        tBlock.appendChild(node("p", "pl-small pl-muted", "Yours is closer to the translator's: " +
          TR.compare(attempt, r.text).score + "%."));
      }
    }, function () { tLine.textContent = "The translator didn't answer this time."; });

    if (attempt) {
      var bBlock = block("Yours, back in English");
      var bLine = node("p", "tr-back pl-muted", "Asking…");
      bBlock.appendChild(bLine);
      feedback.appendChild(bBlock);
      TR.translate(attempt, "pl", "en").then(function (r) {
        bLine.textContent = "“" + r.text + "”";
        bLine.classList.remove("pl-muted");
      }, function () { bLine.textContent = "Couldn't translate yours back."; });
    }

    nextBtn.hidden = false;
    nextBtn.textContent = at + 1 < deck.length ? "Next" : "See the result";
    editBtn.hidden = !attempt;
    nextBtn.focus({ preventScroll: true });
  }

  function next() {
    at++;
    if (at < deck.length) { showCard(); return; }
    card.hidden = true;
    var avg = Math.round(scores.reduce(function (t, s) { return t + s.score; }, 0) / Math.max(scores.length, 1));
    var low = scores.filter(function (s) { return s.score < GOOD; });
    $("trq-done-text").textContent = "Average match " + avg + "% over " + scores.length + " sentences. " +
      (low.length ? low.length + " under " + GOOD + "%." : "Every one at " + GOOD + "% or more.");
    $("trq-retry").hidden = !low.length;
    $("trq-done").hidden = false;
  }

  $("trq-form").addEventListener("submit", function (e) { e.preventDefault(); check(); });
  mine.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (answered) next(); else check();
    }
  });
  skipBtn.addEventListener("click", function () { mine.value = ""; check(); });
  nextBtn.addEventListener("click", next);
  $("trq-retry").addEventListener("click", function () {
    start(scores.filter(function (s) { return s.score < GOOD; }).map(function (s) { return s.item; }));
  });
  $("trq-again").addEventListener("click", function () { start(); });
  [setSel, sizeSel].forEach(function (sel) {
    sel.addEventListener("change", function () {
      save({ set: setSel.value, size: Number(sizeSel.value) });
      start();
    });
  });

  start();
})();
