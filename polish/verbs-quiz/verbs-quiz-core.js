// Verb tenses quiz: turn the verb tables (../verbs/verbs-data.js) into questions such as
// "ja · past · masculine: robi___", and pick ending options for them. Pure functions only,
// exposed as window.PolishVerbsQuiz (and module.exports for tests). The page is verbs-quiz.js.
(function (root) {
  var OPTION_COUNT = 4;

  // Fisher-Yates on a copy. `rand` defaults to Math.random.
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

  // The pronoun said before a form: "ja", "ona", "oni"... none for the imperative.
  function pronoun(data, tenseId, person, gender) {
    if (tenseId === "imperative") return "";
    if (gender && data.genders[gender] && person.charAt(0) === "3") return data.genders[gender].pl;
    var p = data.persons.filter(function (x) { return x.id === person; })[0];
    return p ? p.pl.split(" / ")[0] : "";
  }

  // Splits one cell into what is shown (before + after) and the ending to pick. A compound
  // future asks for the ending of będę: "będ_ robić"; with a gender, the ending of the l-form:
  // "będę robi_". A conditional is cut before the ł / l of the past form ("robi_" + "łabym"), so
  // the printed part doesn't already say masculine or feminine; that needs `verb` and `tenseId`.
  function split(cell, verb, tenseId) {
    var f = cell.form;
    if (tenseId === "conditional" && verb && verb.forms.past && cell.gender) {
      var plural = cell.person.charAt(1) === "p";
      var l = (verb.forms.past[plural ? "3p" : "3s"] || {})[cell.gender];
      var whole = f.stem + f.end;
      if (l && whole.indexOf(l.stem) === 0) {
        var pos = f.text.lastIndexOf(whole);
        if (pos === -1) pos = 0;
        return { before: f.text.slice(0, pos) + l.stem, ending: whole.slice(l.stem.length), after: f.text.slice(pos + whole.length), slot: "" };
      }
    }
    if (f.aux && cell.gender === "inf") {
      var auxWord = f.aux.stem + f.aux.end;
      return { before: f.aux.stem, ending: f.aux.end, after: f.text.slice(auxWord.length), slot: "aux" };
    }
    var word = f.stem + f.end;
    var at = f.text.lastIndexOf(word);
    if (at === -1) at = 0;
    return { before: f.text.slice(0, at) + f.stem, ending: f.end, after: f.text.slice(at + word.length), slot: f.aux ? "l" : "" };
  }

  // Key under which mistakes are counted in polish.mistakes.
  function questionKey(verb, tenseId, cell) {
    return "verb:" + verb.inf + ":" + tenseId + ":" + cell.person + (cell.gender ? ":" + cell.gender : "");
  }

  // One question per form of the given verbs, limited to `tenseIds` when it has any:
  // {key, verb, tense, person, gender, pronoun, before, ending, after, text, group}.
  function buildQuestions(data, verbs, tenseIds) {
    var out = [];
    verbs.forEach(function (verb) {
      data.tenses.forEach(function (tense) {
        if (tenseIds && tenseIds.length && tenseIds.indexOf(tense.id) === -1) return;
        data.cells(verb, tense.id).forEach(function (cell) {
          var s = split(cell, verb, tense.id);
          out.push({
            key: questionKey(verb, tense.id, cell), verb: verb, tense: tense, person: cell.person, gender: cell.gender,
            pronoun: pronoun(data, tense.id, cell.person, cell.gender),
            before: s.before, ending: s.ending, after: s.after, text: cell.form.text,
            group: tense.id + (s.slot ? ":" + s.slot : ""),
          });
        });
      });
    });
    return out;
  }

  // Endings to choose from: the right one plus up to `count - 1` others, first from the same
  // verb and tense (the endings that are easy to mix up), then the same tense of other verbs.
  function makeOptions(q, questions, rand, count) {
    var n = count || OPTION_COUNT;
    var seen = {};
    seen[q.ending] = true;
    var near = [];
    var far = [];
    shuffle(questions, rand).forEach(function (other) {
      if (seen[other.ending] || other.group !== q.group) return;
      seen[other.ending] = true;
      (other.verb === q.verb ? near : far).push(other.ending);
    });
    return shuffle([q.ending].concat(near.concat(far).slice(0, n - 1)), rand);
  }

  // Up to `size` questions in random order (all of them when size is 0).
  function buildRound(questions, size, rand) {
    var all = shuffle(questions, rand);
    return size && all.length > size ? all.slice(0, size) : all;
  }

  function addMistake(mistakes, q) {
    var next = Object.assign({}, mistakes);
    next[q.key] = (next[q.key] || 0) + 1;
    return next;
  }


  // ---------- Rule shown after a wrong answer ----------

  var GENDER_UK = { m: "чоловічий", f: "жіночий", n: "середній", v: "чоловіки або змішана група", nv: "жінки, діти, речі" };
  var GENDER_EN = { m: "masculine", f: "feminine", n: "neuter", v: "men or a mixed group", nv: "women, children, things" };

  function dash(ending, lang) {
    return ending ? "-" + ending : (lang === "uk" ? "без закінчення" : "no ending");
  }

  // "ja", "on / ona / ono" as tappable Polish: "{on} / {ona} / {ono}".
  function braced(text) {
    return text.split(" / ").map(function (w) { return "{" + w + "}"; }).join(" / ");
  }

  function personPl(data, id) {
    var p = data.persons.filter(function (x) { return x.id === id; })[0];
    return p ? p.pl : id;
  }

  // The verb's own forms of one tense, split like the questions: [{person, gender, ending, slot, text}].
  function rows(data, verb, tenseId) {
    return data.cells(verb, tenseId).map(function (cell) {
      var s = split(cell, verb, tenseId);
      return { person: cell.person, gender: cell.gender, ending: s.ending, slot: s.slot, text: cell.form.text };
    });
  }

  function textOf(list, person, gender) {
    var r = list.filter(function (x) { return x.person === person && x.gender === gender; })[0];
    return r ? r.text : "";
  }

  // What the tense is made of, beyond the endings: [English, Ukrainian], or null.
  function tenseHint(data, q, list) {
    var v = q.verb;
    var t = q.tense.id;
    if (t === "present" || (t === "future" && q.group === "future")) {
      var g = data.groups.filter(function (x) { return x.id === v.group; })[0];
      var future = t === "future" && v.aspect === "pf" ? ["A perfective verb's future takes the present-tense endings. ",
        "Майбутній час доконаного виду має закінчення теперішнього. "] : ["", ""];
      if (!g || g.id === "irr" || g.example === v.inf) return future[0] ? [future[0].trim(), future[1].trim()] : null;
      return [future[0] + "Same endings as {" + g.example + "} (" + g.name + ").",
        future[1] + "Ті самі закінчення, що й у {" + g.example + "} (" + g.name + ")."];
    }
    if (t === "past") {
      return ["Past = past stem + ł, then the ending for the person. Only {oni} (men or a mixed group) has l: -li.",
        "Минулий час = основа + ł, далі закінчення особи. Лише {oni} (чоловіки або змішана група) має l: -li."];
    }
    if (t === "conditional") {
      var past = rows(data, v, "past");
      var ex = ["m", "f", "v"].map(function (gn) { return textOf(past, gn === "v" ? "3p" : "3s", gn); })
        .filter(Boolean).map(function (x) { return "{" + x + "}"; }).join(", ");
      return ["Conditional = the past form for he / she / they (" + ex + ") + by + the person ending.",
        "Умовний спосіб = форма минулого часу для він / вона / вони (" + ex + ") + by + закінчення особи."];
    }
    if (t === "future" && q.group === "future:aux") {
      return ["Imperfective future = {będę}, {będziesz}, {będzie}, {będziemy}, {będziecie}, {będą} + the infinitive {" + v.inf + "}.",
        "Майбутній час недоконаного виду = {będę}, {będziesz}, {będzie}, {będziemy}, {będziecie}, {będą} + інфінітив {" + v.inf + "}."];
    }
    if (t === "future") {
      return ["This future is {będę}, {będziesz}… + the past form for he / she / they: {" + textOf(list, "1s", "m") + "}, {" + textOf(list, "1s", "f") + "}.",
        "Цей майбутній час = {będę}, {będziesz}… + форма минулого для він / вона / вони: {" + textOf(list, "1s", "m") + "}, {" + textOf(list, "1s", "f") + "}."];
    }
    if (t === "imperative") {
      return ["Imperative: {ty} takes the bare stem, {my} adds -my, {wy} adds -cie.",
        "Наказовий спосіб: {ty} має саму основу, {my} додає -my, {wy} додає -cie."];
    }
    return null;
  }

  // The rule for a question, to show after a wrong answer: {en, uk}, with Polish in {braces} and
  // the right ending in **bold**. A gendered form lists the endings for every gender of that
  // person when they differ ("Past tense, oni / one: -li (men or a mixed group) · -ły (women,
  // children, things)"); any other form lists the endings of all persons ("ja -ę · ty -isz · ...").
  function rule(data, q) {
    var slot = q.group.split(":")[1] || "";
    var list = rows(data, q.verb, q.tense.id).filter(function (r) { return r.slot === slot; });
    var same = list.filter(function (r) { return r.person === q.person; });
    var en = q.tense.name + (/^(Present|Past|Future)$/.test(q.tense.name) ? " tense" : "");
    var uk = q.tense.uk.charAt(0).toUpperCase() + q.tense.uk.slice(1);
    var head, enBody, ukBody;
    var genders = same.length > 1 && same.some(function (r) { return r.ending !== same[0].ending; });
    function mark(r, text) {
      return r.person === q.person && (!genders || r.gender === q.gender) ? "**" + text + "**" : text;
    }
    if (genders) {
      head = braced(personPl(data, q.person));
      enBody = same.map(function (r) { return mark(r, dash(r.ending) + " (" + GENDER_EN[r.gender] + ")"); }).join(" · ");
      ukBody = same.map(function (r) { return mark(r, dash(r.ending, "uk") + " (" + GENDER_UK[r.gender] + ")"); }).join(" · ");
      en += ", " + head + ": " + enBody + ".";
      uk += ", " + head + ": " + ukBody + ".";
    } else {
      var seen = {};
      var all = list.filter(function (r) {
        if (seen[r.person]) return false;
        seen[r.person] = true;
        return true;
      });
      var pron = function (r) {
        return braced(r.person === q.person && q.pronoun ? q.pronoun : personPl(data, r.person));
      };
      if (slot === "aux") {
        en += " with {będę}";
        uk += " з {będę}";
      } else {
        en += " of {" + q.verb.inf + "}";
        uk += " {" + q.verb.inf + "}";
      }
      enBody = all.map(function (r) { return mark(r, pron(r) + " " + dash(r.ending)); }).join(" · ");
      ukBody = all.map(function (r) { return mark(r, pron(r) + " " + dash(r.ending, "uk")); }).join(" · ");
      en += ": " + enBody + ".";
      uk += ": " + ukBody + ".";
    }
    var hint = tenseHint(data, q, list);
    if (hint) {
      en += " " + hint[0];
      uk += " " + hint[1];
    }
    return { en: en, uk: uk };
  }

  // ---------- Who the form is for ----------

  // Number, gender and pronoun for the chips under the card's heading:
  // {num: [en, uk], gender: [en, uk] (or "same for every gender" when the form has none), pronoun}.
  var WHO_GENDER = {
    m: ["masculine (a man)", "чоловічий рід"],
    f: ["feminine (a woman)", "жіночий рід"],
    n: ["neuter (a child, a thing)", "середній рід"],
    v: ["men or a mixed group", "чоловіки або змішана група"],
    nv: ["women, children, things", "жінки, діти, речі"],
  };
  var ANY_GENDER = ["same form for every gender", "однаково для всіх родів"];
  function who(q) {
    var plural = q.person.charAt(1) === "p";
    var g = q.gender && q.gender !== "inf" ? WHO_GENDER[q.gender] : ANY_GENDER;
    return { num: plural ? ["plural", "множина"] : ["singular", "однина"], gender: g, pronoun: q.pronoun };
  }

  // A sentence that says who is talking or being talked about, before the form: [Polish, English].
  // Gendered forms get a man's or a woman's name to match; forms without a gender alternate.
  var CONTEXT = {
    "1s:m": ["Mówi Adam:", "Adam says:"],
    "1s:f": ["Mówi Ewa:", "Ewa says:"],
    "2s:m": ["Ewa mówi do Adama:", "Ewa says to Adam:"],
    "2s:f": ["Adam mówi do Ewy:", "Adam says to Ewa:"],
    "3s:m": ["Opowiadam o Adamie:", "I'm talking about Adam:"],
    "3s:f": ["Opowiadam o Ewie:", "I'm talking about Ewa:"],
    "3s:n": ["Opowiadam o dziecku:", "I'm talking about a child:"],
    "1p:v": ["Adam mówi o sobie i o Ewie:", "Adam talks about himself and Ewa:"],
    "1p:nv": ["Ewa mówi o sobie i o Oli:", "Ewa talks about herself and Ola:"],
    "2p:v": ["Ewa mówi do Adama i Piotra:", "Ewa says to Adam and Piotr:"],
    "2p:nv": ["Adam mówi do Ewy i Oli:", "Adam says to Ewa and Ola:"],
    "3p:v": ["Opowiadam o Adamie i Ewie:", "I'm talking about Adam and Ewa:"],
    "3p:nv": ["Opowiadam o Ewie i Oli:", "I'm talking about Ewa and Ola:"],
    "imperative:2s": ["Mama mówi do syna:", "Mum says to her son:"],
    "imperative:1p": ["Adam mówi do kolegów:", "Adam says to his mates:"],
    "imperative:2p": ["Nauczycielka mówi do dzieci:", "The teacher says to the children:"],
  };
  var NO_GENDER = { "1s": ["m", "f"], "2s": ["m", "f"], "3s": ["m", "f"], "1p": ["v", "nv"], "2p": ["v", "nv"], "3p": ["v", "nv"] };
  function context(q) {
    if (q.tense.id === "imperative") return CONTEXT["imperative:" + q.person] || null;
    var g = q.gender && q.gender !== "inf" ? q.gender : null;
    // A 3rd-person form without a gender is shown with "on" or "oni", so the sentence matches it.
    if (!g) g = { on: "m", ona: "f", ono: "n", oni: "v", one: "nv" }[q.pronoun] || null;
    if (!g) {
      var pair = NO_GENDER[q.person];
      if (!pair) return null;
      g = pair[(q.verb.inf.length + q.tense.id.length) % 2];
    }
    return CONTEXT[q.person + ":" + g] || null;
  }

  // ---------- Example sentence ----------

  // The form at work in a whole sentence, from ../verbs/verbs-examples.js: {before, after, pl, en,
  // uk, alt}. before + ending + after is the sentence ("Dziecko zrobi" + "łoby" + " to."), so a
  // card can leave the same gap in it; alt is the conditional with "by" moved forward. null when
  // the examples aren't loaded or the verb has none.
  function example(q) {
    var E = root.PolishVerbExamples ||
      (typeof require === "function" ? (function () { try { return require("../verbs/verbs-examples.js"); } catch (e) { return null; } })() : null);
    var e = E ? E.example(q.verb, q.tense.id, q.person, q.gender, q.text) : null;
    if (!e) return null;
    var start = e.pre ? e.pre + q.before : q.before.charAt(0).toUpperCase() + q.before.slice(1);
    return { before: start, after: q.after + e.post, pl: e.pl, en: e.en, uk: e.uk, alt: e.alt || "", named: !!e.pre };
  }

  var api = { OPTION_COUNT: OPTION_COUNT, shuffle: shuffle, pronoun: pronoun, split: split, questionKey: questionKey,
    buildQuestions: buildQuestions, makeOptions: makeOptions, buildRound: buildRound, addMistake: addMistake,
    rule: rule, who: who, context: context, example: example };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PolishVerbsQuiz = api;
})(typeof window !== "undefined" ? window : globalThis);
