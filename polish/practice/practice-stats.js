// Personal statistics of the endless Practice page, kept in polish.practice (so the progress
// download in backup.js includes it):
//   {topics: {<topic>: {right, wrong, skipped}}, skips: {<card key>: count}, days: {"YYYY-MM-DD": {right, wrong, skipped}}}
// Pure functions, exposed as window.PolishPracticeStats (and module.exports for tests).
(function (root) {
  var OUTCOMES = ["right", "wrong", "skipped"];

  function empty() { return { topics: {}, skips: {}, days: {} }; }

  function clean(stats) {
    var s = stats && typeof stats === "object" ? stats : {};
    return { topics: Object.assign({}, s.topics), skips: Object.assign({}, s.skips), days: Object.assign({}, s.days) };
  }

  function bump(map, key, outcome) {
    var row = Object.assign({ right: 0, wrong: 0, skipped: 0 }, map[key]);
    row[outcome]++;
    map[key] = row;
  }

  // A copy of `stats` with one card counted: outcome is "right", "wrong" or "skipped".
  function record(stats, topic, cardKey, outcome, day) {
    if (OUTCOMES.indexOf(outcome) === -1) throw new Error("bad outcome " + outcome);
    var next = clean(stats);
    bump(next.topics, topic, outcome);
    bump(next.days, day, outcome);
    if (outcome === "skipped") next.skips[cardKey] = (next.skips[cardKey] || 0) + 1;
    return next;
  }

  // Sum of every topic: {right, wrong, skipped, seen}.
  function totals(stats) {
    var t = { right: 0, wrong: 0, skipped: 0 };
    var topics = clean(stats).topics;
    Object.keys(topics).forEach(function (k) {
      OUTCOMES.forEach(function (o) { t[o] += topics[k][o] || 0; });
    });
    t.seen = t.right + t.wrong + t.skipped;
    return t;
  }

  function today(date) {
    var d = date || new Date();
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  var api = { empty: empty, record: record, totals: totals, today: today, OUTCOMES: OUTCOMES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishPracticeStats = api;
})(typeof window !== "undefined" ? window : globalThis);
