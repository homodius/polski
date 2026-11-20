// Phrases page: one section per setting (phrases-data.js), each with its tips, its phrases (Polish
// with audio, English, Ukrainian, and why it is said that way) and the useful words. Every phrase
// can be rated Easy / Normal / Hard or picked for the quiz (ratings.js, kind "phrase").
(function () {
  var P = window.PolishPage;
  var R = window.PolishRatings;
  var DATA = window.POLISH_PHRASES;
  if (!P || !DATA) return;
  var node = P.node;

  function $(id) { return document.getElementById(id); }

  function pl(tag, text, cls) {
    var n = node(tag, cls, text);
    n.lang = "pl";
    return n;
  }

  // "EN ..." / "UK ..." lines under the Polish, as on the Words page.
  function meaning(label, text, lang) {
    var p = node("span", "pl-word-meaning" + (lang === "uk" ? " pl-uk-only" : ""));
    p.appendChild(node("span", "pl-label", label));
    p.appendChild(document.createTextNode(" "));
    var t = node("span", "", text);
    if (lang) t.lang = lang;
    p.appendChild(t);
    return p;
  }

  // The English explanation, then the Ukrainian one (hidden while Show Ukrainian is off).
  function why(w, cls) {
    var box = node("span", cls);
    if (w.en) box.appendChild(P.noteText(w.en));
    if (w.uk) {
      var uk = P.noteText(" " + w.uk);
      uk.lang = "uk";
      box.appendChild(uk);
    }
    return box;
  }

  function tip(t) {
    var box = node("div", "ph-tip");
    var en = node("p");
    en.appendChild(P.noteText(t.en));
    box.appendChild(en);
    if (t.uk) {
      var uk = node("p");
      uk.lang = "uk";
      uk.appendChild(P.noteText(t.uk));
      box.appendChild(uk);
    }
    return box;
  }

  function row(p) {
    var li = node("li", "pl-word ph-row");
    li.id = "phrase-" + slug(p.pl);
    li.appendChild(P.speakButtons(p.pl));
    li.appendChild(pl("span", p.pl, "pl-word-pl"));
    li.appendChild(node("span", "pl-word-topic", ""));
    li.appendChild(meaning("EN", p.en));
    if (p.uk) li.appendChild(meaning("UK", p.uk, "uk"));
    if (p.why) li.appendChild(why(p.why, "pl-word-note"));
    if (R) li.appendChild(R.control(document, "phrase", p.pl));
    return li;
  }

  function slug(text) {
    return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  var toc = $("ph-contents");
  var box = $("ph-settings");
  DATA.settings.forEach(function (s) {
    var a = node("a", null, s.title);
    a.href = "#" + s.id;
    toc.appendChild(a);

    var section = node("section", "ph-section");
    section.id = s.id;
    var h = node("h2", null, s.title);
    var alt = node("span", "ph-section-alt");
    var plTitle = pl("span", s.pl);
    plTitle.tabIndex = 0;
    plTitle.title = "Tap to hear";
    alt.appendChild(plTitle);
    if (s.uk) {
      var uk = node("span", null, " · " + s.uk);
      uk.lang = "uk";
      alt.appendChild(uk);
    }
    h.appendChild(alt);
    section.appendChild(h);
    if (s.desc) section.appendChild(node("p", "pl-muted pl-small", s.desc));
    (s.tips || []).forEach(function (t) { section.appendChild(tip(t)); });

    var list = node("ul", "pl-words");
    s.phrases.forEach(function (p) { list.appendChild(row(p)); });
    section.appendChild(list);

    if (s.words && s.words.length) {
      section.appendChild(node("h3", "ph-words-title", "Useful words"));
      var words = node("ul", "ph-words");
      s.words.forEach(function (w) {
        var li = node("li");
        var word = pl("span", w[0]);
        word.tabIndex = 0;
        word.title = "Tap to hear";
        li.appendChild(word);
        li.appendChild(document.createTextNode(" " + w[1]));
        if (w[2]) {
          var u = node("span", "pl-muted", " · " + w[2]);
          u.lang = "uk";
          li.appendChild(u);
        }
        words.appendChild(li);
      });
      section.appendChild(words);
    }

    var quiz = node("p", "ph-quiz-link pl-small");
    var link = node("a", null, "Practise these phrases");
    link.href = "../phrases-quiz/#" + s.id;
    quiz.appendChild(link);
    section.appendChild(quiz);
    box.appendChild(section);
  });

  // Opened with #<setting> or #phrase-...: scroll there once the sections exist.
  if (location.hash) {
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
})();
