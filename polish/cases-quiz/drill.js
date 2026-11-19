// Case endings quiz logic: turns the nouns in cases-drill.js into quiz items (one per noun,
// number and case) and picks ending-only answer choices. Pure functions only, exposed as
// window.PolishCaseDrill (and module.exports for tests). The page lives in cases-quiz.js.
(function (root) {
  var Q = root.PolishQuiz || (typeof require === "function" ? require("../quiz.js") : null);
  var OPTION_COUNT = 4;

  // "kot|u/owi" → {stem: "kot", ending: "u", also: ["owi"], form: "kotu"}
  function parseForm(text) {
    var bar = text.indexOf("|");
    var stem = text.slice(0, bar);
    var endings = text.slice(bar + 1).split("/");
    return { stem: stem, ending: endings[0], also: endings.slice(1), form: stem + endings[0] };
  }

  // The stem of the dictionary form, to point out when a case changes it (pies → ps-).
  function baseStem(noun) {
    var nom = (noun.sg && noun.sg.nom) || (noun.pl && noun.pl.nom);
    return nom ? parseForm(nom).stem : noun.word;
  }

  // "z" or "ze" before a form: ze before s, z, ś, ź, ż, sz, rz followed by a consonant.
  function withZ(form) {
    return /^(sz|rz|[szśźż])[^aąeęioóuy]/i.test(form) ? "ze" : "z";
  }

  // The part of `form` shared with the dictionary stem: "mamie" with "mam" → "mam". When a case
  // changes the stem (mam → mami-, kobiet → kobieci-, okn → okni-), the card prints only this part,
  // so the changed letters are part of what you pick ("-ie", not "-e" after a printed "mami").
  function sharedStart(form, stem) {
    var n = 0;
    while (n < form.length && n < stem.length && form.charAt(n) === stem.charAt(n)) n++;
    return form.slice(0, n);
  }

  function fill(template, noun) {
    return template.replace(/\{en\}/g, noun.en || "").replace(/\{enPl\}/g, noun.enPl || noun.en || "");
  }

  // [Polish with ___, English] for one slot, or null when the slot has no sentence.
  function cueFor(noun, num, caseId, cues) {
    var own = noun.cues || {};
    var cue = (num === "pl" && own[caseId + "Pl"]) || own[caseId];
    if (!cue) {
      var key = caseId;
      if (caseId === "dat" && noun.alive) key = "datAlive";
      else if (caseId === "ins" && noun.alive) key = "insAlive";
      else if (caseId === "ins" && num === "pl") key = "insPl";
      cue = cues[key];
    }
    if (!cue) return null;
    return [cue[0], fill(num === "sg" ? cue[1] : cue[2], noun)];
  }

  // Every slot worth asking about: no nominative singular (that's the word itself), the
  // vocative only for people and animals and only in the singular (its plural is the
  // nominative), and nothing listed in a noun's `skip`.
  function buildItems(data) {
    var cases = {};
    data.cases.forEach(function (c) { cases[c.id] = c; });
    var items = [];
    data.nouns.forEach(function (noun) {
      var stem0 = baseStem(noun);
      ["sg", "pl"].forEach(function (num) {
        var forms = noun[num];
        if (!forms) return;
        data.cases.forEach(function (c) {
          if (!forms[c.id]) return;
          if (num === "sg" && c.id === "nom") return;
          if (c.id === "voc" && (num === "pl" || !noun.alive)) return;
          if ((noun.skip || []).indexOf(num + "." + c.id) !== -1) return;
          var cue = cueFor(noun, num, c.id, data.cues);
          if (!cue) return;
          var f = parseForm(forms[c.id]);
          // What the card prints and asks: the data's stem and ending, unless the stem changed,
          // then the part shared with the dictionary stem and everything after it.
          var shown = f.stem === stem0 ? f.stem : sharedStart(f.form, stem0);
          items.push({
            id: noun.word + "." + num + "." + c.id,
            word: noun.word, en: noun.en, uk: noun.uk, gender: noun.gender,
            num: num, caseId: c.id, caseInfo: cases[c.id],
            stem: shown, ending: f.form.slice(shown.length),
            also: f.also.map(function (e) { return (f.stem + e).slice(shown.length); }), form: f.form,
            // The data's own split, for the rule after a wrong answer (endings grouped as the
            // grammar names them: -e, not -ie / -cie).
            dataStem: f.stem, dataEnding: f.ending, dataAlso: f.also,
            stemChanged: f.stem !== stem0 ? stem0 : "",
            cue: cue[0].replace("{z}", withZ(f.form)),
            cueEn: cue[1],
            ctx: (noun.ctx && noun.ctx[num]) || null,
            note: noun.note || "",
          });
        });
      });
    });
    return items;
  }

  // The sentence with the gap filled in.
  function sentence(item) {
    return item.cue.replace("___", item.form);
  }

  // Ending-only answer choices: the right ending plus wrong ones that are easy to mix up,
  // first the same word's other forms (after the same printed stem), then other words' endings
  // in this case. Endings that would also be right here (kotu / kotowi) never show up as wrong
  // answers.
  function makeOptions(item, items, rand, count) {
    var n = count || OPTION_COUNT;
    var banned = {};
    banned[item.ending] = true;
    item.also.forEach(function (e) { banned[e] = true; });
    var sameWord = [], sameCase = [], rest = [];
    items.forEach(function (other) {
      if (other.word === item.word) {
        // Another form of this word, cut after the stem this card prints: mamę → -ę after "mam".
        [other.form].concat(other.also.map(function (e) { return other.stem + e; })).forEach(function (form) {
          if (form.indexOf(item.stem) === 0) sameWord.push(form.slice(item.stem.length));
        });
      } else if (other.caseId === item.caseId) sameCase.push(other.ending);
      else rest.push(other.ending);
    });
    var wrong = [];
    function take(list, upTo) {
      Q.shuffle(list, rand).forEach(function (e) {
        if (wrong.length >= upTo || banned[e]) return;
        banned[e] = true;
        wrong.push(e);
      });
    }
    // After a shortened stem (mam___, kobie___) other words' endings rarely look like a word,
    // so this word's own forms come first.
    take(sameWord, item.stem === item.dataStem ? 2 : n - 1);
    take(sameCase, n - 1);
    take(sameWord, n - 1);
    take(rest, n - 1);
    return Q.shuffle([item.ending].concat(wrong), rand);
  }

  // How an ending is shown on a button: "-em", or "∅" for no ending.
  function label(ending) {
    return ending ? "-" + ending : "∅";
  }

  function mistakeKey(item) {
    return "case:" + item.id;
  }

  // The items matching the case and number filters ("all" matches everything).
  function filterItems(items, caseId, num) {
    return items.filter(function (item) {
      return (caseId === "all" || item.caseId === caseId) && (num === "all" || item.num === num);
    });
  }


  // ---------- Rule shown after a wrong answer ----------

  var GENDERS = {
    "m-pers": ["masculine, a person", "чоловічий (особа)"],
    "m-anim": ["masculine, an animal", "чоловічий (тварина)"],
    "m-inan": ["masculine, a thing", "чоловічий (річ)"],
    f: ["feminine", "жіночий"],
    n: ["neuter", "середній"],
  };
  // In the plural Polish only splits male persons (oni) from everything else (one).
  var GENDERS_PL = {
    "m-pers": ["masculine, people", "чоловічий (особи)"],
    "m-anim": ["masculine, animals", "чоловічий (тварини)"],
    "m-inan": ["masculine, things", "чоловічий (речі)"],
    f: ["feminine", "жіночий"],
    n: ["neuter", "середній"],
  };
  function genderName(item) {
    var g = (item.num === "pl" ? GENDERS_PL : GENDERS)[item.gender];
    return g || [item.gender, item.gender];
  }
  var NUMBERS = { sg: ["singular", "однина"], pl: ["plural", "множина"] };

  // The rule for an item, to show after a wrong answer: {en, uk}, with Polish in {braces}. It
  // lists the endings this case takes for words of the same gender and number in the quiz,
  // most common first, each with up to two other words as examples; the right one in **bold**:
  // "Genitive ({kogo? czego?}), singular, masculine things: **-u ({domu}, {stołu})** · -a ({klucza})."
  function rule(item, items) {
    var byEnding = {};
    var order = [];
    items.forEach(function (other) {
      if (other.caseId !== item.caseId || other.num !== item.num || other.gender !== item.gender) return;
      [other.dataEnding].concat(other.dataAlso).forEach(function (e) {
        if (!byEnding[e]) {
          byEnding[e] = { ending: e, count: 0, words: [] };
          order.push(byEnding[e]);
        }
        var b = byEnding[e];
        b.count++;
        if (other.word !== item.word && b.words.length < 2) b.words.push(other.dataStem + e);
      });
    });
    // An ending only this word has gets its own form as the example.
    order.forEach(function (b) {
      if (!b.words.length && (b.ending === item.dataEnding || item.dataAlso.indexOf(b.ending) !== -1)) b.words.push(item.dataStem + b.ending);
    });
    order.sort(function (a, b) { return b.count - a.count; });
    function list(lang) {
      return order.map(function (b) {
        var text = (b.ending ? "-" + b.ending : (lang ? "без закінчення" : "no ending")) +
          (b.words.length ? " (" + b.words.map(function (w) { return "{" + w + "}"; }).join(", ") + ")" : "");
        var right = b.ending === item.dataEnding || item.dataAlso.indexOf(b.ending) !== -1;
        return right ? "**" + text + "**" : text;
      }).join(" · ");
    }
    var c = item.caseInfo;
    var g = genderName(item);
    var n = NUMBERS[item.num];
    var ukName = c.uk ? c.uk.charAt(0).toUpperCase() + c.uk.slice(1) + " відмінок" : c.name;
    return {
      en: c.name + " ({" + c.q + "}), " + n[0] + ", " + g[0] + ": " + list() + ".",
      uk: ukName + " (" + (c.ukQ || "{" + c.q + "}") + "), " + n[1] + ", " + g[1] + ": " + list("uk") + ".",
    };
  }

  // Who or what the card is about, for the line under the case: number, gender and the pronoun
  // that stands for the word ("on", "ona", "ono"; in the plural "oni" only for male persons,
  // "one" for everyone and everything else). {num: [en, uk], gender: [en, uk], pronoun}.
  var PRONOUNS = { "m-pers": "on", "m-anim": "on", "m-inan": "on", f: "ona", n: "ono" };
  function who(item) {
    var g = genderName(item);
    var pronoun = item.num === "pl" ? (item.gender === "m-pers" ? "oni" : "one") : PRONOUNS[item.gender] || "";
    return { num: NUMBERS[item.num], gender: g, pronoun: pronoun };
  }

  var api = { OPTION_COUNT: OPTION_COUNT, parseForm: parseForm, withZ: withZ, buildItems: buildItems,
    sentence: sentence, makeOptions: makeOptions, label: label, mistakeKey: mistakeKey, filterItems: filterItems,
    rule: rule, who: who };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishCaseDrill = api;
})(typeof window !== "undefined" ? window : globalThis);
