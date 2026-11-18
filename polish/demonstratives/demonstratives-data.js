// Polish demonstratives (zaimki wskazujące): ten / ta / to (this), tamten / tamta / tamto (that),
// ten sam (the same) and taki (such), declined through the six cases they use, with the
// Ukrainian forms next to them and quiz sentences. Used by the Learn page (demonstratives-page.js)
// and the quiz (demonstratives-quiz/).
//
// Shapes
//   CASES        ids in table order; every forms array follows it. No vocative: these words
//                have none (you would just use the nominative).
//   SLOTS        the five columns: m, f, n, plMen (men, or a group with a man), plOther.
//   words[]      { id, pl, en, uk, intro, forms: { <slot>: [6] }, ukForms: { <slot>: [6] }, tips[] }
//   endings[]    { form, ukForm, where, ukWhere }: the cheat sheet, one row per form of ten.
//   tricky[]     { en, uk }: the usual mistakes.
//   sentences[]  [wordId, slot, caseId, cue, en, uk, by]: quiz cards and the Learn page's examples.
//                slot is m (people and animals), mi (masculine things), f, n, plMen or plOther;
//                the two masculine slots differ only in the accusative. cue has "___" where the
//                word goes. by is the word that decides the case ("w", "nie znam"), or "" when the
//                word goes with the subject (nominative).
//
// Text conventions
//   "stem|ending"   each word of a form; several words are separated by spaces ("t|ego sam|ego"),
//                   a word without "|" is shown whole. "a / b" lists variants: the masculine
//                   accusative is "people and animals / things".
//   "{polski}"      inside English or Ukrainian prose marks Polish words, which become tappable.
(function () {
  var CASES = ["nom", "gen", "dat", "acc", "ins", "loc"];
  var SLOTS = ["m", "f", "n", "plMen", "plOther"];

  var words = [
    {
      id: "ten", pl: "ten", en: "this", uk: "цей",
      intro: "{ten} (masculine), {ta} (feminine), {to} (neuter), {ci} (men), {te} (everything else). The everyday word for this, and in speech often for that too: {ten dom} = цей / той дім.",
      forms: {
        m: ["t|en", "t|ego", "t|emu", "t|ego / t|en", "t|ym", "t|ym"],
        f: ["t|a", "t|ej", "t|ej", "t|ę", "t|ą", "t|ej"],
        n: ["t|o", "t|ego", "t|emu", "t|o", "t|ym", "t|ym"],
        plMen: ["c|i", "t|ych", "t|ym", "t|ych", "t|ymi", "t|ych"],
        plOther: ["t|e", "t|ych", "t|ym", "t|e", "t|ymi", "t|ych"],
      },
      ukForms: {
        m: ["цей", "цього", "цьому", "цього / цей", "цим", "цьому"],
        f: ["ця", "цієї", "цій", "цю", "цією", "цій"],
        n: ["це", "цього", "цьому", "це", "цим", "цьому"],
        plMen: ["ці", "цих", "цим", "цих", "цими", "цих"],
        plOther: ["ці", "цих", "цим", "ці", "цими", "цих"],
      },
    },
    {
      id: "tamten", pl: "tamten", en: "that (over there)", uk: "той",
      intro: "{tamten}, {tamta}, {tamto}, {tamci}, {tamte}: that one over there, the other one. Use it to contrast with {ten}: {nie ten, tylko tamten} = не цей, а той. It is just {tam} + {ten}, and the endings are the same.",
      forms: {
        m: ["tamt|en", "tamt|ego", "tamt|emu", "tamt|ego / tamt|en", "tamt|ym", "tamt|ym"],
        f: ["tamt|a", "tamt|ej", "tamt|ej", "tamt|ą", "tamt|ą", "tamt|ej"],
        n: ["tamt|o", "tamt|ego", "tamt|emu", "tamt|o", "tamt|ym", "tamt|ym"],
        plMen: ["tamc|i", "tamt|ych", "tamt|ym", "tamt|ych", "tamt|ymi", "tamt|ych"],
        plOther: ["tamt|e", "tamt|ych", "tamt|ym", "tamt|e", "tamt|ymi", "tamt|ych"],
      },
      ukForms: {
        m: ["той", "того", "тому", "того / той", "тим", "тому"],
        f: ["та", "тієї", "тій", "ту", "тією", "тій"],
        n: ["те", "того", "тому", "те", "тим", "тому"],
        plMen: ["ті", "тих", "тим", "тих", "тими", "тих"],
        plOther: ["ті", "тих", "тим", "ті", "тими", "тих"],
      },
    },
    {
      id: "ten-sam", pl: "ten sam", en: "the same", uk: "той самий",
      intro: "{ten sam}, {ta sama}, {to samo}, {ci sami}, {te same}: the same. Both words change: {ten} as above, {sam} like an adjective. {To samo} on its own means the same thing.",
      forms: {
        m: ["t|en sam", "t|ego sam|ego", "t|emu sam|emu", "t|ego sam|ego / t|en sam", "t|ym sam|ym", "t|ym sam|ym"],
        f: ["t|a sam|a", "t|ej sam|ej", "t|ej sam|ej", "t|ę sam|ą", "t|ą sam|ą", "t|ej sam|ej"],
        n: ["t|o sam|o", "t|ego sam|ego", "t|emu sam|emu", "t|o sam|o", "t|ym sam|ym", "t|ym sam|ym"],
        plMen: ["c|i sam|i", "t|ych sam|ych", "t|ym sam|ym", "t|ych sam|ych", "t|ymi sam|ymi", "t|ych sam|ych"],
        plOther: ["t|e sam|e", "t|ych sam|ych", "t|ym sam|ym", "t|e sam|e", "t|ymi sam|ymi", "t|ych sam|ych"],
      },
      ukForms: {
        m: ["той самий", "того самого", "тому самому", "того самого / той самий", "тим самим", "тому самому"],
        f: ["та сама", "тієї самої", "тій самій", "ту саму", "тією самою", "тій самій"],
        n: ["те саме", "того самого", "тому самому", "те саме", "тим самим", "тому самому"],
        plMen: ["ті самі", "тих самих", "тим самим", "тих самих", "тими самими", "тих самих"],
        plOther: ["ті самі", "тих самих", "тим самим", "ті самі", "тими самими", "тих самих"],
      },
    },
    {
      id: "taki", pl: "taki", en: "such, like this", uk: "такий",
      intro: "{taki}, {taka}, {takie}, {tacy}, {takie}: such, this kind of. It is an ordinary adjective, like {polski}: after k every y becomes i ({takiego}), and the men's plural turns k into c ({tacy}).",
      forms: {
        m: ["tak|i", "tak|iego", "tak|iemu", "tak|iego / tak|i", "tak|im", "tak|im"],
        f: ["tak|a", "tak|iej", "tak|iej", "tak|ą", "tak|ą", "tak|iej"],
        n: ["tak|ie", "tak|iego", "tak|iemu", "tak|ie", "tak|im", "tak|im"],
        plMen: ["tac|y", "tak|ich", "tak|im", "tak|ich", "tak|imi", "tak|ich"],
        plOther: ["tak|ie", "tak|ich", "tak|im", "tak|ie", "tak|imi", "tak|ich"],
      },
      ukForms: {
        m: ["такий", "такого", "такому", "такого / такий", "таким", "такому"],
        f: ["така", "такої", "такій", "таку", "такою", "такій"],
        n: ["таке", "такого", "такому", "таке", "таким", "такому"],
        plMen: ["такі", "таких", "таким", "таких", "такими", "таких"],
        plOther: ["такі", "таких", "таким", "такі", "такими", "таких"],
      },
    },
  ];

  // Every form of ten and where it is used. tamten and ten sam follow the same list.
  var endings = [
    { form: "ten", ukForm: "цей · той", where: "masculine: nominative, and accusative of things ({widzę ten dom})", ukWhere: "чоловічий: називний, знахідний для речей" },
    { form: "ta", ukForm: "ця · та", where: "feminine nominative", ukWhere: "жіночий, називний" },
    { form: "to", ukForm: "це · те", where: "neuter nominative and accusative, and {to jest} = it is", ukWhere: "середній: називний і знахідний; {to jest} = це є" },
    { form: "tego", ukForm: "цього · того", where: "genitive masculine and neuter, and accusative of men and animals ({widzę tego psa})", ukWhere: "родовий чоловічого і середнього; знахідний для людей і тварин" },
    { form: "temu", ukForm: "цьому · тому", where: "dative masculine and neuter; also ago: {dwa lata temu}", ukWhere: "давальний чоловічого і середнього; також тому: {dwa lata temu} = два роки тому" },
    { form: "tym", ukForm: "цим · тим · цьому", where: "three jobs: instrumental and locative of masculine and neuter, and dative plural", ukWhere: "три ролі: орудний і місцевий чоловічого й середнього, давальний множини" },
    { form: "tej", ukForm: "цієї · цій · тієї · тій", where: "feminine genitive, dative and locative", ukWhere: "жіночий: родовий, давальний, місцевий" },
    { form: "tę", ukForm: "цю · ту", where: "feminine accusative ({lubię tę piosenkę})", ukWhere: "жіночий знахідний" },
    { form: "tą", ukForm: "цією · тією", where: "feminine instrumental ({z tą kobietą})", ukWhere: "жіночий орудний" },
    { form: "ci", ukForm: "ці · ті", where: "plural nominative for men, or a group with at least one man ({ci ludzie})", ukWhere: "множина, називний, коли є хоч один чоловік" },
    { form: "te", ukForm: "ці · ті", where: "plural nominative and accusative for everything else ({te kobiety}, {te domy})", ukWhere: "множина, називний і знахідний для всіх інших" },
    { form: "tych", ukForm: "цих · тих", where: "plural genitive and locative, and accusative of men ({znam tych chłopców})", ukWhere: "множина: родовий, місцевий, знахідний для чоловіків" },
    { form: "tymi", ukForm: "цими · тими", where: "plural instrumental ({z tymi ludźmi})", ukWhere: "множина, орудний" },
  ];

  var tricky = [
    {
      en: "{tę} or {tą}? Accusative is {tę}: {Lubię tę piosenkę} (люблю цю пісню). Instrumental is {tą}: {z tą kobietą} (з цією жінкою). In speech you will hear {tą} for both, but write {tę}.",
      uk: "{tę} чи {tą}? Знахідний: {tę} (цю). Орудний: {tą} (цією). У розмові часто кажуть {tą} в обох, але правильно {tę}.",
    },
    {
      en: "But {tamten} has {tamtą} in both: {Weź tamtą torbę} (візьми ту сумку). There is no tamtę. The same goes for {tę samą}: the {sama} part takes -ą.",
      uk: "Але в {tamten} обидва відмінки {tamtą}: {Weź tamtą torbę}. Форми tamtę немає. Так само {tę samą}: {sama} має -ą.",
    },
    {
      en: "Masculine accusative: {tego} for people and animals, {ten} for things. {Znam tego pana}, {widzę tego psa}, but {kupuję ten samochód}. Ukrainian does the same: цього пана, але цей автомобіль.",
      uk: "Чоловічий знахідний: {tego} для людей і тварин, {ten} для речей. Як в українській: цього пана, але цей автомобіль.",
    },
    {
      en: "Plural nominative: {ci} (and {tamci}, {ci sami}, {tacy}) only when the group has a man in it: {ci ludzie}, {ci studenci}. Women, animals and things take {te}: {te kobiety}, {te psy}, {te domy}. Ukrainian has one form, ці.",
      uk: "Називний множини: {ci} лише коли в групі є чоловік: {ci ludzie}. Жінки, тварини і речі: {te}: {te kobiety}, {te psy}. Українською в обох випадках ці.",
    },
    {
      en: "After a negative the object goes into the genitive, so {ten} becomes {tego}, {ta} becomes {tej}, {te} becomes {tych}: {Mam ten dom} → {Nie mam tego domu}. Ukrainian often does this too: не маю цього дому.",
      uk: "Після заперечення додаток стоїть у родовому: {Mam ten dom} → {Nie mam tego domu}. Як українське не маю цього дому.",
    },
    {
      en: "{to} as it is / this is never changes: {To jest mój brat}, {To są moi rodzice}, {To była dobra książka}. Only the {to} that goes with a neuter noun is declined: {w tym mieście}.",
      uk: "{to} у значенні це є не змінюється: {To jest mój brat}, {To są moi rodzice}. Відмінюється лише {to} при іменнику середнього роду: {w tym mieście}.",
    },
    {
      en: "Short phrases with these forms: {dlatego} (that's why: {dla tego}, like для того), {po tym} (after that), {o tym} (about it), {przed tym} (before that), {poza tym} (besides), {mimo to} (even so).",
      uk: "Сталі вирази: {dlatego} (тому), {po tym} (після того), {o tym} (про це), {przed tym} (перед тим), {poza tym} (крім того), {mimo to} (попри це).",
    },
  ];

  var sentences = [
    // ten / ta / to / ci / te
    ["ten", "m", "nom", "Kim jest ___ pan?", "Who is this man?", "Хто цей пан?", ""],
    ["ten", "f", "nom", "Czyja jest ___ torba?", "Whose bag is this?", "Чия це сумка?", ""],
    ["ten", "n", "nom", "Jak smakuje ___ ciasto?", "How does this cake taste?", "Який на смак цей пиріг?", ""],
    ["ten", "plMen", "nom", "Kim są ___ ludzie?", "Who are these people?", "Хто ці люди?", ""],
    ["ten", "plOther", "nom", "Ile kosztują ___ buty?", "How much are these shoes?", "Скільки коштують ці черевики?", ""],
    ["ten", "m", "gen", "Nie znam ___ pana.", "I don't know this man.", "Я не знаю цього пана.", "nie znam"],
    ["ten", "f", "gen", "Nie lubię ___ piosenki.", "I don't like this song.", "Я не люблю цієї пісні.", "nie lubię"],
    ["ten", "n", "gen", "Nie rozumiem ___ słowa.", "I don't understand this word.", "Я не розумію цього слова.", "nie rozumiem"],
    ["ten", "mi", "gen", "Idę do ___ sklepu.", "I'm going to this shop.", "Я йду до цього магазину.", "do"],
    ["ten", "plMen", "gen", "Szukam ___ studentów.", "I'm looking for these students.", "Я шукаю цих студентів.", "szukam"],
    ["ten", "plOther", "gen", "Nie mam ___ książek.", "I don't have these books.", "У мене немає цих книжок.", "nie mam"],
    ["ten", "m", "dat", "Pomóż ___ panu.", "Help this man.", "Допоможи цьому панові.", "pomóż"],
    ["ten", "f", "dat", "Dziękuję ___ pani.", "I thank this lady.", "Я дякую цій пані.", "dziękuję"],
    ["ten", "n", "dat", "Dzięki ___ zdjęciu wszystko pamiętam.", "Thanks to this photo I remember everything.", "Завдяки цьому фото я все пам'ятаю.", "dzięki"],
    ["ten", "plMen", "dat", "Ufam ___ ludziom.", "I trust these people.", "Я довіряю цим людям.", "ufam"],
    ["ten", "plOther", "dat", "Daję wodę ___ kwiatom.", "I give water to these flowers.", "Я даю воду цим квітам.", "daję"],
    ["ten", "m", "acc", "Znasz ___ chłopaka?", "Do you know this boy?", "Ти знаєш цього хлопця?", "znasz"],
    ["ten", "mi", "acc", "Kupuję ___ samochód.", "I'm buying this car.", "Я купую цей автомобіль.", "kupuję"],
    ["ten", "f", "acc", "Lubię ___ piosenkę.", "I like this song.", "Я люблю цю пісню.", "lubię"],
    ["ten", "n", "acc", "Widzisz ___ okno?", "Do you see this window?", "Ти бачиш це вікно?", "widzisz"],
    ["ten", "plMen", "acc", "Znam ___ chłopców.", "I know these boys.", "Я знаю цих хлопців.", "znam"],
    ["ten", "plOther", "acc", "Kupię ___ jabłka.", "I'll buy these apples.", "Я куплю ці яблука.", "kupię"],
    ["ten", "m", "ins", "Rozmawiam z ___ panem.", "I'm talking with this man.", "Я розмовляю з цим паном.", "z"],
    ["ten", "f", "ins", "Idę do kina z ___ dziewczyną.", "I'm going to the cinema with this girl.", "Я йду в кіно з цією дівчиною.", "z"],
    ["ten", "n", "ins", "Interesuję się ___ miastem.", "I'm interested in this city.", "Я цікавлюся цим містом.", "interesuję się"],
    ["ten", "plMen", "ins", "Pracuję z ___ ludźmi.", "I work with these people.", "Я працюю з цими людьми.", "z"],
    ["ten", "plOther", "ins", "Stoję przed ___ drzwiami.", "I'm standing in front of this door.", "Я стою перед цими дверима.", "przed"],
    ["ten", "mi", "loc", "Mieszkam w ___ domu.", "I live in this house.", "Я живу в цьому домі.", "w"],
    ["ten", "f", "loc", "Myślę o ___ dziewczynie.", "I'm thinking about this girl.", "Я думаю про цю дівчину.", "o"],
    ["ten", "n", "loc", "Pracuję w ___ biurze.", "I work in this office.", "Я працюю в цьому офісі.", "w"],
    ["ten", "plMen", "loc", "Rozmawiamy o ___ studentach.", "We're talking about these students.", "Ми говоримо про цих студентів.", "o"],
    ["ten", "plOther", "loc", "Byłem w ___ sklepach.", "I've been in these shops.", "Я був у цих магазинах.", "w"],

    // tamten / tamta / tamto / tamci / tamte
    ["tamten", "mi", "nom", "Ten dom jest nowy, a ___ jest stary.", "This house is new, and that one is old.", "Цей дім новий, а той старий.", ""],
    ["tamten", "f", "nom", "Ta kawa jest zimna, a ___ gorąca.", "This coffee is cold, and that one is hot.", "Ця кава холодна, а та гаряча.", ""],
    ["tamten", "n", "nom", "To okno jest otwarte, a ___ zamknięte.", "This window is open, and that one is closed.", "Це вікно відчинене, а те зачинене.", ""],
    ["tamten", "plMen", "nom", "Ci panowie są z Polski, a ___ z Ukrainy.", "These men are from Poland, and those from Ukraine.", "Ці пани з Польщі, а ті з України.", ""],
    ["tamten", "plOther", "nom", "Te buty są tanie, a ___ drogie.", "These shoes are cheap, and those are expensive.", "Ці черевики дешеві, а ті дорогі.", ""],
    ["tamten", "mi", "gen", "Nie ma już ___ sklepu.", "That shop isn't there any more.", "Того магазину вже немає.", "nie ma"],
    ["tamten", "f", "gen", "Nie pamiętam ___ nocy.", "I don't remember that night.", "Я не пам'ятаю тієї ночі.", "nie pamiętam"],
    ["tamten", "n", "gen", "Nie widzę stąd ___ okna.", "I can't see that window from here.", "Звідси я не бачу того вікна.", "nie widzę"],
    ["tamten", "plMen", "gen", "Nie znam ___ ludzi.", "I don't know those people.", "Я не знаю тих людей.", "nie znam"],
    ["tamten", "plOther", "gen", "Szukam ___ zdjęć.", "I'm looking for those photos.", "Я шукаю тих фотографій.", "szukam"],
    ["tamten", "m", "dat", "Daj klucz ___ panu.", "Give the key to that man.", "Дай ключ тому панові.", "daj"],
    ["tamten", "f", "dat", "Pomóż ___ kobiecie.", "Help that woman.", "Допоможи тій жінці.", "pomóż"],
    ["tamten", "n", "dat", "Przyjrzyj się ___ zdjęciu.", "Take a close look at that photo.", "Придивися до того фото.", "przyjrzyj się"],
    ["tamten", "plMen", "dat", "Powiedz to ___ chłopcom.", "Tell it to those boys.", "Скажи це тим хлопцям.", "powiedz"],
    ["tamten", "m", "acc", "Widzisz ___ psa przy drzwiach?", "Do you see that dog by the door?", "Бачиш того пса біля дверей?", "widzisz"],
    ["tamten", "mi", "acc", "Wolę ___ stół.", "I prefer that table.", "Мені більше подобається той стіл.", "wolę"],
    ["tamten", "f", "acc", "Weź ___ torbę, nie tę.", "Take that bag, not this one.", "Візьми ту сумку, а не цю.", "weź"],
    ["tamten", "n", "acc", "Pamiętasz ___ lato?", "Do you remember that summer?", "Пам'ятаєш те літо?", "pamiętasz"],
    ["tamten", "plMen", "acc", "Pamiętasz ___ chłopaków z obozu?", "Do you remember those boys from the camp?", "Пам'ятаєш тих хлопців із табору?", "pamiętasz"],
    ["tamten", "plOther", "acc", "Kup ___ jabłka, nie te.", "Buy those apples, not these.", "Купи ті яблука, а не ці.", "kup"],
    ["tamten", "m", "ins", "Rozmawiałem z ___ panem.", "I talked with that man.", "Я розмовляв з тим паном.", "z"],
    ["tamten", "f", "ins", "Kot śpi pod ___ ławką.", "The cat is sleeping under that bench.", "Кіт спить під тією лавкою.", "pod"],
    ["tamten", "plMen", "ins", "Nie rozmawiam z ___ chłopakami.", "I don't talk with those boys.", "Я не розмовляю з тими хлопцями.", "z"],
    ["tamten", "plOther", "ins", "Za ___ drzwiami jest kuchnia.", "Behind that door is the kitchen.", "За тими дверима кухня.", "za"],
    ["tamten", "mi", "loc", "Mieszkałem w ___ domu.", "I used to live in that house.", "Я жив у тому домі.", "w"],
    ["tamten", "f", "loc", "Na ___ ulicy jest piekarnia.", "There's a bakery on that street.", "На тій вулиці є пекарня.", "na"],
    ["tamten", "n", "loc", "W ___ mieście nie ma metra.", "That city has no underground.", "У тому місті немає метро.", "w"],
    ["tamten", "plMen", "loc", "Często myślę o ___ ludziach.", "I often think about those people.", "Я часто думаю про тих людей.", "o"],

    // ten sam
    ["ten-sam", "f", "nom", "___ dziewczyna znowu dzwoniła.", "The same girl called again.", "Та сама дівчина знову дзвонила.", ""],
    ["ten-sam", "plMen", "nom", "___ ludzie przychodzą co roku.", "The same people come every year.", "Ті самі люди приходять щороку.", ""],
    ["ten-sam", "f", "gen", "Chodzimy do ___ szkoły.", "We go to the same school.", "Ми ходимо до тієї самої школи.", "do"],
    ["ten-sam", "m", "dat", "Zadaj to pytanie ___ nauczycielowi.", "Ask the same teacher that question.", "Постав це питання тому самому вчителеві.", "zadaj"],
    ["ten-sam", "m", "acc", "Znowu widzę ___ psa.", "I see the same dog again.", "Я знову бачу того самого пса.", "widzę"],
    ["ten-sam", "mi", "acc", "Mamy ___ problem.", "We have the same problem.", "У нас та сама проблема.", "mamy"],
    ["ten-sam", "f", "acc", "Czytamy ___ książkę.", "We're reading the same book.", "Ми читаємо ту саму книжку.", "czytamy"],
    ["ten-sam", "n", "acc", "Zawsze zamawiam ___.", "I always order the same thing.", "Я завжди замовляю те саме.", "zamawiam"],
    ["ten-sam", "plOther", "acc", "Kupiłem ___ buty co ty.", "I bought the same shoes as you.", "Я купив такі самі черевики, як ти.", "kupiłem"],
    ["ten-sam", "plMen", "ins", "Pracujemy z ___ ludźmi.", "We work with the same people.", "Ми працюємо з тими самими людьми.", "z"],
    ["ten-sam", "mi", "loc", "Mieszkamy w ___ domu.", "We live in the same house.", "Ми живемо в тому самому домі.", "w"],
    ["ten-sam", "f", "loc", "Mówimy o ___ rzeczy.", "We're talking about the same thing.", "Ми говоримо про ту саму річ.", "o"],

    // taki
    ["taki", "f", "nom", "Ona jest ___ miła.", "She is so nice.", "Вона така мила.", ""],
    ["taki", "n", "nom", "To ___ piękne miasto!", "It's such a beautiful city!", "Це таке гарне місто!", ""],
    ["taki", "plMen", "nom", "Oni są ___ mili!", "They are so nice!", "Вони такі милі!", ""],
    ["taki", "m", "gen", "Nigdy nie widziałem ___ psa.", "I've never seen such a dog.", "Я ніколи не бачив такого пса.", "nie widziałem"],
    ["taki", "f", "gen", "Nie znam ___ kobiety.", "I don't know a woman like that.", "Я не знаю такої жінки.", "nie znam"],
    ["taki", "n", "gen", "Nie ma ___ słowa.", "There's no such word.", "Немає такого слова.", "nie ma"],
    ["taki", "plOther", "gen", "Nie lubię ___ filmów.", "I don't like films like that.", "Я не люблю таких фільмів.", "nie lubię"],
    ["taki", "plMen", "dat", "Nie dawaj pieniędzy ___ ludziom.", "Don't give money to people like that.", "Не давай грошей таким людям.", "nie dawaj"],
    ["taki", "mi", "acc", "Chcę mieć ___ dom.", "I want to have a house like this.", "Я хочу мати такий дім.", "chcę mieć"],
    ["taki", "f", "acc", "Kupię ___ sukienkę.", "I'll buy a dress like this.", "Я куплю таку сукню.", "kupię"],
    ["taki", "m", "ins", "Jesteś ___ dobrym przyjacielem.", "You're such a good friend.", "Ти такий добрий друг.", "jesteś"],
    ["taki", "plMen", "ins", "Z ___ ludźmi nie warto rozmawiać.", "It's not worth talking with people like that.", "З такими людьми не варто розмовляти.", "z"],
    ["taki", "n", "loc", "Mieszkam w ___ małym mieście.", "I live in a small town like this.", "Я живу в такому маленькому місті.", "w"],
  ];

  window.POLISH_DEMONSTRATIVES = {
    CASES: CASES,
    SLOTS: SLOTS,
    words: words,
    endings: endings,
    tricky: tricky,
    sentences: sentences,
  };
})();
