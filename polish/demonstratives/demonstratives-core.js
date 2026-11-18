// Logic shared by the demonstratives Learn page and quiz, with no page DOM: picking a form out
// of the tables in demonstratives-data.js, turning the quiz sentences into cards, choosing wrong
// options and writing the rule shown after a wrong answer (English and Ukrainian).
//
// window.PolishDemonstratives
//   formOf(word, slot, caseId)    "t|ego" (slot m / mi pick the accusative variant)
//   ukOf(word, slot, caseId)      "цього"
//   plain("t|ego sam|ego")        "tego samego"
//   buildItems(data)              one card per sentence: {id, word, slot, caseId, cue, en, uk, by, form, answer, ukForm}
//   filterItems(items, wordId, caseId)
//   sentence(item)                the sentence with the answer in place
//   makeOptions(item, rand)       four forms: the answer and three others of the same word
//   rule(item, cases)             {en, uk} for PolishPage.ruleBox; cases = POLISH_CASES.cases
//   SLOT_NAMES                    {slot: [en, uk]}
(function (root) {
  var CASES = ["nom", "gen", "dat", "acc", "ins", "loc"];

  var SLOT_NAMES = {
    m: ["Masculine (person or animal)", "Чоловічий рід (особа чи тварина)"],
    mi: ["Masculine (thing)", "Чоловічий рід (річ)"],
    f: ["Feminine", "Жіночий рід"],
    n: ["Neuter", "Середній рід"],
    plMen: ["Plural, men or a group with a man", "Множина, чоловіки або група з чоловіком"],
    plOther: ["Plural, no men", "Множина, без чоловіків"],
  };

  function column(slot) { return slot === "mi" ? "m" : slot; }

  // The masculine accusative cell is "people and animals / things".
  function pick(cell, slot, caseId) {
    var parts = cell.split(" / ");
    return parts.length > 1 && caseId === "acc" && slot === "mi" ? parts[1] : parts[0];
  }

  function formOf(word, slot, caseId) {
    return pick(word.forms[column(slot)][CASES.indexOf(caseId)], slot, caseId);
  }

  function ukOf(word, slot, caseId) {
    return pick(word.ukForms[column(slot)][CASES.indexOf(caseId)], slot, caseId);
  }

  function plain(form) { return form.replace(/\|/g, ""); }

  function wordById(data, id) {
    return data.words.filter(function (w) { return w.id === id; })[0];
  }

  function buildItems(data) {
    var seen = {};
    return data.sentences.map(function (s) {
      var word = wordById(data, s[0]);
      var id = s[0] + ":" + s[1] + ":" + s[2];
      if (seen[id]) id += ":" + (++seen[id]);
      else seen[id] = 1;
      var form = formOf(word, s[1], s[2]);
      return {
        id: id, word: word, slot: s[1], caseId: s[2], cue: s[3], en: s[4], uk: s[5], by: s[6],
        form: form, answer: plain(form), ukForm: ukOf(word, s[1], s[2]),
      };
    });
  }

  function filterItems(items, wordId, caseId) {
    return items.filter(function (it) {
      return (!wordId || wordId === "all" || it.word.id === wordId) && (!caseId || caseId === "all" || it.caseId === caseId);
    });
  }

  function capital(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

  // The answer as it stands in the sentence: capitalised when the sentence starts with it.
  function inSentence(item, text) {
    return item.cue.indexOf("___") === 0 ? capital(text) : text;
  }

  function sentence(item) {
    return item.cue.replace("___", inSentence(item, item.answer));
  }

  // Every distinct form of a word, each with the cells it sits in.
  function allForms(word) {
    var out = {};
    Object.keys(word.forms).forEach(function (col) {
      word.forms[col].forEach(function (cell, i) {
        cell.split(" / ").forEach(function (f) {
          var p = plain(f);
          (out[p] = out[p] || []).push({ col: col, caseId: CASES[i] });
        });
      });
    });
    return out;
  }

  function shuffle(list, rand) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  // Three wrong forms, first from the same column or the same case (the ones easiest to mix
  // up: tę and tą, tego and ten), then any other form of the word.
  function makeOptions(item, rand) {
    rand = rand || Math.random;
    var forms = allForms(item.word);
    var col = column(item.slot);
    var near = [], far = [];
    Object.keys(forms).forEach(function (f) {
      if (f === item.answer) return;
      var close = forms[f].some(function (c) { return c.col === col || c.caseId === item.caseId; });
      (close ? near : far).push(f);
    });
    var wrong = shuffle(near, rand).concat(shuffle(far, rand)).slice(0, 3);
    return shuffle([item.answer].concat(wrong), rand);
  }

  function f(word, slot, caseId) { return plain(formOf(word, slot, caseId)); }

  // Extra tips for the usual mix-ups, [en, uk].
  function tips(item) {
    var w = item.word, out = [];
    var c = item.caseId, s = item.slot;
    if (s === "f" && (c === "acc" || c === "ins")) {
      var acc = f(w, "f", "acc"), ins = f(w, "f", "ins");
      if (acc !== ins) {
        out.push(["Feminine accusative is {" + acc + "}, instrumental is {" + ins + "}. In speech you may hear {" + ins + "} for both, but write {" + acc + "}.",
          "Жіночий знахідний {" + acc + "}, орудний {" + ins + "}. У розмові часто кажуть {" + ins + "} в обох, але пишуть {" + acc + "}."]);
      } else if (w.id === "tamten") {
        out.push(["{tamten} has {tamtą} in both the accusative and the instrumental; there is no tamtę.",
          "{tamten} має {tamtą} і в знахідному, і в орудному; форми tamtę немає."]);
      }
    }
    if ((s === "m" || s === "mi") && c === "acc") {
      out.push(["Masculine accusative: {" + f(w, "m", "acc") + "} for people and animals, {" + f(w, "mi", "acc") + "} for things.",
        "Чоловічий знахідний: {" + f(w, "m", "acc") + "} для людей і тварин, {" + f(w, "mi", "acc") + "} для речей (як цього пана, але цей стіл)."]);
    }
    if ((s === "plMen" || s === "plOther") && (c === "nom" || c === "acc")) {
      out.push(["Plural: {" + f(w, "plMen", "nom") + "} for men or a group with a man, {" + f(w, "plOther", "nom") + "} for women, animals and things. For men the accusative is like the genitive: {" + f(w, "plMen", "acc") + "}.",
        "Множина: {" + f(w, "plMen", "nom") + "} для чоловіків або групи з чоловіком, {" + f(w, "plOther", "nom") + "} для жінок, тварин і речей. Знахідний для чоловіків як родовий: {" + f(w, "plMen", "acc") + "}."]);
    }
    if (c === "gen" && /^nie /.test(item.by)) {
      out.push(["After a negative the object goes into the genitive: {mam ten dom} → {nie mam tego domu}.",
        "Після заперечення додаток стоїть у родовому: {mam ten dom} → {nie mam tego domu} (не маю цього дому)."]);
    }
    if (c === "dat" && (s === "m" || s === "mi" || s === "n") && w.id !== "taki") {
      out.push(["Remember {" + f(w, "m", "dat") + "} with {dwa lata temu} (two years ago): the same -emu.",
        "Запам'ятай через {dwa lata temu} (два роки тому): те саме -emu, як тому."]);
    }
    if (item.answer === "tym" || item.answer === "tamtym") {
      out.push(["{" + item.answer + "} does three jobs: instrumental and locative of masculine and neuter, and dative plural.",
        "{" + item.answer + "} має три ролі: орудний і місцевий чоловічого й середнього роду та давальний множини."]);
    }
    return out;
  }

  function rule(item, cases) {
    var info = (cases || []).filter(function (x) { return x.id === item.caseId; })[0] ||
      { en: item.caseId, pl: "", q: "", uk: item.caseId, ukQ: "" };
    var en, uk;
    if (item.by) {
      en = "After {" + item.by + "} comes the " + info.en + " (" + info.pl + ", " + info.q + ").";
      uk = "Після {" + item.by + "} стоїть " + info.uk + " відмінок (" + info.ukQ + ").";
    } else {
      en = "It is the subject or goes with it, so it is the nominative (mianownik, kto? co?).";
      uk = "Це підмет або слово при ньому, тому називний відмінок (хто? що?).";
    }
    var names = SLOT_NAMES[item.slot];
    en += " " + capital(info.en) + " of {" + item.word.pl + "}, " + names[0].charAt(0).toLowerCase() + names[0].slice(1) +
      ": **{" + item.answer + "}**, like Ukrainian " + item.ukForm + ".";
    uk += " " + names[1] + ": **{" + item.answer + "}**, як українське " + item.ukForm + ".";
    tips(item).forEach(function (t) {
      en += " " + t[0];
      uk += " " + t[1];
    });
    return { en: en, uk: uk };
  }

  function mistakeKey(item) { return "demo:" + item.id; }

  var api = {
    CASES: CASES, SLOT_NAMES: SLOT_NAMES, formOf: formOf, ukOf: ukOf, plain: plain, buildItems: buildItems,
    filterItems: filterItems, sentence: sentence, inSentence: inSentence, makeOptions: makeOptions, rule: rule,
    mistakeKey: mistakeKey, allForms: allForms,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishDemonstratives = api;
})(typeof window !== "undefined" ? window : globalThis);
