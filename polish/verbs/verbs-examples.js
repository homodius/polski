// A whole example sentence for one exact verb form, so a quiz card shows the form at work
// ("Dziecko zrobiłoby to." / "The child would do it.") and not just "ono zrobiłoby".
//
// window.PolishVerbExamples = {
//   example(verb, tenseId, person, gender, formText) -> {
//     pre, post   Polish around the form: pre + formText + post is the sentence. pre is "" when
//                 the sentence starts with the form, which the caller then capitalises.
//     pl          the whole Polish sentence
//     en, uk      its English and Ukrainian
//     alt         conditional only: the same sentence with "by" moved forward ("Dziecko by to zrobiło.")
//   }
// }
// verb is an entry of POLISH_VERBS.verbs; person and gender are a cell's (gender null, a gender
// key, or "inf" for "będę robić"). The 1st and 2nd person drop the pronoun, as Polish does;
// the 3rd person names someone: Adam, Ewa, dziecko, Adam i Ewa, Ewa i Ola.
// English and Ukrainian come from verbs-translate.js (PolishVerbsTranslate) with the same
// object added, so a new verb needs a line in EX below as well as there.
(function () {
  var T = typeof window !== "undefined" && window.PolishVerbsTranslate
    ? window.PolishVerbsTranslate
    : (typeof require === "function" ? require("./verbs-translate.js") : null);

  // What follows the verb, in Polish, English and Ukrainian, then options:
  //   pre:   the words go before the verb when someone is named ("Adam to zrobi", "Ewa o tym wie")
  //   imp:   different words for the imperative ("Miej cierpliwość!")
  //   enFix: [[pattern, replacement]] to make the English natural ("say the truth" -> "tell")
  //   ukSe:  false when the Ukrainian is said without -ся ("вчу польську")
  //   nowIng: the present said as happening now ("idę do domu": "I am going home")
  //   ukFuture: six Ukrainian future forms to use instead of "буду ..." ("зможу", not "буду могти")
  var EX = {
    byc: ["w domu", "at home", "вдома", { imp: ["w domu o szóstej", "at home at six", "вдома о шостій"] }],
    miec: ["czas", "time", "час", { imp: ["cierpliwość", "patience", "терпіння"] }],
    robic: ["zakupy", "the shopping", "покупки"],
    zrobic: ["to", "it", "це", { pre: true }],
    czytac: ["książkę", "a book", "книжку"],
    przeczytac: ["ten list", "this letter", "цей лист"],
    pisac: ["list", "a letter", "листа"],
    napisac: ["e-mail do szefa", "an email to the boss", "листа шефові"],
    mowic: ["po polsku", "Polish", "польською"],
    powiedziec: ["prawdę", "the truth", "правду", { enFix: [["\\bsay\\b", "tell"], ["\\bsays\\b", "tells"], ["\\bsaid\\b", "told"]] }],
    isc: ["do domu", "home", "додому", { nowIng: "going" }],
    pojsc: ["do kina", "to the cinema", "в кіно"],
    jechac: ["do Krakowa", "to Kraków", "до Кракова", { nowIng: "going" }],
    pojechac: ["nad morze", "to the seaside", "на море"],
    jesc: ["śniadanie", "breakfast", "сніданок"],
    zjesc: ["całą pizzę", "the whole pizza", "всю піцу"],
    pic: ["kawę", "coffee", "каву"],
    wypic: ["herbatę", "the tea", "чай"],
    kupowac: ["chleb", "bread", "хліб"],
    kupic: ["bilet", "a ticket", "квиток"],
    widziec: ["góry", "the mountains", "гори"],
    zobaczyc: ["ten film", "this film", "цей фільм"],
    brac: ["parasol", "an umbrella", "парасольку"],
    wziac: ["klucze", "the keys", "ключі"],
    dawac: ["mamie kwiaty", "Mum flowers", "мамі квіти"],
    dac: ["Oli prezent", "Ola a present", "Олі подарунок"],
    pytac: ["o drogę", "for directions", "дорогу"],
    zapytac: ["nauczyciela", "the teacher", "вчителя"],
    "uczyc-sie": ["polskiego", "Polish", "польську", { ukSe: false }],
    "nauczyc-sie": ["pływać", "to swim", "плавати"],
    pracowac: ["w biurze", "in an office", "в офісі", { imp: ["dziś w domu", "from home today", "сьогодні вдома"] }],
    mieszkac: ["blisko pracy", "near work", "близько від роботи"],
    czekac: ["na autobus", "for the bus", "на автобус"],
    poczekac: ["chwilę", "a moment", "хвилинку"],
    lubic: ["kawę", "coffee", "каву"],
    chciec: ["odpocząć", "to rest", "відпочити", { enFix: [["\\bwould want\\b", "would like"]] }],
    moc: ["przyjść", "come", "прийти", { ukFuture: "зможу зможеш зможе зможемо зможете зможуть" }],
    wiedziec: ["o tym", "about it", "про це", { pre: true }],
    szukac: ["pracy", "a job", "роботу", { enFix: [["\\bsearches\\b", "looks for"], ["\\bsearched\\b", "looked for"], ["\\bsearching\\b", "looking for"], ["\\bsearch\\b", "look for"]] }],
    poszukac: ["kluczy", "the keys", "ключі", { enFix: [["\\bsearches\\b", "looks for"], ["\\bsearched\\b", "looked for"], ["\\bsearching\\b", "looking for"], ["\\bsearch\\b", "look for"]] }],
  };

  // Who is named in the 3rd person, by gender: [Polish, English, Ukrainian]. Ukrainian
  // "дитина" is feminine, so the neuter takes the feminine verb there (дитина зробила б).
  var NAMED = {
    m: ["Adam", "Adam", "Адам"],
    f: ["Ewa", "Ewa", "Ева"],
    n: ["Dziecko", "The child", "Дитина"],
    v: ["Adam i Ewa", "Adam and Ewa", "Адам і Ева"],
    nv: ["Ewa i Ola", "Ewa and Ola", "Ева й Оля"],
  };
  var BY_END = { "1s": "bym", "2s": "byś", "3s": "by", "1p": "byśmy", "2p": "byście", "3p": "by" };
  var PERSONS = ["1s", "2s", "3s", "1p", "2p", "3p"];
  var HOST = { "1s": "Ja", "2s": "Ty", "1p": "My", "2p": "Wy" };

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // The gender a form stands for: its own, or for a 3rd person form without one, the one the
  // quiz says (on, oni). null for the 1st and 2nd person without a gender.
  function genderOf(person, gender) {
    if (gender && gender !== "inf") return gender;
    if (person === "3s") return "m";
    if (person === "3p") return "v";
    return null;
  }

  function english(verb, tenseId, person, g, words, opts) {
    var s = T ? T.en(verb, tenseId, person, g) : "";
    if (!s) return "";
    var toAll = / \(to you all\)$/.test(s);
    s = s.replace(/ \(to you all\)$/, "");
    var bang = /!$/.test(s);
    s = s.replace(/!$/, "").replace(/ \([^)]*\)$/, ""); // "go (on foot)": the verb line says that
    if (opts.nowIng && tenseId === "present") {
      s = s.replace(/ \S+$/, " " + ({ "1s": "am", "3s": "is" }[person] || "are") + " " + opts.nowIng);
    }
    (opts.enFix || []).forEach(function (f) { s = s.replace(new RegExp(f[0]), f[1]); });
    if (person.charAt(0) === "3" && g && NAMED[g]) s = s.replace(/^(he|she|it|they)\b/, NAMED[g][1]);
    return cap(s + " " + words) + (bang ? "!" : ".") + (toAll ? " (to you all)" : "");
  }

  function ukrainian(verb, tenseId, person, g, words, opts) {
    var v = opts.ukSe === false ? Object.assign({}, verb, { se: false }) : verb;
    var s = T ? T.uk(v, tenseId, person, g === "n" ? "f" : g) : "";
    if (!s) return "";
    if (verb.id === "byc" && tenseId === "present") s = s.replace(/ є$/, ""); // я вдома, not я є вдома
    if (opts.ukFuture && tenseId === "future") s = s.replace(/ .*$/, " " + opts.ukFuture.split(" ")[PERSONS.indexOf(person)]);
    var bang = /!$/.test(s);
    s = s.replace(/!$/, "");
    if (person.charAt(0) === "3" && g && NAMED[g]) s = s.replace(/^(він|вона|воно|вони)/, NAMED[g][2]);
    return cap(s + " " + words) + (bang ? "!" : ".");
  }

  function example(verb, tenseId, person, gender, formText) {
    var row = EX[verb.id];
    if (!row) return null;
    var opts = row[3] || {};
    var words = tenseId === "imperative" && opts.imp ? opts.imp : row;
    var g = genderOf(person, gender);
    var named = tenseId !== "imperative" && person.charAt(0) === "3" && g ? NAMED[g] : null;
    var punct = tenseId === "imperative" ? "!" : ".";
    var pre = "";
    var post = " " + words[0];
    if (named) {
      pre = named[0] + " ";
      // "Adam to zrobi", but "Adam zrobiłby to" (by already sits on the verb) and
      // "Ewa będzie wiedziała o tym" (będzie comes first).
      if (opts.pre && tenseId !== "conditional" && !/^będ\S* /.test(formText)) {
        pre += words[0] + " ";
        post = "";
      }
    }
    var out = {
      pre: pre,
      post: post + punct,
      pl: (pre ? pre + formText : cap(formText)) + post + punct,
      en: english(verb, tenseId, person, g, words[1], opts),
      uk: ukrainian(verb, tenseId, person, g, words[2], opts),
    };
    // "Dziecko zrobiłoby to" is also said "Dziecko by to zrobiło": by (with the person ending)
    // moves forward after the first word, and the verb is left as the plain past form.
    if (tenseId === "conditional" && g && verb.forms && verb.forms.past) {
      var plural = person.charAt(1) === "p";
      var l = (verb.forms.past[plural ? "3p" : "3s"] || {})[g];
      var host = named ? named[0] : HOST[person];
      if (l && host) {
        out.alt = host + " " + BY_END[person] + (verb.se ? " się" : "") + (opts.pre ? " " + words[0] : "") +
          " " + l.stem + l.end + (opts.pre ? "" : " " + words[0]) + ".";
      }
    }
    return out;
  }

  var api = { example: example, EX: EX };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.PolishVerbExamples = api;
})();
