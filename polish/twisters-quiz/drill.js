// Tongue twister quiz cards: one word of a tongue twister is left out, and the answers are that
// word and look-alikes with one tricky sound swapped (szosą / sosą / śosą), so the choice is
// about the sounds the tongue twister practises. Pure functions only, exposed as
// window.PolishTwisterDrill (and module.exports for tests). The page is twisters-quiz.js.
(function (root) {
  var OPTION_COUNT = 4;

  // Spellings of sounds that are easy to mix up, longest first so "szcz" is not read as "sz" +
  // "cz". Pairs that sound the same (rz / ż, ó / u, ch / h) are left out: the quiz is about
  // hearing and saying the difference, not spelling.
  var UNITS = ["szcz", "dż", "dź", "dz", "sz", "cz", "rz", "ch", "ś", "ć", "ź", "ż", "ł", "ń", "ą", "ę"];
  var SWAPS = {
    szcz: ["ść", "sz"], sz: ["s", "ś"], s: ["sz", "ś"], "ś": ["s", "sz"],
    cz: ["c", "ć"], c: ["cz", "ć"], "ć": ["c", "cz"],
    "ż": ["ź", "z"], "ź": ["ż", "z"], z: ["ż", "ź"], rz: ["ź", "z"],
    dz: ["dź", "dż"], "dź": ["dz", "dż"], "dż": ["dź", "dz"],
    "ł": ["l"], l: ["ł"], "ń": ["n"], "ą": ["o", "ę"], "ę": ["e", "ą"], y: ["i"], i: ["y"],
  };

  function shuffle(list, rand) {
    var r = rand || Math.random;
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function lower(text) { return text.toLocaleLowerCase("pl"); }

  // A word split into its sounds' spellings: "szosą" -> ["sz", "o", "s", "ą"].
  function units(word) {
    var out = [];
    var w = lower(word);
    for (var i = 0; i < w.length;) {
      var unit = null;
      for (var u = 0; u < UNITS.length; u++) {
        if (w.substr(i, UNITS[u].length) === UNITS[u]) { unit = UNITS[u]; break; }
      }
      unit = unit || w.charAt(i);
      out.push(unit);
      i += unit.length;
    }
    return out;
  }

  // The tongue twister split into words and the text between them, so one word can be blanked:
  // [{text: "Szedł", word: true, index: 0}, {text: " "}, ...].
  function parts(pl) {
    var out = [];
    var re = /\p{L}+/gu;
    var last = 0, m, n = 0;
    while ((m = re.exec(pl))) {
      if (m.index > last) out.push({ text: pl.slice(last, m.index) });
      out.push({ text: m[0], word: true, index: n++ });
      last = m.index + m[0].length;
    }
    if (last < pl.length) out.push({ text: pl.slice(last) });
    return out;
  }

  function hasSound(word, sounds) {
    var u = units(word);
    return sounds.some(function (s) { return u.indexOf(s) !== -1 || lower(word).indexOf(s) !== -1; });
  }

  // Which word to leave out: one with at least three letters and, when there is one, a tricky
  // sound of this tongue twister. Returns the word's index in parts(pl).
  function pickBlank(twister, rand) {
    var words = parts(twister.pl).filter(function (p) { return p.word && p.text.length >= 3; });
    if (!words.length) words = parts(twister.pl).filter(function (p) { return p.word; });
    var tricky = words.filter(function (p) { return hasSound(p.text, twister.sounds || []); });
    var pool = tricky.length ? tricky : words;
    return pool[Math.floor((rand || Math.random)() * pool.length)].index;
  }

  function sameCase(model, word) {
    return model.charAt(0) !== lower(model.charAt(0)) ? word.charAt(0).toLocaleUpperCase("pl") + word.slice(1) : word;
  }

  var VOWELS = "aąeęioóuy";
  var SOFT = { "ś": "s", "ć": "c", "ź": "z", "ń": "n", "dź": "dz" };

  // False for a swap that only changes the spelling: before i, s c z n dz already sound like
  // ś ć ź ń dź (ci = ć), and the i of "ie" or "ia" only softens the sound before it.
  function changesSound(u, i, swap) {
    var next = u[i + 1];
    if (next === "i" && (SOFT[swap] === u[i] || SOFT[u[i]] === swap)) return false;
    if (u[i] === "i" && next && VOWELS.indexOf(next) !== -1) return false;
    return true;
  }

  // The word with one sound swapped for a look-alike, every way that can be done. Swaps of the
  // tongue twister's own tricky sounds come first.
  function lookAlikes(word, sounds, rand) {
    var u = units(word);
    var first = [], rest = [];
    u.forEach(function (unit, i) {
      (SWAPS[unit] || []).filter(function (swap) { return changesSound(u, i, swap); }).forEach(function (swap) {
        var next = u.slice();
        next[i] = swap;
        var made = sameCase(word, next.join(""));
        ((sounds || []).indexOf(unit) !== -1 ? first : rest).push(made);
      });
    });
    return shuffle(first, rand).concat(shuffle(rest, rand));
  }

  // Answer choices: the missing word plus up to `count - 1` look-alikes, then, when there aren't
  // enough, other words of about the same length from this tongue twister and then the others, in
  // random order. No choice is the missing word itself, ignoring case.
  function makeOptions(twister, blankIndex, all, rand, count) {
    var n = count || OPTION_COUNT;
    var answer = parts(twister.pl).filter(function (p) { return p.index === blankIndex; })[0].text;
    var seen = {};
    seen[lower(answer)] = true;
    var chosen = [];
    function add(w) {
      if (chosen.length >= n - 1 || seen[lower(w)]) return;
      seen[lower(w)] = true;
      chosen.push(sameCase(answer, lower(w)));
    }
    lookAlikes(answer, twister.sounds, rand).forEach(add);
    var others = [twister].concat(shuffle(all || [], rand)).map(function (t) {
      return parts(t.pl).filter(function (p) { return p.word && p.text.length >= 3; }).map(function (p) { return p.text; });
    });
    var near = function (w) { return Math.abs(w.length - answer.length) <= 2; };
    others.forEach(function (words) { shuffle(words.filter(near), rand).forEach(add); });
    others.forEach(function (words) { shuffle(words, rand).forEach(add); });
    return { answer: answer, options: shuffle([answer].concat(chosen), rand) };
  }

  function mistakeKey(twister) { return "twister:" + twister.id; }

  var api = { OPTION_COUNT: OPTION_COUNT, shuffle: shuffle, units: units, parts: parts, pickBlank: pickBlank,
    lookAlikes: lookAlikes, makeOptions: makeOptions, mistakeKey: mistakeKey };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishTwisterDrill = api;
})(typeof window !== "undefined" ? window : globalThis);
