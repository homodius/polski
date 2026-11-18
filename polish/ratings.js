// How hard D finds each word or letter, and the practice sets built from that.
// Saved in localStorage:
//   polish.ratings  {"word:<pl>": "hard" | "normal" | "easy", "letter:<id>": ...}
//   polish.picked   {"word:<pl>": true, "letter:<id>": true}   (the hand-picked set)
//   polish.practiceSet  the set last chosen in the menu
// Exposed as window.PolishRatings (and module.exports for tests). Every change fires a
// "polish:ratings" event on window so other parts of the page can redraw.
(function (root) {
  var RATINGS_KEY = "polish.ratings";
  var PICKED_KEY = "polish.picked";
  var SET_KEY = "polish.practiceSet";
  var LEVELS = ["easy", "normal", "hard"];
  var SETS = [
    { value: "all", label: "All" },
    { value: "hard", label: "Hard" },
    { value: "normal", label: "Normal" },
    { value: "easy", label: "Easy" },
    { value: "manual", label: "Picked" },
  ];

  function storage() {
    try { return root.localStorage || null; } catch (e) { return null; }
  }

  function load(key) {
    var s = storage();
    if (!s) return {};
    try {
      var parsed = JSON.parse(s.getItem(key) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function save(key, value) {
    var s = storage();
    if (!s) return;
    try { s.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked or full */ }
  }

  function changed(kind, id) {
    if (typeof root.dispatchEvent !== "function" || typeof root.CustomEvent !== "function") return;
    root.dispatchEvent(new root.CustomEvent("polish:ratings", { detail: { kind: kind, id: id } }));
  }

  // kind is "word" or "letter"; id is the word's Polish text or the letter's id.
  function key(kind, id) { return kind + ":" + id; }

  // "hard", "normal", "easy", or "" when not rated yet.
  function get(kind, id) {
    var level = load(RATINGS_KEY)[key(kind, id)];
    return LEVELS.indexOf(level) === -1 ? "" : level;
  }

  // Pass "" or null to clear the rating.
  function set(kind, id, level) {
    if (level && LEVELS.indexOf(level) === -1) throw new Error("Unknown rating: " + level);
    var all = load(RATINGS_KEY);
    if (level) all[key(kind, id)] = level;
    else delete all[key(kind, id)];
    save(RATINGS_KEY, all);
    changed(kind, id);
  }

  function isPicked(kind, id) {
    return load(PICKED_KEY)[key(kind, id)] === true;
  }

  function setPicked(kind, id, on) {
    var all = load(PICKED_KEY);
    if (on) all[key(kind, id)] = true;
    else delete all[key(kind, id)];
    save(PICKED_KEY, all);
    changed(kind, id);
  }

  function inSet(kind, id, setName, ratings, picked) {
    if (!setName || setName === "all") return true;
    if (setName === "manual") return picked[key(kind, id)] === true;
    return ratings[key(kind, id)] === setName;
  }

  // The items in a practice set. idOf(item) gives the id used when it was rated.
  function filter(items, kind, setName, idOf) {
    var ratings = load(RATINGS_KEY);
    var picked = load(PICKED_KEY);
    return items.filter(function (item) { return inSet(kind, idOf(item), setName, ratings, picked); });
  }

  // How many of the items are in each set: {all, hard, normal, easy, manual}.
  function counts(items, kind, idOf) {
    var ratings = load(RATINGS_KEY);
    var picked = load(PICKED_KEY);
    var r = {};
    SETS.forEach(function (s) { r[s.value] = 0; });
    items.forEach(function (item) {
      var id = idOf(item);
      SETS.forEach(function (s) { if (inSet(kind, id, s.value, ratings, picked)) r[s.value]++; });
    });
    return r;
  }

  function savedSet() {
    var s = storage();
    var v = null;
    try { v = s && s.getItem(SET_KEY); } catch (e) { /* storage blocked */ }
    return SETS.some(function (x) { return x.value === v; }) ? v : "all";
  }

  function saveSet(value) {
    var s = storage();
    try { if (s) s.setItem(SET_KEY, value); } catch (e) { /* storage blocked */ }
  }

  // Fills a <select> with the sets and how many items each holds, e.g. "Hard (12)".
  // Call again after ratings change to refresh the numbers; the choice is kept.
  function fillSelect(select, items, kind, idOf) {
    var current = select.value || savedSet();
    var n = counts(items, kind, idOf);
    select.textContent = "";
    SETS.forEach(function (s) {
      var o = select.ownerDocument.createElement("option");
      o.value = s.value;
      o.textContent = s.value === "all" ? "Practise all" : "Practise " + s.label.toLowerCase() + " (" + n[s.value] + ")";
      select.appendChild(o);
    });
    select.value = current;
  }

  var LEVEL_LABELS = { easy: "Easy", normal: "Normal", hard: "Hard" };

  // A row of Easy / Normal / Hard buttons plus a Pick toggle for one item. Tapping the
  // rating already chosen clears it. update(kind, id) points the row at another item.
  function control(doc, kind, id) {
    var box = doc.createElement("span");
    box.className = "pl-rate";
    box.setAttribute("role", "group");
    var buttons = {};
    LEVELS.forEach(function (level) {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "pl-rate-btn pl-rate-" + level;
      b.textContent = LEVEL_LABELS[level];
      b.addEventListener("click", function () { set(box.kind, box.itemId, get(box.kind, box.itemId) === level ? "" : level); });
      buttons[level] = b;
      box.appendChild(b);
    });
    var pick = doc.createElement("button");
    pick.type = "button";
    pick.className = "pl-rate-btn pl-rate-pick";
    pick.addEventListener("click", function () { setPicked(box.kind, box.itemId, !isPicked(box.kind, box.itemId)); });
    box.appendChild(pick);

    function show() {
      var level = get(box.kind, box.itemId);
      LEVELS.forEach(function (l) { buttons[l].setAttribute("aria-pressed", l === level ? "true" : "false"); });
      var on = isPicked(box.kind, box.itemId);
      pick.setAttribute("aria-pressed", on ? "true" : "false");
      pick.textContent = on ? "Picked" : "Pick";
      pick.title = on ? "Remove from the hand-picked set" : "Add to the hand-picked set";
    }
    box.update = function (k, i) {
      box.kind = k;
      box.itemId = i;
      box.setAttribute("aria-label", "How hard is " + i);
      show();
    };
    box.show = show;
    box.update(kind, id);
    if (controls.length > 2000) controls = controls.filter(function (c) { return c.isConnected; });
    controls.push(box);
    return box;
  }

  // One listener for every row: rows dropped from the page are forgotten on the next change.
  var controls = [];
  if (typeof root.addEventListener === "function") {
    root.addEventListener("polish:ratings", function (e) {
      controls = controls.filter(function (box) { return box.isConnected; });
      controls.forEach(function (box) {
        if (box.kind === e.detail.kind && box.itemId === e.detail.id) box.show();
      });
    });
  }

  var api = { LEVELS: LEVELS, SETS: SETS, RATINGS_KEY: RATINGS_KEY, PICKED_KEY: PICKED_KEY, SET_KEY: SET_KEY,
    key: key, get: get, set: set, isPicked: isPicked, setPicked: setPicked, filter: filter, counts: counts,
    savedSet: savedSet, saveSet: saveSet, fillSelect: fillSelect, control: control };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishRatings = api;
})(typeof window !== "undefined" ? window : globalThis);
