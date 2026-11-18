// The Translate page: the visitor writes a sentence (English or Ukrainian) and their own Polish
// for it; Compare gets a translator's Polish, compares the two word by word (translator.js) and
// translates the visitor's Polish back to English. Past sentences are kept in
// polish.translate.history (newest first), so the progress download keeps them too.
(function () {
  var PP = window.PolishPage, TR = window.PolishTranslate;
  var HISTORY_KEY = "polish.translate.history";
  var FROM_KEY = "polish.translate.from";
  var HISTORY_LIMIT = 50;
  var PLACEHOLDER = { en: "I would like a coffee, please.", uk: "Я хотів би каву, будь ласка." };

  function $(id) { return document.getElementById(id); }
  var form = $("tr-form"), from = $("tr-from"), source = $("tr-source"), mine = $("tr-mine");
  var result = $("tr-result"), go = $("tr-go");

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  from.value = load(FROM_KEY, "en") === "uk" ? "uk" : "en";
  function setFrom() {
    source.lang = from.value;
    source.placeholder = PLACEHOLDER[from.value];
  }
  setFrom();
  from.addEventListener("change", function () { save(FROM_KEY, from.value); setFrom(); });
  // Writing in Ukrainian is offered only while the menu's Show Ukrainian switch is on.
  var ukOption = from.querySelector('option[value="uk"]');
  function applyUk() {
    var on = PP.showingUk();
    ukOption.hidden = ukOption.disabled = !on;
    if (!on && from.value === "uk") { from.value = "en"; setFrom(); }
    if (on && load(FROM_KEY, "en") === "uk" && from.value !== "uk") { from.value = "uk"; setFrom(); }
  }
  applyUk();
  window.addEventListener("polish-uk-change", applyUk);

  // Hear your own attempt before comparing.
  var mineSay = PP.iconButton(PP.SPEAKER, "Hear your Polish", "Say your Polish");
  mineSay.addEventListener("click", function () { if (mine.value.trim()) PP.say(mine.value.trim(), true); });
  $("tr-mine-say").appendChild(mineSay);

  function node(tag, cls, text) { return PP.node(tag, cls, text); }

  function block(label, content) {
    var b = node("div", "tr-block");
    b.appendChild(node("p", "tr-block-label", label));
    if (content) b.appendChild(content);
    return b;
  }

  function polishLine(text, cls) {
    var p = node("p", cls || "tr-big");
    var span = node("span", "", text);
    span.lang = "pl";
    span.tabIndex = 0;
    span.title = "Tap to hear";
    p.appendChild(span);
    p.appendChild(document.createTextNode(" "));
    p.appendChild(TR.sayRow(text, "the translation"));
    return p;
  }

  function linksRow(text, lang) {
    var p = node("p", "tr-links pl-small");
    p.appendChild(document.createTextNode("Check it on"));
    TR.links(text, lang, "pl").forEach(function (l) {
      var a = node("a", "", l.label);
      a.href = l.href;
      a.target = "_blank";
      a.rel = "noopener";
      p.appendChild(a);
    });
    return p;
  }

  function failed(text) {
    return node("p", "tr-error", text + " Try again in a moment, or use the links below.");
  }

  // Shows a result: {from, source, mine, ref, by, back} (ref/back may be missing on failure).
  function show(entry) {
    result.innerHTML = "";
    result.hidden = false;
    var srcLabel = entry.from === "uk" ? "Ukrainian" : "English";
    if (entry.ref) {
      var refBlock = block("Translator (" + entry.by + ")", polishLine(entry.ref));
      result.appendChild(refBlock);
    } else {
      result.appendChild(block("Translator", failed("The translator didn't answer.")));
    }
    if (entry.mine && entry.ref) {
      result.appendChild(TR.compareView(TR.compare(entry.mine, entry.ref), entry.mine, entry.ref, "Translator"));
    } else if (entry.mine) {
      result.appendChild(block("Yours", polishLine(entry.mine, "tr-line")));
    }
    if (entry.mine) {
      var back = entry.back != null ? node("p", "tr-back", "“" + entry.back + "”") : failed("Couldn't translate yours back.");
      var b = block("Yours, back in English", back);
      if (entry.back != null) b.appendChild(node("p", "pl-small pl-muted", "You meant: “" + entry.source + "” (" + srcLabel + ")."));
      result.appendChild(b);
    }
    result.appendChild(linksRow(entry.source, entry.from));
  }

  function compareNow() {
    var text = source.value.trim();
    var attempt = mine.value.trim();
    if (!text && !attempt) { source.focus(); return; }
    var lang = from.value;
    go.disabled = true;
    go.textContent = "Asking the translator…";
    var entry = { at: Date.now(), from: lang, source: text, mine: attempt };
    var asks = [
      text ? TR.translate(text, lang, "pl").then(function (r) { entry.ref = r.text; entry.by = r.by; }, function () {}) : null,
      attempt ? TR.translate(attempt, "pl", "en").then(function (r) { entry.back = r.text; }, function () {}) : null,
    ];
    Promise.all(asks).then(function () {
      go.disabled = false;
      go.textContent = "Compare";
      if (!text) entry.source = entry.back || "";
      show(entry);
      if (entry.ref || entry.back) remember(entry);
    });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); compareNow(); });
  [source, mine].forEach(function (t) {
    t.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); compareNow(); }
    });
  });
  $("tr-clear").addEventListener("click", function () {
    source.value = "";
    mine.value = "";
    result.hidden = true;
    source.focus();
  });

  // ---------- Your sentences ----------

  function remember(entry) {
    if (entry.mine && entry.ref) entry.score = TR.compare(entry.mine, entry.ref).score;
    var list = load(HISTORY_KEY, []).filter(function (h) {
      return !(h.source === entry.source && h.mine === entry.mine && h.from === entry.from);
    });
    list.unshift(entry);
    save(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
    drawHistory();
  }

  function drawHistory() {
    var list = load(HISTORY_KEY, []);
    var ul = $("tr-history-list");
    ul.innerHTML = "";
    $("tr-history").hidden = !list.length;
    list.forEach(function (h) {
      var li = node("li");
      var src = node("span", "tr-h-source", h.source);
      src.lang = h.from || "en";
      li.appendChild(src);
      if (h.score != null) li.appendChild(node("span", "tr-h-score", h.score + "%"));
      var pl = node("span", "", h.mine || h.ref || "");
      pl.lang = "pl";
      pl.tabIndex = 0;
      pl.title = "Tap to hear";
      li.appendChild(pl);
      var again = node("button", "pl-link tr-h-again", "Show again");
      again.type = "button";
      again.addEventListener("click", function () {
        from.value = h.from || "en";
        setFrom();
        source.value = h.source;
        mine.value = h.mine || "";
        show(h);
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      li.appendChild(again);
      ul.appendChild(li);
    });
  }

  $("tr-history-clear").addEventListener("click", function () {
    save(HISTORY_KEY, []);
    drawHistory();
  });
  window.addEventListener("storage", function (e) { if (e.key === HISTORY_KEY || e.key === null) drawHistory(); });
  drawHistory();
})();
