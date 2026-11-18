// Cases rules page: the seven cases with their uses, prepositions and endings, then full
// tables for example nouns, adjectives and pronouns. Every Polish word can be tapped to hear it,
// and every declined form shows its stem plainly with the ending highlighted.
(function () {
  var C = window.POLISH_CASES;
  var P = window.PolishPage;
  function say(text) { P.sayGenerated(text, true); }
  var ORDER = C.CASE_ORDER;
  var BY_CASE = {};
  C.cases.forEach(function (c) { BY_CASE[c.id] = c; });

  var SPEAKER = P.SPEAKER;

  var GENDER_NAMES = {
    "m-pers": "masculine · people", "m-anim": "masculine · animals", "m-inan": "masculine · things",
    f: "feminine", n: "neuter",
  };

  function $(id) { return document.getElementById(id); }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  function plain(text) { return text.replace(/[[\]|]/g, ""); }

  // A tappable piece of Polish. data-say="off" keeps the shared audio script from also
  // speaking it, since this button already does.
  function sayable(className, text, spoken) {
    var b = node("button", className);
    b.type = "button";
    b.lang = "pl";
    b.setAttribute("data-say", "off");
    b.title = "Listen";
    if (text) b.textContent = text;
    b.addEventListener("click", function () { say(spoken || b.textContent); });
    return b;
  }

  function speakerButton(text, label) {
    var b = node("button", "pl-speak");
    b.type = "button";
    b.title = "Listen";
    b.setAttribute("aria-label", label || "Say " + text);
    b.setAttribute("data-say", "off");
    b.innerHTML = SPEAKER;
    b.addEventListener("click", function () { say(text); });
    return b;
  }

  function ending(text) {
    if (text) return node("span", "cs-end", text);
    var zero = node("span", "cs-end cs-zero", "∅");
    zero.title = "No ending";
    zero.setAttribute("aria-label", "no ending");
    return zero;
  }

  // "kot|a" as a button: "kot" plain, "a" highlighted.
  function form(text) {
    var parts = text.split("|");
    var b = sayable("cs-word", "", parts[0] + parts[1]);
    b.appendChild(document.createTextNode(parts[0]));
    b.appendChild(ending(parts[1]));
    return b;
  }

  // English prose with {Polish} pieces made tappable.
  function prose(text, tag, className) {
    var box = node(tag || "span", className);
    text.split(/\{([^}]+)\}/).forEach(function (piece, i) {
      if (!piece) return;
      if (i % 2) box.appendChild(sayable("cs-say", piece));
      else box.appendChild(document.createTextNode(piece));
    });
    return box;
  }

  // An example sentence: "[stem|ending]" marks the declined word.
  function sentence(text) {
    var box = node("span", "cs-sentence");
    box.lang = "pl";
    text.split(/\[([^\]]+)\]/).forEach(function (piece, i) {
      if (!piece) return;
      if (!(i % 2)) {
        box.appendChild(document.createTextNode(piece));
        return;
      }
      var mark = node("span", "cs-mark");
      var parts = piece.split("|");
      if (parts.length === 1) {
        mark.appendChild(node("span", "cs-end", parts[0]));
      } else {
        mark.appendChild(document.createTextNode(parts[0]));
        mark.appendChild(ending(parts[1]));
      }
      box.appendChild(mark);
    });
    return box;
  }

  function example(ex) {
    var box = node("div", "pl-word-example cs-example");
    box.appendChild(speakerButton(plain(ex[0])));
    var s = sentence(ex[0]);
    s.classList.add("pl-example-pl");
    box.appendChild(s);
    var meaning = node("span", "pl-example-meaning", ex[1]);
    var uk = node("span", "", " · " + ex[2]);
    uk.lang = "uk";
    meaning.appendChild(uk);
    box.appendChild(meaning);
    return box;
  }

  function heading(tag, text) { return node(tag, "cs-h", text); }

  // ---------- Contents ----------

  function renderContents() {
    var nav = $("cs-contents");
    function link(href, text, lang) {
      var a = node("a", "cs-chip", text);
      a.href = href;
      if (lang) a.lang = lang;
      nav.appendChild(a);
    }
    link("#genders", "Genders");
    C.cases.forEach(function (c) { link("#" + c.id, c.pl, "pl"); });
    link("#nouns", "Nouns");
    link("#adjectives", "Adjectives");
    link("#pronouns", "Pronouns");
  }

  // ---------- Overview ----------

  function renderOverview() {
    var body = $("cs-overview-rows");
    C.cases.forEach(function (c, n) {
      var tr = node("tr");
      var name = node("td");
      var a = node("a", "cs-case-link", (n + 1) + ". ");
      a.href = "#" + c.id;
      a.appendChild(node("span", "", c.en));
      name.appendChild(a);
      tr.appendChild(name);
      var pl = node("td");
      pl.appendChild(sayable("cs-say cs-strong", c.pl));
      pl.appendChild(node("br"));
      pl.appendChild(sayable("cs-say cs-q", c.q));
      tr.appendChild(pl);
      var uk = node("td");
      uk.lang = "uk";
      uk.appendChild(node("span", "cs-strong", c.uk));
      uk.appendChild(node("br"));
      uk.appendChild(node("span", "cs-q", c.ukQ));
      tr.appendChild(uk);
      body.appendChild(tr);
    });
  }

  // ---------- Genders ----------

  function renderGenders() {
    var list = $("cs-genders");
    C.genders.forEach(function (g) {
      var li = node("li", "cs-card cs-gender");
      var h = node("p", "cs-gender-name");
      h.appendChild(node("span", "cs-strong", g.en));
      h.appendChild(document.createTextNode(" · "));
      h.appendChild(sayable("cs-say", g.pl));
      var uk = node("span", "", " · " + g.uk);
      uk.lang = "uk";
      h.appendChild(uk);
      li.appendChild(h);
      li.appendChild(prose(g.spot, "p", "cs-text"));
      list.appendChild(li);
    });
  }

  // ---------- The seven cases ----------

  function bulletList(items) {
    var ul = node("ul", "cs-list");
    items.forEach(function (t) { ul.appendChild(prose(t, "li")); });
    return ul;
  }

  function caseSection(c, n) {
    var s = node("section", "cs-card cs-case");
    s.id = c.id;

    var head = node("div", "cs-case-head");
    head.appendChild(node("span", "cs-case-num", String(n + 1)));
    var names = node("div");
    var h = node("h3", "cs-case-name");
    h.appendChild(sayable("cs-say", c.pl));
    names.appendChild(h);
    var sub = node("p", "cs-case-sub pl-muted");
    sub.appendChild(document.createTextNode(c.en));
    var uk = node("span", "", " · " + c.uk + " (" + c.ukQ + ")");
    uk.lang = "uk";
    sub.appendChild(uk);
    names.appendChild(sub);
    head.appendChild(names);
    var q = sayable("cs-say cs-case-q", c.q);
    head.appendChild(q);
    s.appendChild(head);

    s.appendChild(heading("h4", "When to use it"));
    s.appendChild(bulletList(c.uses));

    if (c.preps.length) {
      s.appendChild(heading("h4", "Prepositions"));
      var preps = node("div", "cs-preps");
      c.preps.forEach(function (p) {
        var chip = node("span", "cs-prep");
        chip.appendChild(sayable("cs-say cs-strong", p[0]));
        chip.appendChild(node("span", "pl-muted", " " + p[1]));
        preps.appendChild(chip);
      });
      s.appendChild(preps);
    }

    s.appendChild(heading("h4", "Endings, singular"));
    s.appendChild(bulletList(c.endings.sg));
    s.appendChild(heading("h4", "Endings, plural"));
    s.appendChild(bulletList(c.endings.pl));

    s.appendChild(heading("h4", "Examples"));
    c.examples.forEach(function (ex) { s.appendChild(example(ex)); });

    var note = node("p", "cs-uk-note pl-uk-only");
    note.appendChild(node("span", "pl-label", "UK"));
    note.appendChild(prose(c.ukNote));
    s.appendChild(note);
    return s;
  }

  function renderCases() {
    var box = $("cs-cases");
    C.cases.forEach(function (c, n) { box.appendChild(caseSection(c, n)); });
  }

  // ---------- Tables ----------

  function caseCell(id) {
    var th = node("th", "cs-case-cell");
    th.scope = "row";
    var a = node("a", "", BY_CASE[id].en);
    a.href = "#" + id;
    th.appendChild(a);
    th.appendChild(node("br"));
    th.appendChild(sayable("cs-say cs-q", BY_CASE[id].q));
    return th;
  }

  function cell(forms) {
    var td = node("td");
    forms.forEach(function (f, i) {
      if (i) td.appendChild(node("span", "cs-or", " / "));
      td.appendChild(form(f));
    });
    return td;
  }

  function headRow(labels) {
    var tr = node("tr");
    tr.appendChild(node("th", "", "Case"));
    labels.forEach(function (l) { tr.appendChild(node("th", "", l)); });
    return tr;
  }

  function fillSelect(select, items, label) {
    items.forEach(function (it) {
      var o = node("option", "", label(it));
      o.value = it.id;
      select.appendChild(o);
    });
  }

  function renderNoun() {
    var n = C.nouns.find(function (x) { return x.id === $("cs-noun").value; }) || C.nouns[0];
    var table = $("cs-noun-table");
    table.textContent = "";
    var thead = node("thead");
    thead.appendChild(headRow(["Singular", "Plural"]));
    table.appendChild(thead);
    var body = node("tbody");
    ORDER.forEach(function (id, i) {
      var tr = node("tr");
      tr.appendChild(caseCell(id));
      tr.appendChild(cell([n.forms.sg[i]]));
      tr.appendChild(cell([n.forms.pl[i]]));
      body.appendChild(tr);
    });
    table.appendChild(body);
    var info = $("cs-noun-info");
    info.textContent = "";
    info.appendChild(sayable("cs-say cs-strong", n.pl));
    info.appendChild(document.createTextNode(" · " + n.en));
    var uk = node("span", "", " · " + n.uk);
    uk.lang = "uk";
    info.appendChild(uk);
    info.appendChild(node("span", "pl-word-topic cs-gender-tag", GENDER_NAMES[n.gender]));
    $("cs-noun-note").textContent = "";
    $("cs-noun-note").appendChild(prose(n.note));
  }

  // One column per gender; the masculine column shows both accusatives when they differ.
  function renderAdjective() {
    var a = C.adjectives.find(function (x) { return x.id === $("cs-adj").value; }) || C.adjectives[0];
    var table = $("cs-adj-table");
    table.textContent = "";
    var thead = node("thead");
    thead.appendChild(headRow(["Masc.", "Fem.", "Neut.", "Pl. men", "Pl. other"]));
    table.appendChild(thead);
    var body = node("tbody");
    ORDER.forEach(function (id, i) {
      var tr = node("tr");
      tr.appendChild(caseCell(id));
      var m = [a.forms.mAnim[i]];
      if (a.forms.mInan[i] !== a.forms.mAnim[i]) m.push(a.forms.mInan[i]);
      tr.appendChild(cell(m));
      tr.appendChild(cell([a.forms.f[i]]));
      tr.appendChild(cell([a.forms.n[i]]));
      tr.appendChild(cell([a.forms.plMen[i]]));
      tr.appendChild(cell([a.forms.plOther[i]]));
      body.appendChild(tr);
    });
    table.appendChild(body);
    $("cs-adj-note").textContent = "";
    $("cs-adj-note").appendChild(prose(a.note));
  }

  // Pronouns are learnt whole, so their forms are plain words, not stem + ending.
  function renderPronouns() {
    var table = $("cs-pron-table");
    var thead = node("thead");
    var tr = node("tr");
    tr.appendChild(node("th", "", ""));
    ORDER.forEach(function (id) {
      var th = node("th");
      var a = node("a", "", BY_CASE[id].en.slice(0, 3) + ".");
      a.href = "#" + id;
      a.title = BY_CASE[id].en;
      th.appendChild(a);
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var body = node("tbody");
    C.pronouns.forEach(function (p) {
      var row = node("tr");
      var th = node("th", "cs-case-cell");
      th.scope = "row";
      th.appendChild(sayable("cs-say cs-strong", p.pl));
      th.appendChild(node("br"));
      th.appendChild(node("span", "pl-muted cs-tiny", p.en));
      row.appendChild(th);
      p.forms.forEach(function (f) {
        var td = node("td");
        if (f === null) {
          td.appendChild(node("span", "pl-muted", "–"));
        } else {
          f.split(" / ").forEach(function (v, i) {
            if (i) td.appendChild(node("span", "cs-or", " / "));
            td.appendChild(sayable("cs-word", v));
          });
        }
        row.appendChild(td);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    var notes = $("cs-pron-notes");
    C.pronounNotes.forEach(function (t) { notes.appendChild(prose(t, "li")); });
  }

  renderContents();
  renderOverview();
  renderGenders();
  renderCases();

  fillSelect($("cs-noun"), C.nouns, function (n) { return n.pl + " (" + n.en + ") · " + GENDER_NAMES[n.gender]; });
  $("cs-noun").addEventListener("change", renderNoun);
  renderNoun();

  fillSelect($("cs-adj"), C.adjectives, function (a) { return a.pl + " (" + a.en + ")"; });
  $("cs-adj").addEventListener("change", renderAdjective);
  renderAdjective();

  renderPronouns();

  document.querySelectorAll(".cs-static").forEach(function (b) {
    b.addEventListener("click", function () { say(b.textContent); });
  });

  // The page is built after load, so jump to a #case link once its section exists.
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
})();
