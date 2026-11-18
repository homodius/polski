// Tongue twisters page: each one with its meaning, the tricky sounds coloured and linked to the
// Letters page, the generated voice at normal speed and slowly, and Easy / Normal / Hard ratings.
(function () {
  var P = window.PolishPage;
  var Ratings = window.PolishRatings;
  var TWISTERS = window.POLISH_TWISTERS || [];
  var LETTERS = window.POLISH_LETTERS || [];
  var node = P.node;

  function $(id) { return document.getElementById(id); }

  var level = $("twisters-level");
  var practiceSelect = $("twisters-set");
  var list = $("twisters-rows");

  var SLOW = 0.6;
  var LEVEL_NAMES = { easy: "easy", medium: "medium", hard: "hard" };
  var BY_ID = {};
  LETTERS.forEach(function (l) { BY_ID[l.id] = l; });

  var TURTLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15a8 6 0 0 1 16 0z"/>' +
    '<path d="M20 13h1.5a1.5 1.5 0 0 0 0-3H19"/><path d="M7 15v3M17 15v3"/><path d="M4 15H2"/></svg>';

  function twisterId(t) { return t.id; }

  function letterLink(text, id) {
    var a = node("a", "pl-twister-mark", text);
    a.href = "../letters/#letter-" + encodeURIComponent(id);
    a.title = BY_ID[id] ? BY_ID[id].text + ": " + BY_ID[id].sound : id;
    return a;
  }

  // The Polish text with each of the twister's tricky sounds turned into a link. At every
  // position the longest sound wins, so "szcz" is not read as "sz" + "cz".
  function markedText(t) {
    var box = node("span", "pl-word-pl pl-twister-pl");
    box.lang = "pl";
    var sounds = t.sounds.filter(function (id) { return BY_ID[id]; })
      .sort(function (a, b) { return b.length - a.length; });
    var text = t.pl;
    var lower = text.toLocaleLowerCase("pl");
    var plain = "";
    for (var i = 0; i < text.length;) {
      var hit = null;
      for (var s = 0; s < sounds.length; s++) {
        if (lower.substr(i, sounds[s].length) === sounds[s]) { hit = sounds[s]; break; }
      }
      if (!hit) {
        plain += text.charAt(i);
        i++;
        continue;
      }
      if (plain) box.appendChild(document.createTextNode(plain));
      plain = "";
      box.appendChild(letterLink(text.substr(i, hit.length), hit));
      i += hit.length;
    }
    if (plain) box.appendChild(document.createTextNode(plain));
    return box;
  }

  function sayButtons(t) {
    var box = node("span", "pl-speaks");
    var normal = P.iconButton(P.SPEAKER, "Say it", "Say " + t.pl);
    normal.addEventListener("click", function () { P.sayGenerated(t.pl, true); });
    var slow = P.iconButton(TURTLE, "Say it slowly", "Say " + t.pl + " slowly");
    slow.classList.add("pl-speak-slow");
    slow.addEventListener("click", function () { P.sayGenerated(t.pl, true, SLOW); });
    box.appendChild(normal);
    box.appendChild(slow);
    return box;
  }

  function meaning(label, text, lang) {
    var p = node("span", "pl-word-meaning" + (lang === "uk" ? " pl-uk-only" : ""));
    p.appendChild(node("span", "pl-label", label));
    p.appendChild(document.createTextNode(" "));
    var t = node("span", "", text);
    if (lang) t.lang = lang;
    p.appendChild(t);
    return p;
  }

  // "Sounds: szcz · rz · ch", each a link to the Letters tab.
  function soundList(t) {
    var p = node("span", "pl-word-note pl-twister-sounds", "Sounds: ");
    t.sounds.filter(function (id) { return BY_ID[id]; }).forEach(function (id, n) {
      if (n) p.appendChild(document.createTextNode(" · "));
      var a = letterLink(BY_ID[id].text, id);
      a.lang = "pl";
      p.appendChild(a);
    });
    return p;
  }

  function row(t, n) {
    var li = node("li", "pl-word pl-twister-row");
    li.id = "twister-" + t.id;
    li.appendChild(sayButtons(t));
    li.appendChild(markedText(t));
    li.appendChild(node("span", "pl-word-topic", n + " · " + LEVEL_NAMES[t.level]));
    li.appendChild(meaning("EN", t.en));
    li.appendChild(meaning("UK", t.uk, "uk"));
    li.appendChild(soundList(t));
    if (t.note) li.appendChild(P.noteText(t.note, "pl-word-note"));
    if (Ratings) li.appendChild(Ratings.control(document, "twister", t.id));
    return li;
  }

  function inLevel(t) { return level.value === "all" || t.level === level.value; }

  function fillPracticeSets() {
    if (Ratings) Ratings.fillSelect(practiceSelect, TWISTERS.filter(inLevel), "twister", twisterId);
  }

  function render() {
    var inThisLevel = TWISTERS.filter(inLevel);
    var set = practiceSelect.value || "all";
    var shown = Ratings ? Ratings.filter(inThisLevel, "twister", set, twisterId) : inThisLevel;
    list.textContent = "";
    shown.forEach(function (t) { list.appendChild(row(t, TWISTERS.indexOf(t) + 1)); });
    $("twisters-count").textContent = shown.length === TWISTERS.length
      ? TWISTERS.length + " tongue twisters"
      : shown.length + " of " + TWISTERS.length + " tongue twisters";
    $("twisters-empty").hidden = shown.length > 0;
  }

  // The practice-set menu here is the tongue twisters' own, so its choice is not saved over
  // the words' one.
  if (Ratings) {
    fillPracticeSets();
    practiceSelect.value = "all";
  } else {
    practiceSelect.hidden = true;
  }

  level.addEventListener("change", function () {
    fillPracticeSets();
    render();
  });
  practiceSelect.addEventListener("change", render);
  // Keep the counts in the menu right, and drop a row that leaves the chosen set.
  window.addEventListener("polish:ratings", function (e) {
    if (e.detail.kind !== "twister") return;
    fillPracticeSets();
    if ((practiceSelect.value || "all") !== "all") render();
  });
  render();
})();
