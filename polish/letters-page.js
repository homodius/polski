// Letters tab: every Polish letter and letter combination with how to say it, the English and
// Ukrainian words that have the same sound, and example words to listen to.
(function () {
  var P = window.PolishPage;
  var LETTERS = window.POLISH_LETTERS || [];
  var node = P.node;

  function $(id) { return document.getElementById(id); }

  var search = $("letters-search");
  var group = $("letters-group");
  var list = $("letters-rows");

  var GROUP_NAMES = { vowel: "vowel", consonant: "consonant", combination: "combination" };
  var BY_ID = {};
  LETTERS.forEach(function (l) { BY_ID[l.id] = l; });

  // Lower-case text without accents, so "sz" finds "szkoła" and "l" finds "ł" too.
  function fold(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
  }

  LETTERS.forEach(function (l) {
    l.haystack = [l.text, l.sound, l.ipa, l.en, l.uk].concat(l.examples.map(function (e) { return e.join(" "); }))
      .concat(l.exceptions || [], l.softSign || [])
      .join(" ").toLowerCase();
    l.foldedHaystack = fold(l.haystack);
  });

  function inGroup(l) {
    var g = group.value;
    if (g === "all") return true;
    if (g === "special") return !!l.special;
    if (g === "exceptions") return !!(l.exceptions && l.exceptions.length);
    if (g === "soft") return !!l.softSign;
    return l.group === g;
  }

  // Exact matches come first, so typing "ł" doesn't bury ł under every word with an l in it.
  function matches(l, q) {
    if (!q) return 2;
    if (l.text.toLowerCase() === q || l.id === q) return 3;
    if (l.haystack.indexOf(q) !== -1) return 2;
    if (l.foldedHaystack.indexOf(fold(q)) !== -1) return 1;
    return 0;
  }

  // The example word with every place the letter appears in bold.
  function markedWord(word, text) {
    var box = node("span", "pl-example-pl");
    box.lang = "pl";
    var lower = word.toLowerCase();
    var i = 0;
    var at = lower.indexOf(text);
    while (at !== -1 && text) {
      if (at > i) box.appendChild(document.createTextNode(word.slice(i, at)));
      box.appendChild(node("b", "pl-letter-mark", word.slice(at, at + text.length)));
      i = at + text.length;
      at = lower.indexOf(text, i);
    }
    if (i < word.length) box.appendChild(document.createTextNode(word.slice(i)));
    return box;
  }

  function exampleLine(ex, text) {
    var box = node("span", "pl-word-example pl-letter-example");
    box.appendChild(P.speakButtons(ex[0]));
    box.appendChild(markedWord(ex[0], text));
    var meaning = node("span", "pl-example-meaning", ex[1]);
    var uk = node("span", "", " · " + ex[2]);
    uk.lang = "uk";
    meaning.appendChild(uk);
    box.appendChild(meaning);
    return box;
  }

  // "EN web · UK був", or "No English match" when English has none.
  function soundsLike(l) {
    var p = node("span", "pl-word-meaning pl-letter-like");
    if (!l.en) {
      // With a Ukrainian match, this shows only while Show Ukrainian is off.
      p.appendChild(node("span", "pl-muted" + (l.uk ? " pl-uk-off-only" : ""), "No English match"));
      if (!l.uk) return p;
    }
    if (l.en) {
      p.appendChild(node("span", "pl-label", "EN"));
      p.appendChild(document.createTextNode(" " + l.en));
    }
    if (l.uk) {
      // Separator, label and word together, so Show Ukrainian off hides all of it.
      var ukPart = node("span", "pl-uk-only");
      if (l.en) ukPart.appendChild(document.createTextNode(" · "));
      ukPart.appendChild(node("span", "pl-label", "UK"));
      ukPart.appendChild(document.createTextNode(" "));
      var uk = node("span", "", l.uk);
      uk.lang = "uk";
      ukPart.appendChild(uk);
      p.appendChild(ukPart);
    }
    return p;
  }

  function row(l) {
    var li = node("li", "pl-word pl-letter-row");
    li.id = "letter-" + l.id;
    li.dataset.id = l.id;

    // Tap the big letter to hear it said on its own.
    var big = P.sayable(node("span", "pl-letter-big", l.text));
    big.tabIndex = 0;
    big.title = "Tap to hear";
    li.appendChild(big);

    var head = node("span", "pl-letter-sound");
    head.appendChild(node("span", "pl-word-pl", l.sound));
    head.appendChild(node("span", "pl-letter-ipa", "/" + l.ipa + "/"));
    if (l.exceptions && l.exceptions.length) {
      var flag = P.exceptionIcon();
      flag.title = "Has special cases";
      flag.setAttribute("role", "img");
      flag.setAttribute("aria-label", "Has special cases");
      head.appendChild(flag);
    }
    li.appendChild(head);
    li.appendChild(node("span", "pl-word-topic", GROUP_NAMES[l.group]));

    li.appendChild(soundsLike(l));
    if (l.same && l.same.length) {
      var same = node("span", "pl-word-note", "Said the same as ");
      l.same.forEach(function (id, n) {
        if (n) same.appendChild(document.createTextNode(", "));
        var a = node("a", "", BY_ID[id] ? BY_ID[id].text : id);
        a.href = "#letter-" + id;
        a.lang = "pl";
        a.addEventListener("click", function (e) {
          var target = $("letter-" + id);
          if (!target) {
            // Filtered out: show everything again so the link has somewhere to go.
            search.value = "";
            group.value = "all";
            render();
            target = $("letter-" + id);
          }
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.classList.remove("pl-flash");
          void target.offsetWidth;
          target.classList.add("pl-flash");
        });
        same.appendChild(a);
      });
      li.appendChild(same);
    }
    if (l.note) li.appendChild(P.noteText(l.note, "pl-word-note"));
    if (l.softSign) li.appendChild(P.softSignNote(l.softSign));
    if (l.exceptions && l.exceptions.length) li.appendChild(P.exceptionList(l.exceptions));

    var mark = l.text.indexOf(" ") === -1 && l.text.indexOf(",") === -1 ? l.text.toLowerCase() : "";
    l.examples.forEach(function (ex) { li.appendChild(exampleLine(ex, mark)); });
    // Easy / Normal / Hard and Pick, shared with the words (ratings.js); the quiz practises by these.
    if (window.PolishRatings) li.appendChild(window.PolishRatings.control(document, "letter", l.id));
    return li;
  }

  function render() {
    var q = search.value.trim().toLowerCase();
    var inThisGroup = LETTERS.filter(inGroup);
    var shown = inThisGroup
      .map(function (l, i) { return { l: l, score: matches(l, q), i: i }; })
      .filter(function (m) { return m.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.i - b.i; })
      .map(function (m) { return m.l; });

    list.textContent = "";
    shown.forEach(function (l) { list.appendChild(row(l)); });
    $("letters-count").textContent = shown.length === inThisGroup.length
      ? inThisGroup.length + " letters and combinations"
      : shown.length + " of " + inThisGroup.length + " letters and combinations";
    $("letters-empty").hidden = shown.length > 0;
  }

  search.addEventListener("input", render);
  group.addEventListener("change", render);
  render();

  // Other pages (tongue twisters) link to one letter as letters/#letter-<id>: show the list
  // with that letter in it and bring it into view.
  function showFromHash() {
    var m = /^#letter-(.+)$/.exec(location.hash);
    if (!m) return;
    var id = decodeURIComponent(m[1]);
    var target = $("letter-" + id);
    if (!target) {
      search.value = "";
      group.value = "all";
      render();
      target = $("letter-" + id);
    }
    if (!target) return;
    if (window.PolishLettersQuiz && list.closest("[hidden]")) window.PolishLettersQuiz.showList();
    target.scrollIntoView({ block: "start" });
    target.classList.remove("pl-flash");
    void target.offsetWidth;
    target.classList.add("pl-flash");
  }
  window.addEventListener("hashchange", showFromHash);
  window.addEventListener("load", showFromHash);
})();
