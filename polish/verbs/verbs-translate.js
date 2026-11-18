// English and Ukrainian for one exact verb form from verbs-data.js: "oni czytaliby" is
// "they would read" and "вони читали б", not just "to read". Used by the verb tenses quiz.
//
// window.PolishVerbsTranslate = {
//   en(verb, tenseId, person, gender) -> "they would read"
//   uk(verb, tenseId, person, gender) -> "вони читали б"
// }
// verb is an entry of POLISH_VERBS.verbs; person and gender are a cell's (gender null, a gender
// key, or "inf" for "będę robić"). The third person without a gender uses the pronoun the quiz
// says, "on" / "oni", so the English is "he" / "they".
(function () {
  // ---------- English ----------
  //   "base s3 past ing": read reads read reading. stative verbs never take -ing (I knew, not
  //   I was knowing). tail goes after the verb: "go (on foot)".
  //   Imperfective verbs say the past and future as an ongoing action (was reading, will be
  //   reading); perfective ones as a single finished one (read, will read).
  var EN = {
    "miec": { w: "have has had having", stative: true },
    "robic": { w: "do does did doing" },
    "zrobic": { w: "do does did doing" },
    "czytac": { w: "read reads read reading" },
    "przeczytac": { w: "read reads read reading" },
    "pisac": { w: "write writes wrote writing" },
    "napisac": { w: "write writes wrote writing" },
    "mowic": { w: "speak speaks spoke speaking" },
    "powiedziec": { w: "say says said saying" },
    "isc": { w: "go goes went going", tail: " (on foot)" },
    "pojsc": { w: "go goes went going", tail: " (on foot)" },
    "jechac": { w: "go goes went going", tail: " (by vehicle)" },
    "pojechac": { w: "go goes went going", tail: " (by vehicle)" },
    "jesc": { w: "eat eats ate eating" },
    "zjesc": { w: "eat eats ate eating", tail: " (up)" },
    "pic": { w: "drink drinks drank drinking" },
    "wypic": { w: "drink drinks drank drinking", tail: " (up)" },
    "kupowac": { w: "buy buys bought buying" },
    "kupic": { w: "buy buys bought buying" },
    "widziec": { w: "see sees saw seeing", stative: true },
    "zobaczyc": { w: "see sees saw seeing" },
    "brac": { w: "take takes took taking" },
    "wziac": { w: "take takes took taking" },
    "dawac": { w: "give gives gave giving" },
    "dac": { w: "give gives gave giving" },
    "pytac": { w: "ask asks asked asking" },
    "zapytac": { w: "ask asks asked asking" },
    "uczyc-sie": { w: "learn learns learned learning" },
    "nauczyc-sie": { w: "learn learns learned learning" },
    "pracowac": { w: "work works worked working" },
    "mieszkac": { w: "live lives lived living" },
    "czekac": { w: "wait waits waited waiting" },
    "poczekac": { w: "wait waits waited waiting" },
    "lubic": { w: "like likes liked liking", stative: true },
    "chciec": { w: "want wants wanted wanting", stative: true },
    "wiedziec": { w: "know knows knew knowing", stative: true },
    "szukac": { w: "search searches searched searching" },
    "poszukac": { w: "search searches searched searching" },
  };

  var EN_PRONOUN = { "1s": "I", "2s": "you", "3s": "he", "1p": "we", "2p": "you all", "3p": "they" };
  var EN_THIRD = { m: "he", f: "she", n: "it", v: "they", nv: "they" };
  var BE_NOW = { "1s": "am", "3s": "is" };   // everyone else: are
  var BE_PAST = { "1s": "was", "3s": "was" }; // everyone else: were

  function enWho(person, gender) {
    return person === "3s" && EN_THIRD[gender] ? EN_THIRD[gender] : EN_PRONOUN[person];
  }

  function enWords(e) {
    var parts = e.w.split(" ");
    return { base: parts[0], s3: parts[1], past: parts[2], ing: parts[3] };
  }

  // być and móc have their own English.
  var EN_SPECIAL = {
    byc: {
      present: function (p) { return BE_NOW[p] || "are"; },
      past: function (p) { return BE_PAST[p] || "were"; },
      future: function () { return "will be"; },
      conditional: function () { return "would be"; },
      imperative: function () { return "be"; },
    },
    moc: {
      present: function () { return "can"; },
      past: function (p) { return (BE_PAST[p] || "were") + " able to"; },
      future: function () { return "will be able to"; },
      conditional: function () { return "could"; },
    },
  };

  function en(verb, tenseId, person, gender) {
    var special = EN_SPECIAL[verb.id];
    if (tenseId === "imperative") {
      var base = special ? special.imperative() : enWords(EN[verb.id]).base + (EN[verb.id].tail || "");
      if (person === "1p") return "let's " + base + "!";
      return base + "!" + (person === "2p" ? " (to you all)" : "");
    }
    var who = enWho(person, gender);
    if (special) return who + " " + special[tenseId](person);
    var e = EN[verb.id];
    if (!e) return "";
    var w = enWords(e);
    var tail = e.tail || "";
    var ongoing = verb.aspect === "impf" && !e.stative;
    var said;
    if (tenseId === "present") said = person === "3s" ? w.s3 : w.base;
    else if (tenseId === "past") said = ongoing ? (BE_PAST[person] || "were") + " " + w.ing : w.past;
    else if (tenseId === "future") said = ongoing ? "will be " + w.ing : "will " + w.base;
    else if (tenseId === "conditional") said = "would " + w.base;
    else return "";
    return who + " " + said + tail;
  }

  // ---------- Ukrainian ----------
  //   inf, then the six present forms (the future for perfective verbs) ja ty on my wy oni,
  //   then the past masculine and the stem the other genders add а / о / и to, then the
  //   imperative for ty (null when the Polish verb has none in use). "-ає" stands for the
  //   usual читаю читаєш читає читаємо читаєте читають. se adds -ся to every form.
  var UK = {
    "byc": ["бути", "є є є є є є", "був бул", "будь"],
    "miec": ["мати", "-ма", "мав мал", "май"],
    "robic": ["робити", "роблю робиш робить робимо робите роблять", "робив робил", "роби"],
    "zrobic": ["зробити", "зроблю зробиш зробить зробимо зробите зроблять", "зробив зробил", "зроби"],
    "czytac": ["читати", "-чита", "читав читал", "читай"],
    "przeczytac": ["прочитати", "-прочита", "прочитав прочитал", "прочитай"],
    "pisac": ["писати", "пишу пишеш пише пишемо пишете пишуть", "писав писал", "пиши"],
    "napisac": ["написати", "напишу напишеш напише напишемо напишете напишуть", "написав написал", "напиши"],
    "mowic": ["говорити", "говорю говориш говорить говоримо говорите говорять", "говорив говорил", "говори"],
    "powiedziec": ["сказати", "скажу скажеш скаже скажемо скажете скажуть", "сказав сказал", "скажи"],
    "isc": ["іти", "іду ідеш іде ідемо ідете ідуть", "йшов йшл", "іди"],
    "pojsc": ["піти", "піду підеш піде підемо підете підуть", "пішов пішл", "іди"],
    "jechac": ["їхати", "їду їдеш їде їдемо їдете їдуть", "їхав їхал", "їдь"],
    "pojechac": ["поїхати", "поїду поїдеш поїде поїдемо поїдете поїдуть", "поїхав поїхал", "їдь"],
    "jesc": ["їсти", "їм їси їсть їмо їсте їдять", "їв їл", "їж"],
    "zjesc": ["з'їсти", "з'їм з'їси з'їсть з'їмо з'їсте з'їдять", "з'їв з'їл", "з'їж"],
    "pic": ["пити", "п'ю п'єш п'є п'ємо п'єте п'ють", "пив пил", "пий"],
    "wypic": ["випити", "вип'ю вип'єш вип'є вип'ємо вип'єте вип'ють", "випив випил", "випий"],
    "kupowac": ["купувати", "купую купуєш купує купуємо купуєте купують", "купував купувал", "купуй"],
    "kupic": ["купити", "куплю купиш купить купимо купите куплять", "купив купил", "купи"],
    "widziec": ["бачити", "бачу бачиш бачить бачимо бачите бачать", "бачив бачил", null],
    "zobaczyc": ["побачити", "побачу побачиш побачить побачимо побачите побачать", "побачив побачил", "побач"],
    "brac": ["брати", "беру береш бере беремо берете беруть", "брав брал", "бери"],
    "wziac": ["взяти", "візьму візьмеш візьме візьмемо візьмете візьмуть", "взяв взял", "візьми"],
    "dawac": ["давати", "даю даєш дає даємо даєте дають", "давав давал", "давай"],
    "dac": ["дати", "дам даси дасть дамо дасте дадуть", "дав дал", "дай"],
    "pytac": ["питати", "-пита", "питав питал", "питай"],
    "zapytac": ["запитати", "-запита", "запитав запитал", "запитай"],
    "uczyc-sie": ["вчити", "вчу вчиш вчить вчимо вчите вчать", "вчив вчил", "вчи"],
    "nauczyc-sie": ["навчити", "навчу навчиш навчить навчимо навчите навчать", "навчив навчил", "навчи"],
    "pracowac": ["працювати", "працюю працюєш працює працюємо працюєте працюють", "працював працювал", "працюй"],
    "mieszkac": ["мешкати", "-мешка", "мешкав мешкал", "мешкай"],
    "czekac": ["чекати", "-чека", "чекав чекал", "чекай"],
    "poczekac": ["почекати", "-почека", "почекав почекал", "почекай"],
    "lubic": ["любити", "люблю любиш любить любимо любите люблять", "любив любил", null],
    "chciec": ["хотіти", "хочу хочеш хоче хочемо хочете хочуть", "хотів хотіл", null],
    "moc": ["могти", "можу можеш може можемо можете можуть", "міг могл", null],
    "wiedziec": ["знати", "-зна", "знав знал", null],
    "szukac": ["шукати", "-шука", "шукав шукал", "шукай"],
    "poszukac": ["пошукати", "-пошука", "пошукав пошукал", "пошукай"],
  };

  var P = ["1s", "2s", "3s", "1p", "2p", "3p"];
  var UK_PRONOUN = { "1s": "я", "2s": "ти", "3s": "він", "1p": "ми", "2p": "ви", "3p": "вони" };
  var UK_THIRD = { m: "він", f: "вона", n: "воно", v: "вони", nv: "вони" };
  var BUDU = ["буду", "будеш", "буде", "будемо", "будете", "будуть"];
  var AYE = ["ю", "єш", "є", "ємо", "єте", "ють"];

  function ukSix(spec) {
    if (spec.charAt(0) === "-") return AYE.map(function (e) { return spec.slice(1) + e; });
    return spec.split(" ");
  }

  // Past form for a person and gender: я читав / я читала, ми читали.
  function ukPast(row, person, gender) {
    var parts = row[2].split(" ");
    if (person.charAt(1) === "p") return parts[1] + "и";
    if (gender === "f") return parts[1] + "а";
    if (gender === "n") return parts[1] + "о";
    return parts[0];
  }

  // роби → робімо, робіть; читай → читаймо, читайте; їдь → їдьмо, їдьте.
  function ukImperative(base, person) {
    if (person === "2s") return base;
    if (/и$/.test(base)) return base.slice(0, -1) + (person === "1p" ? "імо" : "іть");
    return base + (person === "1p" ? "мо" : "те");
  }

  // -ся after every form: вчу → вчуся, вчив → вчився, вчіть → вчіться.
  function se(word, verb) {
    return verb.se ? word + "ся" : word;
  }

  function uk(verb, tenseId, person, gender) {
    var row = UK[verb.id];
    if (!row) return "";
    var i = P.indexOf(person);
    if (tenseId === "imperative") return row[3] ? se(ukImperative(row[3], person), verb) + "!" : "";
    var who = person === "3s" && UK_THIRD[gender] ? UK_THIRD[gender] : UK_PRONOUN[person];
    var said;
    if (tenseId === "present") said = se(ukSix(row[1])[i], verb);
    else if (tenseId === "past") said = se(ukPast(row, person, gender), verb);
    else if (tenseId === "future") {
      // perfective: прочитаю; być: буду; imperfective: буду читати.
      if (verb.id === "byc") said = BUDU[i];
      else if (verb.aspect === "pf") said = se(ukSix(row[1])[i], verb);
      else said = BUDU[i] + " " + se(row[0], verb);
    } else if (tenseId === "conditional") {
      var past = se(ukPast(row, person, gender), verb);
      said = past + (/[аеєиіїоуюя]$/.test(past) ? " б" : " би");
    } else return "";
    return who + " " + said;
  }

  var api = { en: en, uk: uk };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else window.PolishVerbsTranslate = api;
})();
