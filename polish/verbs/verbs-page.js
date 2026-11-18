// Verb tenses page: fills the conjugation tables from verbs-data.js, with the unchanging stem
// plain and the ending coloured, and every Polish word tappable to hear it.
(function () {
  var V = window.POLISH_VERBS;
  var BY_ID = {};
  V.verbs.forEach(function (v) { BY_ID[v.id] = v; });
  var PERSON = {};
  V.persons.forEach(function (p) { PERSON[p.id] = p; });

  var SINGULAR = ["1s", "2s", "3s"];
  var PLURAL = ["1p", "2p", "3p"];
  var IMPERATIVE = ["2s", "1p", "2p"];
  var COLUMN_NAMES = {
    inf: "+ infinitive", m: "masculine", f: "feminine", n: "neuter", v: "men or mixed", nv: "women, things",
  };
  var IMPERATIVE_PERSONS = { "2s": "ty", "1p": "my (let's)", "2p": "wy" };

  function $(id) { return document.getElementById(id); }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  function polish(tag, text, className) {
    var n = node(tag, className, text);
    n.lang = "pl";
    return n;
  }

  function stemEnd(box, stem, end) {
    box.appendChild(document.createTextNode(stem));
    if (end) box.appendChild(node("b", "vb-end", end));
  }

  // One form as a button that says it: "będ<b>ę</b> się uczy<b>ł</b>", "rob<b>ię</b>".
  function formButton(f) {
    var b = polish("button", "", "vb-form");
    b.type = "button";
    b.setAttribute("data-say", f.text);
    b.title = "Say " + f.text;
    var word = f.stem + f.end;
    var at = f.text.lastIndexOf(word);
    var before = f.text.slice(0, at);
    var after = f.text.slice(at + word.length);
    if (f.aux) {
      var auxWord = f.aux.stem + f.aux.end;
      stemEnd(b, f.aux.stem, f.aux.end);
      before = before.slice(auxWord.length);
    }
    if (before) b.appendChild(document.createTextNode(before));
    stemEnd(b, f.stem, f.end);
    if (after) b.appendChild(document.createTextNode(after));
    return b;
  }

  function cell(tag, content) {
    var c = node(tag);
    if (content) c.appendChild(content);
    return c;
  }

  function personHeader(p, tense) {
    var th = node("th");
    th.scope = "row";
    th.appendChild(polish("span", tense === "imperative" ? IMPERATIVE_PERSONS[p] : PERSON[p].pl));
    return th;
  }

  function headRow(labels) {
    var tr = node("tr");
    labels.forEach(function (l) {
      var th = node("th", l === "Ukrainian" ? "pl-uk-only" : "", l);
      th.scope = "col";
      tr.appendChild(th);
    });
    return tr;
  }

  // The column keys used by these rows, in a fixed order.
  function columns(t, rows) {
    var order = ["inf", "m", "f", "n", "v", "nv"];
    return order.filter(function (k) {
      return rows.some(function (p) { return t[p] && t[p][k]; });
    });
  }

  function wrap(table) {
    var box = node("div", "vb-scroll");
    box.appendChild(table);
    return box;
  }

  // One verb, one tense. Gendered tenses get a singular and a plural table.
  function tenseTable(verb, tense) {
    var t = verb.forms[tense];
    var box = node("div", "vb-tense");
    if (!t) return box;
    var simple = typeof t[Object.keys(t)[0]].stem === "string";
    var groups = tense === "imperative" ? [IMPERATIVE] : simple ? [SINGULAR.concat(PLURAL)] : [SINGULAR, PLURAL];
    groups.forEach(function (rows) {
      var table = node("table", "vb-table vb-forms");
      var body = node("tbody");
      var keys = simple ? null : columns(t, rows);
      if (keys) {
        var head = node("thead");
        head.appendChild(headRow([""].concat(keys.map(function (k) { return COLUMN_NAMES[k]; }))));
        table.appendChild(head);
      }
      rows.forEach(function (p) {
        if (!t[p]) return;
        var tr = node("tr");
        tr.appendChild(personHeader(p, tense));
        if (simple) tr.appendChild(cell("td", formButton(t[p])));
        else keys.forEach(function (k) { tr.appendChild(cell("td", t[p][k] ? formButton(t[p][k]) : null)); });
        body.appendChild(tr);
      });
      table.appendChild(body);
      box.appendChild(wrap(table));
    });
    return box;
  }

  function verbName(verb) {
    var b = polish("button", verb.inf, "vb-form vb-inf");
    b.type = "button";
    b.title = "Say " + verb.inf;
    return b;
  }

  // Several verbs side by side in one simple tense, one column each.
  function compareTable(ids, tense) {
    var verbs = ids.map(function (id) { return BY_ID[id]; });
    var table = node("table", "vb-table vb-forms vb-compare-table");
    var head = node("thead");
    var tr = node("tr");
    tr.appendChild(node("th"));
    verbs.forEach(function (v) {
      var th = node("th");
      th.scope = "col";
      th.appendChild(verbName(v));
      tr.appendChild(th);
    });
    head.appendChild(tr);
    table.appendChild(head);
    var body = node("tbody");
    (tense === "imperative" ? IMPERATIVE : SINGULAR.concat(PLURAL)).forEach(function (p) {
      var row = node("tr");
      row.appendChild(personHeader(p, tense));
      verbs.forEach(function (v) {
        var f = v.forms[tense] && v.forms[tense][p];
        row.appendChild(cell("td", f ? formButton(f) : null));
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    return wrap(table);
  }

  function personsTable() {
    var table = node("table", "vb-table");
    var head = node("thead");
    head.appendChild(headRow(["", "Polish", "English", "Ukrainian"]));
    table.appendChild(head);
    var body = node("tbody");
    V.persons.forEach(function (p) {
      var tr = node("tr");
      tr.appendChild(node("th", "", p.id.charAt(0) + (p.id.charAt(1) === "s" ? " singular" : " plural")));
      tr.appendChild(cell("td", polish("span", p.pl)));
      tr.appendChild(node("td", "", p.en));
      var uk = node("td", "", p.uk);
      uk.lang = "uk";
      tr.appendChild(uk);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function groupList() {
    var frag = document.createDocumentFragment();
    V.groups.forEach(function (g) {
      var li = node("li");
      li.appendChild(node("b", "", g.name + ": "));
      li.appendChild(noteText(g.note));
      frag.appendChild(li);
    });
    return frag;
  }

  // The group notes are English with Polish words in them: every word that is one of the verbs
  // or their forms becomes tappable.
  var KNOWN = {};
  V.verbs.forEach(function (v) {
    KNOWN[v.inf] = true;
    V.tenses.forEach(function (t) {
      V.cells(v, t.id).forEach(function (c) { KNOWN[c.form.text] = true; });
    });
  });
  ["mieć", "ty"].forEach(function (w) { KNOWN[w] = true; });

  function noteText(text) {
    var frag = document.createDocumentFragment();
    text.split(/([\p{L}]+(?: się)?)/u).forEach(function (part) {
      if (KNOWN[part]) frag.appendChild(polish("span", part));
      else if (part) frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }

  function pairsTable() {
    var table = node("table", "vb-table vb-pairs");
    var head = node("thead");
    head.appendChild(headRow(["imperfective", "perfective", "meaning", ""]));
    head.lastChild.lastChild.className = "pl-uk-only";
    table.appendChild(head);
    var body = node("tbody");
    V.verbs.forEach(function (v) {
      if (v.aspect !== "impf" || !v.pair) return;
      var pf = BY_ID[v.pair];
      var tr = node("tr");
      tr.appendChild(cell("td", verbName(v)));
      tr.appendChild(cell("td", verbName(pf)));
      tr.appendChild(node("td", "", v.en.replace(/ \(.*\)$/, "")));
      var uk = node("td", "vb-muted", v.uk + " / " + pf.uk);
      uk.lang = "uk";
      tr.appendChild(uk);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  // ---------- All verbs ----------

  var pick = $("verb-pick");
  var ASPECT = { impf: "imperfective", pf: "perfective" };

  function fillPicker() {
    V.verbs.forEach(function (v) {
      var o = node("option", "", v.inf + " · " + v.en);
      o.value = v.id;
      pick.appendChild(o);
    });
  }

  function showVerb(id) {
    var v = BY_ID[id] || V.verbs[0];
    var out = $("verb-tables");
    out.textContent = "";
    var head = node("div", "vb-verb-head");
    head.appendChild(verbName(v));
    var meaning = node("span", "", " " + v.en);
    head.appendChild(meaning);
    var uk = node("span", "", " · " + v.uk);
    uk.lang = "uk";
    head.appendChild(uk);
    var info = node("p", "pl-muted pl-small", ASPECT[v.aspect]);
    if (v.pair) {
      info.appendChild(document.createTextNode(", pair: "));
      var a = polish("a", BY_ID[v.pair].inf);
      a.href = "#tables";
      a.setAttribute("data-say", "off");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        pick.value = v.pair;
        showVerb(v.pair);
      });
      info.appendChild(a);
    }
    out.appendChild(head);
    out.appendChild(info);
    V.tenses.forEach(function (t) {
      if (!v.forms[t.id]) return;
      var h = node("h3", "", t.name + " ");
      h.appendChild(polish("span", t.pl, "vb-h-alt"));
      out.appendChild(h);
      if (t.id === "future" && v.aspect === "impf" && v.id !== "byc") {
        out.appendChild(node("p", "pl-muted pl-small", "Both columns mean the same: pick the infinitive or the form for your gender."));
      }
      out.appendChild(tenseTable(v, t.id));
    });
    try { history.replaceState(null, "", "#verb-" + v.id); } catch (e) { /* file:// */ }
  }

  // ---------- Fill the page ----------

  $("persons").appendChild(personsTable());
  $("groups").appendChild(groupList());
  $("pairs").appendChild(pairsTable());
  Array.prototype.forEach.call(document.querySelectorAll(".vb-compare"), function (box) {
    box.appendChild(compareTable(box.getAttribute("data-verbs").split(","), box.getAttribute("data-tense")));
  });
  Array.prototype.forEach.call(document.querySelectorAll(".vb-verb-table"), function (box) {
    var v = BY_ID[box.getAttribute("data-verb")];
    var tense = box.getAttribute("data-tense");
    var cap = node("p", "vb-caption");
    cap.appendChild(verbName(v));
    cap.appendChild(document.createTextNode(" " + v.en));
    box.appendChild(cap);
    box.appendChild(tenseTable(v, tense));
  });

  fillPicker();
  var start = /^#verb-(.+)$/.exec(location.hash);
  if (start && BY_ID[start[1]]) pick.value = start[1];
  pick.addEventListener("change", function () { showVerb(pick.value); });
  showVerb(pick.value);
  if (start) $("tables").scrollIntoView();

  // Polish text that is not a button yet gets keyboard focus, so it can be heard without a mouse.
  Array.prototype.forEach.call(document.querySelectorAll('main [lang="pl"]'), function (el) {
    if (el.tagName === "BUTTON" || el.tagName === "A" || el.getAttribute("data-say") === "off") return;
    if (el.querySelector('[lang="pl"]')) return;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.classList.add("vb-say");
  });
})();
