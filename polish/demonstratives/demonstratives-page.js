// This and that (demonstratives) Learn page: a cheat sheet of every form of ten, then for ten,
// tamten, ten sam and taki a table of all cases with the Ukrainian forms under the Polish, and
// example sentences; then the usual mistakes. Every Polish word can be tapped to hear it.
(function () {
  var DATA = window.POLISH_DEMONSTRATIVES;
  var D = window.PolishDemonstratives;
  var P = window.PolishPage;
  var C = window.POLISH_CASES;
  if (!DATA || !D || !P) return;
  function say(text) { P.sayGenerated(text, true); }

  var BY_CASE = {};
  (C ? C.cases : []).forEach(function (c) { BY_CASE[c.id] = c; });
  var HEADS = { m: "Masc.", f: "Fem.", n: "Neut.", plMen: "Pl. men", plOther: "Pl. other" };

  function $(id) { return document.getElementById(id); }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  function uk(text, className) {
    var s = node("span", className, text);
    s.lang = "uk";
    return s;
  }

  // English or Ukrainian prose with {Polish} made tappable.
  function prose(text, tag, lang) {
    var box = node(tag || "span");
    if (lang) box.lang = lang;
    box.appendChild(P.noteText(text));
    return box;
  }

  function ending(text) {
    if (text) return node("span", "cs-end", text);
    var zero = node("span", "cs-end cs-zero", "∅");
    zero.title = "No ending";
    return zero;
  }

  // "t|ego sam|ego" as one button: stems plain, endings highlighted.
  function formButton(form) {
    var b = node("button", "cs-word");
    b.type = "button";
    b.lang = "pl";
    b.dataset.say = "off";
    b.title = "Listen";
    form.split(" ").forEach(function (part, i) {
      if (i) b.appendChild(document.createTextNode(" "));
      var bits = part.split("|");
      b.appendChild(document.createTextNode(bits[0]));
      if (bits.length > 1) b.appendChild(ending(bits[1]));
    });
    b.addEventListener("click", function () { say(D.plain(form)); });
    return b;
  }

  function speaker(text) {
    var b = P.iconButton(P.SPEAKER, "Listen", "Say " + text);
    b.dataset.say = "off";
    b.addEventListener("click", function () { say(text); });
    return b;
  }

  function sayButton(text, className) {
    var b = node("button", className || "cs-say", text);
    b.type = "button";
    b.lang = "pl";
    b.dataset.say = "off";
    b.addEventListener("click", function () { say(text); });
    return b;
  }

  // ---------- Contents ----------

  function renderContents() {
    var nav = $("dm-contents");
    function chip(href, text, lang) {
      var a = node("a", "cs-chip", text);
      a.href = href;
      if (lang) a.lang = lang;
      a.dataset.say = "off";
      nav.appendChild(a);
    }
    chip("#cheat-sheet", "Which form when");
    DATA.words.forEach(function (w) { chip("#" + w.id, w.pl, "pl"); });
    chip("#tricky", "Usual mistakes");
  }

  // ---------- Cheat sheet ----------

  function renderCheat() {
    var body = $("dm-cheat-rows");
    DATA.endings.forEach(function (e) {
      var tr = node("tr");
      var th = node("th", "dm-cheat-form");
      th.scope = "row";
      th.appendChild(sayButton(e.form, "cs-word dm-big"));
      tr.appendChild(th);
      var where = node("td");
      where.appendChild(prose(e.where));
      where.appendChild(node("br", "pl-uk-only"));
      where.appendChild(prose(e.ukWhere, "span", "uk")).className = "pl-muted pl-small";
      tr.appendChild(where);
      var ukCell = node("td", "dm-uk-cell pl-uk-only");
      ukCell.appendChild(uk(e.ukForm));
      tr.appendChild(ukCell);
      body.appendChild(tr);
    });
  }

  // ---------- One section per word ----------

  function caseCell(id) {
    var c = BY_CASE[id] || { en: id, q: "" };
    var th = node("th", "cs-case-cell");
    th.scope = "row";
    var a = node("a", "", c.en.charAt(0).toUpperCase() + c.en.slice(1));
    a.href = "../cases/#" + id;
    th.appendChild(a);
    if (c.q) {
      th.appendChild(node("br"));
      th.appendChild(sayButton(c.q, "cs-say cs-q"));
    }
    if (c.uk) {
      th.appendChild(node("br"));
      th.appendChild(uk(c.uk, "pl-muted cs-tiny"));
    }
    return th;
  }

  function table(word) {
    var wrap = node("div", "cs-table-wrap");
    var t = node("table", "cs-table dm-table");
    var thead = node("thead");
    var hr = node("tr");
    hr.appendChild(node("th", "", "Case"));
    DATA.SLOTS.forEach(function (s) { hr.appendChild(node("th", "", HEADS[s])); });
    thead.appendChild(hr);
    t.appendChild(thead);
    var body = node("tbody");
    DATA.CASES.forEach(function (id, i) {
      var tr = node("tr");
      tr.appendChild(caseCell(id));
      DATA.SLOTS.forEach(function (s) {
        var td = node("td");
        var pls = word.forms[s][i].split(" / ");
        var uks = word.ukForms[s][i].split(" / ");
        pls.forEach(function (f, k) {
          if (k) td.appendChild(node("span", "cs-or", " / "));
          td.appendChild(formButton(f));
        });
        td.appendChild(uk(uks.join(" / "), "dm-uk"));
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    t.appendChild(body);
    wrap.appendChild(t);
    return wrap;
  }

  // The sentence with the form in place, its ending highlighted.
  function exampleSentence(item) {
    var line = node("span", "dm-ex-pl");
    line.lang = "pl";
    line.dataset.say = D.sentence(item);
    var parts = item.cue.split("___");
    line.appendChild(document.createTextNode(parts[0]));
    var strong = node("strong");
    var words = D.inSentence(item, item.form).split(" ");
    words.forEach(function (part, i) {
      if (i) strong.appendChild(document.createTextNode(" "));
      var bits = part.split("|");
      strong.appendChild(document.createTextNode(bits[0]));
      if (bits.length > 1) strong.appendChild(ending(bits[1]));
    });
    line.appendChild(strong);
    line.appendChild(document.createTextNode(parts[1] || ""));
    return line;
  }

  function examples(word) {
    var items = D.filterItems(D.buildItems(DATA), word.id, "all");
    var box = node("details", "dm-examples");
    box.appendChild(node("summary", "", "Example sentences (" + items.length + ")"));
    var list = node("ul", "dm-ex-list");
    DATA.CASES.forEach(function (id) {
      items.filter(function (it) { return it.caseId === id; }).forEach(function (it) {
        var li = node("li", "dm-ex");
        li.appendChild(speaker(D.sentence(it)));
        var text = node("span", "dm-ex-text");
        text.appendChild(exampleSentence(it));
        var meaning = node("span", "pl-muted pl-small dm-ex-meaning", it.en);
        meaning.appendChild(uk(" · " + it.uk));
        text.appendChild(meaning);
        li.appendChild(text);
        list.appendChild(li);
      });
    });
    box.appendChild(list);
    return box;
  }

  function renderWords() {
    var box = $("dm-words");
    DATA.words.forEach(function (w) {
      var s = node("section", "cs-section");
      s.id = w.id;
      var h = node("h2", "cs-section-title");
      h.appendChild(sayButton(w.pl, "cs-say"));
      h.appendChild(document.createTextNode(" · " + w.en));
      h.appendChild(uk(" · " + w.uk));
      s.appendChild(h);
      s.appendChild(prose(w.intro, "p")).className = "pl-small dm-word-intro";
      s.appendChild(table(w));
      var note = prose("In the masculine accusative the first form is for people and animals, the second for things: {" +
        D.plain(D.formOf(w, "m", "acc")) + " psa}, {" + D.plain(D.formOf(w, "mi", "acc")) + " dom}.", "p");
      note.className = "cs-note";
      s.appendChild(note);
      s.appendChild(examples(w));
      box.appendChild(s);
    });
  }

  // ---------- Usual mistakes ----------

  function renderTricky() {
    var ul = $("dm-tricky");
    DATA.tricky.forEach(function (t) {
      var li = node("li", "cs-card dm-tricky-item");
      li.appendChild(prose(t.en, "p"));
      var u = prose(t.uk, "p", "uk");
      u.className = "pl-muted pl-small";
      li.appendChild(u);
      ul.appendChild(li);
    });
  }

  renderContents();
  renderCheat();
  renderWords();
  renderTricky();

  // The page is built after load, so jump to a #word link once its section exists.
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
