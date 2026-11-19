// The pages of the Polish section, in one list: the Polish line at the top of every page, the
// Learn / Quiz switch under it, the tiles on the Polish home page (polish/) and the Polish part of
// the site's burger menu (js/site-nav.js) are all drawn from it.
//
// Each entry is one topic with two variants: `learn` (the default view: a list, rules or tables)
// and `quiz` (cards to practise with). `path` is where the topic opens, its learn variant. A
// variant names the page it lives on (`page`, the data-page of that page's menu) and its URL
// relative to polish/; a variant shown on the same page as the other one adds a #hash, and the
// page's own script shows that view when the hash is there. A topic under construction has
// `ready: false`: its tile says "Coming soon" and the menus leave it out.
//
// A page shows the menu and the switch with <nav class="pl-section-nav" data-page="<page>"></nav>,
// and the home page shows the tiles with <div class="pl-hub" id="pl-hub"></div>.
(function () {
  var PAGES = [
    { id: "practice", path: "practice/", title: "Practice", pl: "Ćwiczenia", single: true,
      desc: "Endless mixed cards from every topic; skip any card",
      learn: { page: "practice", path: "practice/" },
      quiz: { page: "practice", path: "practice/" } },
    { id: "words", path: "words/", title: "Words", pl: "Słowa", desc: "Vocabulary with meanings, examples and audio",
      learn: { page: "words", path: "words/" },
      quiz: { page: "flashcards", path: "flashcards/", desc: "Flashcards with spaced repetition, and a meaning quiz" } },
    { id: "letters", path: "letters/", title: "Letters", pl: "Litery", desc: "How to say each letter and combination",
      learn: { page: "letters", path: "letters/" },
      quiz: { page: "letters", path: "letters/#quiz", desc: "Hear a letter, pick its sound" } },
    { id: "twisters", path: "twisters/", title: "Tongue twisters", pl: "Łamańce językowe", desc: "Practise the tricky sounds",
      learn: { page: "twisters", path: "twisters/" } },
    { id: "cases", path: "cases/", title: "Cases", pl: "Przypadki", desc: "Rules for noun and adjective endings",
      learn: { page: "cases", path: "cases/" },
      quiz: { page: "cases-quiz", path: "cases-quiz/", desc: "Pick the right ending" } },
    { id: "demonstratives", path: "demonstratives/", title: "This & that", pl: "Ten, ta, to", desc: "ten, tamten, ten sam and taki in every case",
      learn: { page: "demonstratives", path: "demonstratives/" },
      quiz: { page: "demonstratives-quiz", path: "demonstratives-quiz/", desc: "Pick the right form of ten or tamten" } },
    { id: "verbs", path: "verbs/", title: "Tenses", pl: "Czasy", desc: "How to form each verb tense",
      learn: { page: "verbs", path: "verbs/" },
      quiz: { page: "verbs-quiz", path: "verbs-quiz/", desc: "Pick the right verb ending" } },
    { id: "translate", path: "translate/", title: "Translate", pl: "Tłumaczenie", desc: "Write a sentence in Polish and compare it with a translator",
      learn: { page: "translate", path: "translate/", desc: "Your own sentences, compared with a free translator" },
      quiz: { page: "translate-quiz", path: "translate-quiz/", desc: "Write example sentences in Polish" } },
  ];
  var VARIANTS = [["learn", "Learn"], ["quiz", "Quiz"]];

  // polish/, wherever the page using this script is (site-nav.js also loads it on other pages).
  var root = new URL("./", document.currentScript.src).href;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function hashOf(v) {
    var i = v.path.indexOf("#");
    return i === -1 ? "" : v.path.slice(i);
  }

  // The topic and variant ("learn" or "quiz") shown now on the page with this data-page. Two
  // variants on one page are told apart by the #hash.
  function where(page) {
    for (var i = 0; i < PAGES.length; i++) {
      var p = PAGES[i];
      var here = VARIANTS.map(function (v) { return v[0]; }).filter(function (k) { return p[k] && p[k].page === page; });
      if (!here.length) continue;
      var hashed = here.filter(function (k) { return hashOf(p[k]) && hashOf(p[k]) === location.hash; });
      var plain = here.filter(function (k) { return !hashOf(p[k]); });
      return { topic: p, variant: hashed[0] || plain[0] || here[0] };
    }
    return null;
  }

  document.querySelectorAll(".pl-section-nav").forEach(function (nav) {
    var page = nav.dataset.page;
    var at = where(page);

    // One line instead of a row of every topic: where you are (Polish › topic) and a button that
    // opens the site's side panel (js/site-nav.js), which lists all the topics.
    if (!nav.hasAttribute("aria-label")) nav.setAttribute("aria-label", "Polish pages");
    nav.classList.remove("pl-tabs");
    var crumbs = el("span", "pl-crumbs");
    var home = el("a", "pl-crumb", "Polish");
    home.href = root;
    crumbs.appendChild(home);
    if (at) {
      crumbs.appendChild(el("span", "pl-crumb-sep", "›"));
      var topic = el("a", "pl-crumb", at.topic.title);
      topic.href = root + at.topic.path;
      topic.setAttribute("aria-current", "page");
      crumbs.appendChild(topic);
    }
    nav.appendChild(crumbs);
    var all = el("button", "pl-all-topics");
    all.type = "button";
    all.setAttribute("aria-controls", "site-nav-panel");
    all.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    all.appendChild(document.createTextNode("All topics"));
    all.addEventListener("click", function () {
      if (window.SiteNav) window.SiteNav.open();
      else location.href = root;
    });
    nav.appendChild(all);

    // Learn / Quiz: the same switch on every topic page, right under the menu.
    // A topic with only a learn page (Tongue twisters) or a single page (Practice) gets no switch.
    if (!at || at.topic.single || !at.topic.quiz) return;
    var modes = el("nav", "pl-tabs pl-variants");
    modes.setAttribute("aria-label", at.topic.title + ": learn or quiz");
    var links = {};
    VARIANTS.forEach(function (v) {
      var a = el("a", "pl-tab", v[1]);
      a.href = root + at.topic[v[0]].path;
      a.dataset.variant = v[0];
      if (at.topic[v[0]].desc) a.title = at.topic[v[0]].desc;
      links[v[0]] = a;
      modes.appendChild(a);
    });
    function mark() {
      var now = where(page) || at;
      VARIANTS.forEach(function (v) {
        var on = v[0] === now.variant;
        links[v[0]].classList.toggle("active", on);
        if (on) links[v[0]].setAttribute("aria-current", "page");
        else links[v[0]].removeAttribute("aria-current");
      });
    }
    mark();
    window.addEventListener("hashchange", mark);
    nav.insertAdjacentElement("afterend", modes);
  });

  var hub = document.getElementById("pl-hub");
  if (hub) {
    PAGES.forEach(function (p) {
      var ready = p.ready !== false;
      var tile = el("div", "pl-hub-tile" + (ready ? "" : " pl-hub-soon"));
      var main = el(ready ? "a" : "span", "pl-hub-main");
      if (ready) main.href = root + p.path;
      main.appendChild(el("span", "pl-hub-title", p.title));
      tile.appendChild(main);
      var alt = el("span", "pl-hub-pl", p.pl);
      alt.lang = "pl";
      tile.appendChild(alt);
      tile.appendChild(el("span", "pl-hub-desc", ready ? p.desc : "Coming soon"));
      if (ready && !p.single) {
        var modes = el("span", "pl-hub-modes");
        VARIANTS.forEach(function (v) {
          if (!p[v[0]]) return;
          var a = el("a", "pl-hub-mode", v[1]);
          a.href = root + p[v[0]].path;
          if (p[v[0]].desc) a.title = p[v[0]].desc;
          modes.appendChild(a);
        });
        tile.appendChild(modes);
      }
      hub.appendChild(tile);
    });
  }

  window.POLISH_PAGES = PAGES;
})();
