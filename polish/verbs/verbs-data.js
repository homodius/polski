// Polish verbs for the Verb tenses page (and its quiz): every form split into the part that
// stays (stem) and the part that changes (ending), so a page can show or ask for the ending alone.
//
// window.POLISH_VERBS = {
//   persons: [{ id: "1s", pl: "ja", en: "I", uk: "я" }, ...]     ids 1s 2s 3s 1p 2p 3p
//   genders: { m, f, n, v, nv }                                    labels for the gender keys
//   groups:  [{ id, name, endings, example, note }]               present-tense patterns
//   tenses:  [{ id, name, pl, uk }]                               present past future conditional imperative
//   verbs:   [{
//     id, inf, en, uk, aspect: "impf" | "pf", pair: <id of the other aspect>, group, se: true for "się" verbs,
//     forms: {
//       present:     { "1s": Form, ... }             imperfective verbs only
//       past:        { "1s": { m, f }, "2s": { m, f }, "3s": { m, f, n }, "1p": { v, nv }, "2p": { v, nv }, "3p": { v, nv } }
//       future:      perfective (and być): { "1s": Form, ... }
//                    imperfective: { "1s": { inf, m, f }, "3s": { inf, m, f, n }, "1p": { inf, v, nv }, ... }
//       conditional: same shape as past
//       imperative:  { "2s": Form, "1p": Form, "2p": Form }   missing when the verb has none in use
//     }
//   }]
//   cells(verb, tense) -> [{ person, gender, form }]   every form of one tense as a flat list
// }
//
// Form = { stem, end, text } where stem + end is the changing word and text is the whole thing to
// say, "się" included. A compound future also has aux: the form of "być" (będę, będziesz...),
// itself split into stem and end, and text "będę robił".
// Gender keys: m masculine, f feminine, n neuter, v virile plural (men or a mixed group),
// nv non-virile plural (women, children, things).
(function () {
  var P = ["1s", "2s", "3s", "1p", "2p", "3p"];

  var persons = [
    { id: "1s", pl: "ja", en: "I", uk: "я" },
    { id: "2s", pl: "ty", en: "you", uk: "ти" },
    { id: "3s", pl: "on / ona / ono", en: "he / she / it", uk: "він / вона / воно" },
    { id: "1p", pl: "my", en: "we", uk: "ми" },
    { id: "2p", pl: "wy", en: "you (all)", uk: "ви" },
    { id: "3p", pl: "oni / one", en: "they", uk: "вони" },
  ];

  var genders = {
    m: { pl: "on", en: "masculine", uk: "чоловічий" },
    f: { pl: "ona", en: "feminine", uk: "жіночий" },
    n: { pl: "ono", en: "neuter", uk: "середній" },
    v: { pl: "oni", en: "men or mixed group", uk: "чоловіки або змішана група" },
    nv: { pl: "one", en: "women, children, things", uk: "жінки, діти, речі" },
  };

  // Present-tense endings for ja ty on my wy oni.
  var ENDINGS = {
    m: ["m", "sz", "", "my", "cie", "ją"],
    e: ["ę", "esz", "e", "emy", "ecie", "ą"],
    i: ["ę", "isz", "i", "imy", "icie", "ą"],
    ii: ["ię", "isz", "i", "imy", "icie", "ią"],
    y: ["ę", "ysz", "y", "ymy", "ycie", "ą"],
  };

  var groups = [
    { id: "m", name: "-m, -sz", endings: ENDINGS.m, example: "czytać",
      note: "Most verbs in -ać: czytać, mieszkać, czekać, pytać. Also mieć: mam, masz, mają." },
    { id: "i", name: "-ę, -isz / -ysz", endings: ENDINGS.i, example: "robić",
      note: "Most verbs in -ić, -yć and many in -eć: robić, mówić, lubić, uczyć, widzieć. " +
        "After cz, sz, rz, ż the i turns into y: uczysz, patrzysz." },
    { id: "e", name: "-ę, -esz", endings: ENDINGS.e, example: "pisać",
      note: "Verbs in -ować (pracować: pracuję), -awać (dawać: daję), and many short or irregular " +
        "verbs: pisać (piszę), pić (piję), iść (idę), móc (mogę), brać (biorę)." },
    { id: "irr", name: "irregular", endings: ENDINGS.m, example: "być",
      note: "być, jeść, wiedzieć, dać and their compounds: jem, wiem, dam, but jedzą, wiedzą, dadzą." },
  ];

  var tenses = [
    { id: "present", name: "Present", pl: "czas teraźniejszy", uk: "теперішній час" },
    { id: "past", name: "Past", pl: "czas przeszły", uk: "минулий час" },
    { id: "future", name: "Future", pl: "czas przyszły", uk: "майбутній час" },
    { id: "conditional", name: "Conditional", pl: "tryb przypuszczający", uk: "умовний спосіб" },
    { id: "imperative", name: "Imperative", pl: "tryb rozkazujący", uk: "наказовий спосіб" },
  ];

  // One verb per line of definitions:
  //   pres: [stem or 6 stems, endings key or 6 endings]  present (imperfective) or future (perfective)
  //   past: { m, f, v, m3 }  the past stem before ł / l. f is also used for neuter and non-virile
  //         plural; m and v default to f; m3 is the 3rd person masculine when it differs (mógł).
  //   imp:  imperative stem (rób → rób, róbmy, róbcie), or [2s, 1p, 2p] in full, or null for none
  var DEFS = [
    { id: "byc", inf: "być", en: "to be", uk: "бути", aspect: "impf", group: "irr",
      pres: [["jest", "jest", "jest", "jest", "jest", "s"], ["em", "eś", "", "eśmy", "eście", "ą"]],
      past: { f: "by" }, imp: "bądź",
      fut: [["będ", "będzi", "będzi", "będzi", "będzi", "będ"], "e"] },
    { id: "miec", inf: "mieć", en: "to have", uk: "мати", aspect: "impf", group: "m",
      pres: ["ma", "m"], past: { f: "mia", v: "mie" }, imp: "miej" },
    { id: "robic", inf: "robić", en: "to do, to make", uk: "робити", aspect: "impf", pair: "zrobic", group: "i",
      pres: ["rob", "ii"], past: { f: "robi" }, imp: "rób" },
    { id: "zrobic", inf: "zrobić", en: "to do, to make (and finish)", uk: "зробити", aspect: "pf", pair: "robic", group: "i",
      pres: ["zrob", "ii"], past: { f: "zrobi" }, imp: "zrób" },
    { id: "czytac", inf: "czytać", en: "to read", uk: "читати", aspect: "impf", pair: "przeczytac", group: "m",
      pres: ["czyta", "m"], past: { f: "czyta" }, imp: "czytaj" },
    { id: "przeczytac", inf: "przeczytać", en: "to read (through)", uk: "прочитати", aspect: "pf", pair: "czytac", group: "m",
      pres: ["przeczyta", "m"], past: { f: "przeczyta" }, imp: "przeczytaj" },
    { id: "pisac", inf: "pisać", en: "to write", uk: "писати", aspect: "impf", pair: "napisac", group: "e",
      pres: ["pisz", "e"], past: { f: "pisa" }, imp: "pisz" },
    { id: "napisac", inf: "napisać", en: "to write (and finish)", uk: "написати", aspect: "pf", pair: "pisac", group: "e",
      pres: ["napisz", "e"], past: { f: "napisa" }, imp: "napisz" },
    { id: "mowic", inf: "mówić", en: "to speak, to say", uk: "говорити, казати", aspect: "impf", pair: "powiedziec", group: "i",
      pres: ["mów", "ii"], past: { f: "mówi" }, imp: "mów" },
    { id: "powiedziec", inf: "powiedzieć", en: "to say, to tell", uk: "сказати", aspect: "pf", pair: "mowic", group: "irr",
      pres: [["powie", "powie", "powie", "powie", "powie", "powiedz"], ENDINGS.m.slice(0, 5).concat("ą")],
      past: { f: "powiedzia", v: "powiedzie" }, imp: "powiedz" },
    { id: "isc", inf: "iść", en: "to go (on foot)", uk: "іти", aspect: "impf", pair: "pojsc", group: "e",
      pres: [["id", "idzi", "idzi", "idzi", "idzi", "id"], "e"], past: { m: "szed", f: "sz" }, imp: "idź" },
    { id: "pojsc", inf: "pójść", en: "to go (set off on foot)", uk: "піти", aspect: "pf", pair: "isc", group: "e",
      pres: [["pójd", "pójdzi", "pójdzi", "pójdzi", "pójdzi", "pójd"], "e"], past: { m: "poszed", f: "posz" }, imp: "idź" },
    { id: "jechac", inf: "jechać", en: "to go (by vehicle), to ride", uk: "їхати", aspect: "impf", pair: "pojechac", group: "e",
      pres: [["jad", "jedzi", "jedzi", "jedzi", "jedzi", "jad"], "e"], past: { f: "jecha" }, imp: "jedź" },
    { id: "pojechac", inf: "pojechać", en: "to go (set off by vehicle)", uk: "поїхати", aspect: "pf", pair: "jechac", group: "e",
      pres: [["pojad", "pojedzi", "pojedzi", "pojedzi", "pojedzi", "pojad"], "e"], past: { f: "pojecha" }, imp: "jedź" },
    { id: "jesc", inf: "jeść", en: "to eat", uk: "їсти", aspect: "impf", pair: "zjesc", group: "irr",
      pres: [["je", "je", "je", "je", "je", "jedz"], ENDINGS.m.slice(0, 5).concat("ą")], past: { f: "jad", v: "jed" }, imp: "jedz" },
    { id: "zjesc", inf: "zjeść", en: "to eat (up)", uk: "з'їсти", aspect: "pf", pair: "jesc", group: "irr",
      pres: [["zje", "zje", "zje", "zje", "zje", "zjedz"], ENDINGS.m.slice(0, 5).concat("ą")], past: { f: "zjad", v: "zjed" }, imp: "zjedz" },
    { id: "pic", inf: "pić", en: "to drink", uk: "пити", aspect: "impf", pair: "wypic", group: "e",
      pres: ["pij", "e"], past: { f: "pi" }, imp: "pij" },
    { id: "wypic", inf: "wypić", en: "to drink (up)", uk: "випити", aspect: "pf", pair: "pic", group: "e",
      pres: ["wypij", "e"], past: { f: "wypi" }, imp: "wypij" },
    { id: "kupowac", inf: "kupować", en: "to buy (often, in general)", uk: "купувати", aspect: "impf", pair: "kupic", group: "e",
      pres: ["kupuj", "e"], past: { f: "kupowa" }, imp: "kupuj" },
    { id: "kupic", inf: "kupić", en: "to buy", uk: "купити", aspect: "pf", pair: "kupowac", group: "i",
      pres: ["kup", "ii"], past: { f: "kupi" }, imp: "kup" },
    { id: "widziec", inf: "widzieć", en: "to see", uk: "бачити", aspect: "impf", pair: "zobaczyc", group: "i",
      pres: [["widz", "widz", "widz", "widz", "widz", "widz"], "i"], past: { f: "widzia", v: "widzie" }, imp: null },
    { id: "zobaczyc", inf: "zobaczyć", en: "to see, to catch sight of", uk: "побачити", aspect: "pf", pair: "widziec", group: "i",
      pres: ["zobacz", "y"], past: { f: "zobaczy" }, imp: "zobacz" },
    { id: "brac", inf: "brać", en: "to take", uk: "брати", aspect: "impf", pair: "wziac", group: "e",
      pres: [["bior", "bierz", "bierz", "bierz", "bierz", "bior"], "e"], past: { f: "bra" }, imp: "bierz" },
    { id: "wziac", inf: "wziąć", en: "to take (once)", uk: "взяти", aspect: "pf", pair: "brac", group: "e",
      pres: [["wezm", "weźmi", "weźmi", "weźmi", "weźmi", "wezm"], "e"], past: { m: "wzią", f: "wzię" }, imp: "weź" },
    { id: "dawac", inf: "dawać", en: "to give (often)", uk: "давати", aspect: "impf", pair: "dac", group: "e",
      pres: ["daj", "e"], past: { f: "dawa" }, imp: "dawaj" },
    { id: "dac", inf: "dać", en: "to give", uk: "дати", aspect: "pf", pair: "dawac", group: "irr",
      pres: [["da", "da", "da", "da", "da", "dadz"], ENDINGS.m.slice(0, 5).concat("ą")], past: { f: "da" }, imp: "daj" },
    { id: "pytac", inf: "pytać", en: "to ask", uk: "питати", aspect: "impf", pair: "zapytac", group: "m",
      pres: ["pyta", "m"], past: { f: "pyta" }, imp: "pytaj" },
    { id: "zapytac", inf: "zapytać", en: "to ask (once)", uk: "запитати", aspect: "pf", pair: "pytac", group: "m",
      pres: ["zapyta", "m"], past: { f: "zapyta" }, imp: "zapytaj" },
    { id: "uczyc-sie", inf: "uczyć się", en: "to learn, to study", uk: "вчитися", aspect: "impf", pair: "nauczyc-sie", group: "i", se: true,
      pres: ["ucz", "y"], past: { f: "uczy" }, imp: "ucz" },
    { id: "nauczyc-sie", inf: "nauczyć się", en: "to learn (and know it)", uk: "навчитися", aspect: "pf", pair: "uczyc-sie", group: "i", se: true,
      pres: ["naucz", "y"], past: { f: "nauczy" }, imp: "naucz" },
    { id: "pracowac", inf: "pracować", en: "to work", uk: "працювати", aspect: "impf", group: "e",
      pres: ["pracuj", "e"], past: { f: "pracowa" }, imp: "pracuj" },
    { id: "mieszkac", inf: "mieszkać", en: "to live (somewhere)", uk: "жити, мешкати", aspect: "impf", group: "m",
      pres: ["mieszka", "m"], past: { f: "mieszka" }, imp: "mieszkaj" },
    { id: "czekac", inf: "czekać", en: "to wait", uk: "чекати", aspect: "impf", pair: "poczekac", group: "m",
      pres: ["czeka", "m"], past: { f: "czeka" }, imp: "czekaj" },
    { id: "poczekac", inf: "poczekać", en: "to wait (a while)", uk: "почекати", aspect: "pf", pair: "czekac", group: "m",
      pres: ["poczeka", "m"], past: { f: "poczeka" }, imp: "poczekaj" },
    { id: "lubic", inf: "lubić", en: "to like", uk: "любити, подобатися", aspect: "impf", group: "i",
      pres: ["lub", "ii"], past: { f: "lubi" }, imp: null },
    { id: "chciec", inf: "chcieć", en: "to want", uk: "хотіти", aspect: "impf", group: "e",
      pres: ["chc", "e"], past: { f: "chcia", v: "chcie" }, imp: null },
    { id: "moc", inf: "móc", en: "can, to be able to", uk: "могти", aspect: "impf", group: "e",
      pres: [["mog", "moż", "moż", "moż", "moż", "mog"], "e"], past: { f: "mog", m3: "móg" }, imp: null },
    { id: "wiedziec", inf: "wiedzieć", en: "to know (a fact)", uk: "знати", aspect: "impf", group: "irr",
      pres: [["wie", "wie", "wie", "wie", "wie", "wiedz"], ENDINGS.m.slice(0, 5).concat("ą")],
      past: { f: "wiedzia", v: "wiedzie" }, imp: null },
    { id: "szukac", inf: "szukać", en: "to look for, to search", uk: "шукати", aspect: "impf", pair: "poszukac", group: "m",
      pres: ["szuka", "m"], past: { f: "szuka" }, imp: "szukaj" },
    { id: "poszukac", inf: "poszukać", en: "to look for (a while)", uk: "пошукати", aspect: "pf", pair: "szukac", group: "m",
      pres: ["poszuka", "m"], past: { f: "poszuka" }, imp: "poszukaj" },
  ];

  var PAST_END = {
    "1s": { m: "łem", f: "łam" },
    "2s": { m: "łeś", f: "łaś" },
    "3s": { m: "ł", f: "ła", n: "ło" },
    "1p": { v: "liśmy", nv: "łyśmy" },
    "2p": { v: "liście", nv: "łyście" },
    "3p": { v: "li", nv: "ły" },
  };
  var COND_END = { "1s": "bym", "2s": "byś", "3s": "by", "1p": "byśmy", "2p": "byście", "3p": "by" };

  function form(stem, end, se, pre) {
    var word = stem + end;
    return { stem: stem, end: end, text: (pre || "") + word + (se ? " się" : "") };
  }

  // Six forms from a stem (or six stems) and an endings key (or six endings).
  function six(def, se) {
    var stems = def[0];
    var ends = typeof def[1] === "string" ? ENDINGS[def[1]] : def[1];
    var out = {};
    P.forEach(function (p, i) {
      out[p] = form(typeof stems === "string" ? stems : stems[i], ends[i], se);
    });
    return out;
  }

  function pastStem(past, p, g) {
    if (g === "m") return p === "3s" && past.m3 ? past.m3 : (past.m || past.f);
    if (g === "v") return past.v || past.f;
    return past.f;
  }

  function pastForms(def) {
    var out = {};
    P.forEach(function (p) {
      out[p] = {};
      Object.keys(PAST_END[p]).forEach(function (g) {
        out[p][g] = form(pastStem(def.past, p, g), PAST_END[p][g], def.se);
      });
    });
    return out;
  }

  // The l-form (robił, robiła, robili...) plus by and the person ending: robiłbym, robiłabym.
  function conditionalForms(past, se) {
    var out = {};
    P.forEach(function (p) {
      out[p] = {};
      var plural = p.charAt(1) === "p";
      Object.keys(past[p]).forEach(function (g) {
        var l = plural ? past["3p"][g] : past["3s"][g === "n" ? "n" : g];
        out[p][g] = form(l.stem + l.end, COND_END[p], se);
      });
    });
    return out;
  }

  // będę + infinitive, or będę + the past l-form (będę robił / robiła).
  function compoundFuture(def, past, bede) {
    var out = {};
    P.forEach(function (p) {
      var aux = { stem: bede[p].stem, end: bede[p].end };
      // Reflexive verbs put się straight after the auxiliary: będę się uczyć.
      var auxText = aux.stem + aux.end + (def.se ? " się " : " ");
      var bare = def.inf.replace(/ się$/, "");
      var cell = { inf: { aux: aux, stem: bare, end: "", text: auxText + bare } };
      var plural = p.charAt(1) === "p";
      Object.keys(PAST_END[p]).forEach(function (g) {
        var l = plural ? past["3p"][g] : past["3s"][g];
        var f = form(l.stem, l.end, false, auxText);
        f.aux = aux;
        cell[g] = f;
      });
      out[p] = cell;
    });
    return out;
  }

  function imperativeForms(def) {
    if (!def.imp) return null;
    var parts = typeof def.imp === "string" ? [[def.imp, ""], [def.imp, "my"], [def.imp, "cie"]] : def.imp;
    return { "2s": form(parts[0][0], parts[0][1], def.se), "1p": form(parts[1][0], parts[1][1], def.se),
      "2p": form(parts[2][0], parts[2][1], def.se) };
  }

  var bede = six(DEFS[0].fut);

  var verbs = DEFS.map(function (def) {
    var past = pastForms(def);
    var forms = { past: past, conditional: conditionalForms(past, def.se) };
    var nonPast = six(def.pres, def.se);
    if (def.fut) {
      forms.present = nonPast;
      forms.future = six(def.fut, def.se);
    } else if (def.aspect === "pf") {
      forms.future = nonPast;
    } else {
      forms.present = nonPast;
      forms.future = compoundFuture(def, past, bede);
    }
    var imp = imperativeForms(def);
    if (imp) forms.imperative = imp;
    var v = { id: def.id, inf: def.inf, en: def.en, uk: def.uk, aspect: def.aspect, group: def.group, forms: forms };
    if (def.pair) v.pair = def.pair;
    if (def.se) v.se = true;
    return v;
  });

  // Every form of one tense as a flat list, in table order.
  function cells(verb, tense) {
    var t = verb.forms[tense];
    if (!t) return [];
    var out = [];
    Object.keys(t).forEach(function (p) {
      var c = t[p];
      if (typeof c.stem === "string") out.push({ person: p, gender: null, form: c });
      else Object.keys(c).forEach(function (g) { out.push({ person: p, gender: g, form: c[g] }); });
    });
    return out;
  }

  var data = { persons: persons, genders: genders, groups: groups, tenses: tenses, endings: ENDINGS, verbs: verbs, cells: cells };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else window.POLISH_VERBS = data;
})();
