// Spaced-repetition scheduling, a simplified SM-2.
// Pure functions only, exposed as window.PolishSRS (and module.exports for tests).
(function (root) {
  var MINUTE = 60 * 1000;
  var DAY = 24 * 60 * MINUTE;
  var GRADES = ["again", "hard", "good", "easy"];
  var START_EASE = 2.5;
  var MIN_EASE = 1.3;
  var RELEARN_DELAY = 10 * MINUTE;

  function newCardState() {
    return { ease: START_EASE, interval: 0, reps: 0, lapses: 0, due: 0 };
  }

  // Next state after the card was answered with `grade` at `now`.
  // `interval` is in days; `due` is a timestamp in milliseconds.
  function schedule(state, grade, now) {
    if (GRADES.indexOf(grade) === -1) throw new Error("Unknown grade: " + grade);
    var s = Object.assign(newCardState(), state);

    if (grade === "again") {
      return {
        ease: Math.max(MIN_EASE, s.ease - 0.2),
        interval: 0,
        reps: 0,
        lapses: s.reps > 0 ? s.lapses + 1 : s.lapses,
        due: now + RELEARN_DELAY,
      };
    }

    var ease = s.ease;
    var interval;
    if (grade === "hard") {
      ease = Math.max(MIN_EASE, ease - 0.15);
      interval = s.reps === 0 ? 1 : Math.max(s.interval + 1, Math.round(s.interval * 1.2));
    } else if (grade === "good") {
      if (s.reps === 0) interval = 1;
      else if (s.reps === 1) interval = 3;
      else interval = Math.max(s.interval + 1, Math.round(s.interval * ease));
    } else {
      ease = ease + 0.15;
      interval = s.reps === 0 ? 4 : Math.max(s.interval + 1, Math.round(s.interval * ease * 1.3));
    }
    return { ease: ease, interval: interval, reps: s.reps + 1, lapses: s.lapses, due: now + interval * DAY };
  }

  // Every due review (oldest first), then up to `newLimit` unseen cards in list order.
  function buildQueue(cards, progress, now, newLimit) {
    var due = [];
    var fresh = [];
    cards.forEach(function (card) {
      var state = progress[card.id];
      if (!state) fresh.push(card);
      else if (state.due <= now) due.push(card);
    });
    due.sort(function (a, b) { return progress[a.id].due - progress[b.id].due; });
    return due.concat(fresh.slice(0, Math.max(0, newLimit)));
  }

  function stats(cards, progress, now) {
    var r = { total: cards.length, unseen: 0, due: 0, learned: 0 };
    cards.forEach(function (card) {
      var state = progress[card.id];
      if (!state) r.unseen++;
      else if (state.due <= now) r.due++;
      else if (state.interval >= 1) r.learned++;
    });
    return r;
  }

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

  // Stable id from the Polish text, so saved progress survives edits to translations.
  function cardId(pl) {
    return pl.toLowerCase().replace(/[?.!,…]/g, "").trim().replace(/\s+/g, "-");
  }

  // Lowercase and strip accents so "zolw" finds "żółw" and "slonce" finds "słońce".
  function fold(text) {
    return text.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  var api = { MINUTE: MINUTE, DAY: DAY, GRADES: GRADES, newCardState: newCardState, schedule: schedule,
    buildQueue: buildQueue, stats: stats, shuffle: shuffle, cardId: cardId, fold: fold };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishSRS = api;
})(typeof window !== "undefined" ? window : globalThis);
