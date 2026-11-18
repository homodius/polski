// Multiple-choice quizzes over letters and combinations (how they sound) and over words (what
// they mean): build a shuffled deck, pick answer options, and count mistakes. Pure functions
// only, exposed as window.PolishQuiz (and module.exports for tests). Storage lives in
// letters-quiz.js and words-quiz.js.
(function (root) {
  var OPTION_COUNT = 4;
  var HISTORY_LIMIT = 200;

  // Returns a shuffled copy (Fisher-Yates). `rand` defaults to Math.random.
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

  // Key under which mistakes for an item are counted in polish.mistakes: "word:<pl>" for a
  // word (vocab.js), "letter:<id>" for a letter or combination (letters.js).
  function mistakeKey(item) {
    return item.pl != null ? "word:" + item.pl : "letter:" + item.id;
  }

  // The items to practise, shuffled. `ids` limits the deck to those ids; null or empty means all.
  function buildDeck(items, ids, rand) {
    var pick = items;
    if (ids && ids.length) {
      var wanted = {};
      ids.forEach(function (id) { wanted[id] = true; });
      pick = items.filter(function (item) { return wanted[item.id]; });
    }
    return shuffle(pick, rand);
  }

  // True when two entries are said the same way (ó and u, ć and ci), as listed in `same`.
  function sameSound(a, b) {
    return a.sound === b.sound || (a.same || []).indexOf(b.id) !== -1 || (b.same || []).indexOf(a.id) !== -1;
  }

  // Answer choices for `item`: its own sound plus up to `count - 1` different sounds from the
  // other items, in random order. Entries said the same way never appear as wrong answers to
  // each other, since both would be right.
  function makeOptions(item, items, rand, count) {
    var n = count || OPTION_COUNT;
    var seen = {};
    seen[item.sound] = true;
    var others = [];
    shuffle(items, rand).forEach(function (other) {
      if (seen[other.sound] || sameSound(item, other)) return;
      seen[other.sound] = true;
      others.push(other.sound);
    });
    return shuffle([item.sound].concat(others.slice(0, n - 1)), rand);
  }

  // Lower-cased meaning without brackets or punctuation, so "hello (informal)" and "Hello!"
  // count as the same meaning.
  function plainMeaning(text) {
    return String(text || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  // True when two words mean the same, in English or in Ukrainian, so neither can be a wrong
  // answer for the other (jak się masz / co słychać, cześć / hej).
  function sameMeaning(a, b) {
    if (a.pl === b.pl) return true;
    var aEn = plainMeaning(a.en), bEn = plainMeaning(b.en), aUk = plainMeaning(a.uk), bUk = plainMeaning(b.uk);
    return (aEn && aEn === bEn) || (aUk && aUk === bUk);
  }

  function isPhrase(word) { return /\s/.test(word.pl.trim()); }

  // Answer choices for a word: the word itself plus up to `count - 1` other words whose meaning
  // is shown as a wrong answer, in random order. Wrong answers come from the same topic first
  // (food with food, verbs with verbs), then from words of the same shape (a phrase for a
  // phrase, a single word for a single word), then from anything left, so they are plausible.
  // Returns word objects; show their en / uk.
  function makeMeaningOptions(word, words, rand, count) {
    var n = count || OPTION_COUNT;
    var chosen = [];
    function fits(other) {
      return !sameMeaning(word, other) && !chosen.some(function (c) { return sameMeaning(c, other); });
    }
    var pool = shuffle(words, rand);
    var shape = isPhrase(word);
    var tiers = [
      function (o) { return o.topic === word.topic && isPhrase(o) === shape; },
      function (o) { return o.topic === word.topic; },
      function (o) { return isPhrase(o) === shape; },
      function () { return true; },
    ];
    tiers.forEach(function (tier) {
      pool.forEach(function (other) {
        if (chosen.length < n - 1 && tier(other) && chosen.indexOf(other) === -1 && fits(other)) chosen.push(other);
      });
    });
    return shuffle([word].concat(chosen), rand);
  }

  // Adds one mistake for `item` to a copy of the counts.
  function addMistake(mistakes, item) {
    var next = Object.assign({}, mistakes);
    var key = mistakeKey(item);
    next[key] = (next[key] || 0) + 1;
    return next;
  }

  // Appends one finished round to a copy of the history, keeping the newest HISTORY_LIMIT.
  function addResult(history, result) {
    var next = (Array.isArray(history) ? history : []).concat([result]);
    return next.slice(-HISTORY_LIMIT);
  }

  var api = { OPTION_COUNT: OPTION_COUNT, HISTORY_LIMIT: HISTORY_LIMIT, shuffle: shuffle, sameSound: sameSound, mistakeKey: mistakeKey,
    buildDeck: buildDeck, makeOptions: makeOptions,
    plainMeaning: plainMeaning, sameMeaning: sameMeaning, makeMeaningOptions: makeMeaningOptions, addMistake: addMistake, addResult: addResult };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishQuiz = api;
})(typeof window !== "undefined" ? window : globalThis);
