// Nouns for the case endings quiz, with every form written as "stem|ending". The stem is the
// part that stays, the ending is what the case adds ("ps|a": pies → psa). An empty ending
// means no ending ("kobiet|": gen. pl. kobiet). "kot|u/owi" means both -u and -owi are right.
// A stem that differs from the dictionary form's stem (pies → ps-, kot → koci-) is pointed out
// on the card after answering.
//
// Each case has a sentence with a gap; a noun can replace one with its own `cues`. In cues,
// ___ is the gap, {en} / {enPl} the English noun, and {z} becomes "z" or "ze" to fit the form
// (ze before s, z, ś, ź, ż, sz, rz followed by a consonant: ze studentem, ze spaceru).
// `skip` lists slots ("sg.dat") with no natural sentence.
//
// `ctx` has a sentence for each number that sets the scene before the quiz sentence ("Puffy to mój
// pies." before "Myślę o psie."): [Polish, English]. It names who or what with names, mój / moja /
// moje or a plural verb, and never uses a form of the word that the card could ask for (the
// singular one may use the dictionary form, already shown on the card). `note` is shown after
// answering, for words whose gender and endings don't match (kolega).
window.POLISH_CASE_DRILL = {
  cases: [
    { id: "nom", name: "Nominative", pl: "mianownik", q: "kto? co?", uk: "називний", ukQ: "хто? що?" },
    { id: "gen", name: "Genitive", pl: "dopełniacz", q: "kogo? czego?", uk: "родовий", ukQ: "кого? чого?" },
    { id: "dat", name: "Dative", pl: "celownik", q: "komu? czemu?", uk: "давальний", ukQ: "кому? чому?" },
    { id: "acc", name: "Accusative", pl: "biernik", q: "kogo? co?", uk: "знахідний", ukQ: "кого? що?" },
    { id: "ins", name: "Instrumental", pl: "narzędnik", q: "z kim? z czym?", uk: "орудний", ukQ: "ким? чим?" },
    { id: "loc", name: "Locative", pl: "miejscownik", q: "o kim? o czym?", uk: "місцевий", ukQ: "на кому? на чому?" },
    { id: "voc", name: "Vocative", pl: "wołacz", q: "o!", uk: "кличний", ukQ: "о!" },
  ],

  // [Polish, English singular, English plural]. "alive" cues are for people and animals.
  cues: {
    nom: ["To są ___.", "", "These are {enPl}."],
    gen: ["Nie ma ___.", "There's no {en}.", "There are no {enPl}."],
    dat: ["Przyglądam się ___.", "I'm looking closely at the {en}.", "I'm looking closely at the {enPl}."],
    datAlive: ["Daję prezent ___.", "I'm giving the {en} a present.", "I'm giving the {enPl} a present."],
    acc: ["Widzę ___.", "I see the {en}.", "I see the {enPl}."],
    ins: ["Jestem przed ___.", "I'm in front of the {en}.", "I'm interested in {enPl}."],
    insPl: ["Interesuję się ___.", "", "I'm interested in {enPl}."],
    insAlive: ["Idę na spacer {z} ___.", "I'm going for a walk with the {en}.", "I'm going for a walk with the {enPl}."],
    loc: ["Myślę o ___.", "I'm thinking about the {en}.", "I'm thinking about the {enPl}."],
    voc: ["Cześć, ___!", "Hi, {en}!", ""],
  },

  nouns: [
    // ---- Masculine: people ----
    {
      word: "student", en: "student", enPl: "students", uk: "студент", gender: "m-pers", alive: true,
      ctx: { sg: ["Adam to mój nowy student.", "Adam is my new student."], pl: ["Adam i Piotr studiują u mnie. Są bardzo zdolni.", "Adam and Piotr study with me. They're very talented."] },
      sg: { nom: "student|", gen: "student|a", dat: "student|owi", acc: "student|a", ins: "student|em", loc: "studenci|e", voc: "studenci|e" },
      pl: { nom: "studenc|i", gen: "student|ów", dat: "student|om", acc: "student|ów", ins: "student|ami", loc: "student|ach" },
    },
    {
      word: "lekarz", en: "doctor", enPl: "doctors", uk: "лікар", gender: "m-pers", alive: true,
      ctx: { sg: ["Pan Nowak to nasz lekarz rodzinny.", "Mr Nowak is our family doctor."], pl: ["Pan Nowak i pani Kowalska leczą całą naszą rodzinę.", "Mr Nowak and Mrs Kowalska treat our whole family."] },
      sg: { nom: "lekarz|", gen: "lekarz|a", dat: "lekarz|owi", acc: "lekarz|a", ins: "lekarz|em", loc: "lekarz|u", voc: "lekarz|u" },
      pl: { nom: "lekarz|e", gen: "lekarz|y", dat: "lekarz|om", acc: "lekarz|y", ins: "lekarz|ami", loc: "lekarz|ach" },
    },
    {
      word: "przyjaciel", en: "friend", enPl: "friends", uk: "друг", gender: "m-pers", alive: true,
      ctx: { sg: ["Tomek to mój najlepszy przyjaciel.", "Tomek is my best friend."], pl: ["Tomek i Marek znają mnie od zawsze.", "Tomek and Marek have known me forever."] },
      sg: { nom: "przyjaciel|", gen: "przyjaciel|a", dat: "przyjaciel|owi", acc: "przyjaciel|a", ins: "przyjaciel|em", loc: "przyjaciel|u", voc: "przyjaciel|u" },
      pl: { nom: "przyjaciel|e", gen: "przyjaciół|", dat: "przyjaciel|om", acc: "przyjaciół|", ins: "przyjaciół|mi", loc: "przyjaciel|ach" },
    },
    {
      word: "kolega", en: "colleague", enPl: "colleagues", uk: "колега, приятель", gender: "m-pers", alive: true,
      ctx: { sg: ["Adam to mój kolega z pracy.", "Adam is my colleague from work."], pl: ["Adam i Piotr pracują ze mną w biurze.", "Adam and Piotr work with me in the office."] },
      note: "A man, so masculine, but it ends in -a: in the singular it changes like {kobieta} ({kolegę}, {kolegą}). In the plural it is a man's word again: {koledzy}, {kolegów}.",
      sg: { nom: "koleg|a", gen: "koleg|i", dat: "koledz|e", acc: "koleg|ę", ins: "koleg|ą", loc: "koledz|e", voc: "koleg|o" },
      pl: { nom: "koledz|y", gen: "koleg|ów", dat: "koleg|om", acc: "koleg|ów", ins: "koleg|ami", loc: "koleg|ach" },
    },

    // ---- Masculine: animals ----
    {
      word: "kot", en: "cat", enPl: "cats", uk: "кіт", gender: "m-anim", alive: true,
      ctx: { sg: ["Mruczek to mój kot.", "Mruczek is my cat."], pl: ["Mruczek i Filemon śpią cały dzień na kanapie.", "Mruczek and Filemon sleep on the sofa all day."] },
      sg: { nom: "kot|", gen: "kot|a", dat: "kot|u/owi", acc: "kot|a", ins: "kot|em", loc: "koci|e", voc: "koci|e" },
      pl: { nom: "kot|y", gen: "kot|ów", dat: "kot|om", acc: "kot|y", ins: "kot|ami", loc: "kot|ach" },
    },
    {
      word: "pies", en: "dog", enPl: "dogs", uk: "пес", gender: "m-anim", alive: true,
      ctx: { sg: ["Puffy to mój pies.", "Puffy is my dog."], pl: ["Puffy i Max biegają po parku.", "Puffy and Max are running around the park."] },
      note: "An animal: in the singular {kogo? co?} takes the {kogo?} form ({psa}), in the plural it is like a thing ({psy}, {one}).",
      sg: { nom: "pies|", gen: "ps|a", dat: "ps|u", acc: "ps|a", ins: "ps|em", loc: "ps|ie", voc: "ps|ie" },
      pl: { nom: "ps|y", gen: "ps|ów", dat: "ps|om", acc: "ps|y", ins: "ps|ami", loc: "ps|ach" },
    },

    // ---- Masculine: things ----
    {
      word: "dom", en: "house", enPl: "houses", uk: "дім", gender: "m-inan",
      ctx: { sg: ["Mieszkamy na wsi. Nasz dom jest stary.", "We live in the country. Our house is old."], pl: ["Na naszej ulicy stoją nowe budynki, wszystkie białe.", "New buildings stand on our street, all of them white."] },
      sg: { nom: "dom|", gen: "dom|u", dat: "dom|owi", acc: "dom|", ins: "dom|em", loc: "dom|u" },
      pl: { nom: "dom|y", gen: "dom|ów", dat: "dom|om", acc: "dom|y", ins: "dom|ami", loc: "dom|ach" },
    },
    {
      word: "stół", en: "table", enPl: "tables", uk: "стіл", gender: "m-inan",
      ctx: { sg: ["W kuchni stoi duży drewniany stół.", "There's a big wooden table in the kitchen."], pl: ["Meble w jadalni są nowe.", "The furniture in the dining room is new."] },
      sg: { nom: "stół|", gen: "stoł|u", dat: "stoł|owi", acc: "stół|", ins: "stoł|em", loc: "stol|e" },
      pl: { nom: "stoł|y", gen: "stoł|ów", dat: "stoł|om", acc: "stoł|y", ins: "stoł|ami", loc: "stoł|ach" },
    },
    {
      word: "samochód", en: "car", enPl: "cars", uk: "автомобіль", gender: "m-inan",
      ctx: { sg: ["Mój samochód jest czerwony.", "My car is red."], pl: ["Na parkingu stoją auta sąsiadów.", "The neighbours' cars are standing in the car park."] },
      sg: { nom: "samochód|", gen: "samochod|u", dat: "samochod|owi", acc: "samochód|", ins: "samochod|em", loc: "samochodzi|e" },
      pl: { nom: "samochod|y", gen: "samochod|ów", dat: "samochod|om", acc: "samochod|y", ins: "samochod|ami", loc: "samochod|ach" },
    },
    {
      word: "telefon", en: "phone", enPl: "phones", uk: "телефон", gender: "m-inan",
      ctx: { sg: ["Mój telefon jest nowy.", "My phone is new."], pl: ["Mam komórkę służbową i prywatną.", "I have a work mobile and a private one."] },
      sg: { nom: "telefon|", gen: "telefon|u", dat: "telefon|owi", acc: "telefon|", ins: "telefon|em", loc: "telefoni|e" },
      pl: { nom: "telefon|y", gen: "telefon|ów", dat: "telefon|om", acc: "telefon|y", ins: "telefon|ami", loc: "telefon|ach" },
    },
    {
      word: "klucz", en: "key", enPl: "keys", uk: "ключ", gender: "m-inan",
      ctx: { sg: ["Gdzie jest mój klucz?", "Where's my key?"], pl: ["Mam klucz do domu i klucz do biura.", "I have a key to the house and a key to the office."] },
      sg: { nom: "klucz|", gen: "klucz|a", dat: "klucz|owi", acc: "klucz|", ins: "klucz|em", loc: "klucz|u" },
      pl: { nom: "klucz|e", gen: "klucz|y", dat: "klucz|om", acc: "klucz|e", ins: "klucz|ami", loc: "klucz|ach" },
    },
    {
      word: "spacer", en: "walk", enPl: "walks", uk: "прогулянка", gender: "m-inan",
      ctx: { sg: ["Jest ładna pogoda, więc wychodzę z psem.", "The weather's nice, so I'm going out with the dog."], pl: ["Rano i wieczorem chodzę z psem do parku.", "Every morning and evening I take the dog to the park."] },
      skip: ["sg.dat", "pl.dat"],
      cues: {
        gen: ["Wracam {z} ___.", "I'm coming back from a walk.", "I don't like walks."],
        genPl: ["Nie lubię ___.", "", "I don't like walks."],
        acc: ["Idę na ___.", "I'm going for a walk.", "I like walks."],
        accPl: ["Lubię ___.", "", "I like walks."],
        ins: ["Cieszę się ___.", "I'm enjoying the walk.", "I'm enjoying the walks."],
      },
      sg: { nom: "spacer|", gen: "spacer|u", acc: "spacer|", ins: "spacer|em", loc: "spacerz|e" },
      pl: { nom: "spacer|y", gen: "spacer|ów", acc: "spacer|y", ins: "spacer|ami", loc: "spacer|ach" },
    },

    // ---- Feminine ----
    {
      word: "kobieta", en: "woman", enPl: "women", uk: "жінка", gender: "f", alive: true,
      ctx: { sg: ["Ta pani w czerwonej sukience to moja sąsiadka.", "The lady in the red dress is my neighbour."], pl: ["Ewa i Ola były wczoraj w czerwonych sukienkach.", "Ewa and Ola wore red dresses yesterday."] },
      sg: { nom: "kobiet|a", gen: "kobiet|y", dat: "kobieci|e", acc: "kobiet|ę", ins: "kobiet|ą", loc: "kobieci|e", voc: "kobiet|o" },
      pl: { nom: "kobiet|y", gen: "kobiet|", dat: "kobiet|om", acc: "kobiet|y", ins: "kobiet|ami", loc: "kobiet|ach" },
    },
    {
      word: "mama", en: "mum", enPl: "mums", uk: "мама", gender: "f", alive: true,
      ctx: { sg: ["Moja mama ma na imię Anna.", "My mum's name is Anna."], pl: ["Anna i Ewa przyszły po dzieci do szkoły.", "Anna and Ewa came to school to pick up their children."] },
      sg: { nom: "mam|a", gen: "mam|y", dat: "mami|e", acc: "mam|ę", ins: "mam|ą", loc: "mami|e", voc: "mam|o" },
      pl: { nom: "mam|y", gen: "mam|", dat: "mam|om", acc: "mam|y", ins: "mam|ami", loc: "mam|ach" },
    },
    {
      word: "książka", en: "book", enPl: "books", uk: "книжка", gender: "f",
      ctx: { sg: ["To moja ulubiona książka.", "This is my favourite book."], pl: ["Na półce stoją moje ulubione powieści.", "My favourite novels stand on the shelf."] },
      sg: { nom: "książk|a", gen: "książk|i", dat: "książc|e", acc: "książk|ę", ins: "książk|ą", loc: "książc|e" },
      pl: { nom: "książk|i", gen: "książek|", dat: "książk|om", acc: "książk|i", ins: "książk|ami", loc: "książk|ach" },
    },
    {
      word: "ulica", en: "street", enPl: "streets", uk: "вулиця", gender: "f",
      ctx: { sg: ["Nasza ulica jest bardzo spokojna.", "Our street is very quiet."], pl: ["Stare miasto ma wąskie, kręte uliczki.", "The old town has narrow, winding little streets."] },
      sg: { nom: "ulic|a", gen: "ulic|y", dat: "ulic|y", acc: "ulic|ę", ins: "ulic|ą", loc: "ulic|y" },
      pl: { nom: "ulic|e", gen: "ulic|", dat: "ulic|om", acc: "ulic|e", ins: "ulic|ami", loc: "ulic|ach" },
    },
    {
      word: "noc", en: "night", enPl: "nights", uk: "ніч", gender: "f",
      ctx: { sg: ["Ta noc była bardzo zimna.", "That night was very cold."], pl: ["W lipcu jest ciepło nawet po zmroku.", "In July it's warm even after dark."] },
      skip: ["sg.dat", "pl.dat"],
      cues: {
        gen: ["Nie lubię ___.", "I don't like the night.", "I don't like nights."],
        acc: ["Kocham ___.", "I love the night.", "I count the nights."],
        accPl: ["Liczę ___.", "", "I count the nights."],
        ins: ["Pracuję ___.", "I work at night.", "I work nights."],
      },
      sg: { nom: "noc|", gen: "noc|y", acc: "noc|", ins: "noc|ą", loc: "noc|y" },
      pl: { nom: "noc|e", gen: "noc|y", acc: "noc|e", ins: "noc|ami", loc: "noc|ach" },
    },
    {
      word: "rzecz", en: "thing", enPl: "things", uk: "річ", gender: "f",
      ctx: { sg: ["Ta rzecz jest bardzo ważna.", "This thing is very important."], pl: ["Pakuję się: ubrania, buty, kosmetyki.", "I'm packing: clothes, shoes, toiletries."] },
      cues: { ins: ["Interesuję się ___.", "I'm interested in the thing.", "I'm interested in {enPl}."] },
      sg: { nom: "rzecz|", gen: "rzecz|y", dat: "rzecz|y", acc: "rzecz|", ins: "rzecz|ą", loc: "rzecz|y" },
      pl: { nom: "rzecz|y", gen: "rzecz|y", dat: "rzecz|om", acc: "rzecz|y", ins: "rzecz|ami", loc: "rzecz|ach" },
    },
    {
      word: "połowa", en: "half", uk: "половина", gender: "f",
      ctx: { sg: ["Dzielę wszystko na dwie równe części.", "I split everything into two equal parts."] },
      skip: ["sg.dat"],
      cues: {
        gen: ["Brakuje ___ tekstu.", "Half of the text is missing.", ""],
        acc: ["Zjadłem ___ pizzy.", "I ate half of the pizza.", ""],
        ins: ["Dzielę się ___ obiadu.", "I'm sharing half of my lunch.", ""],
        loc: ["Jesteśmy w ___ drogi.", "We're halfway there.", ""],
      },
      sg: { nom: "połow|a", gen: "połow|y", acc: "połow|ę", ins: "połow|ą", loc: "połowi|e" },
    },

    // ---- Neuter ----
    {
      word: "okno", en: "window", enPl: "windows", uk: "вікно", gender: "n",
      ctx: { sg: ["W moim pokoju jest jedno duże okno.", "There's one big window in my room."], pl: ["W salonie jest bardzo jasno: światło wpada z trzech stron.", "The living room is very bright: light comes in from three sides."] },
      sg: { nom: "okn|o", gen: "okn|a", dat: "okn|u", acc: "okn|o", ins: "okn|em", loc: "okni|e" },
      pl: { nom: "okn|a", gen: "okien|", dat: "okn|om", acc: "okn|a", ins: "okn|ami", loc: "okn|ach" },
    },
    {
      word: "miasto", en: "city", enPl: "cities", uk: "місто", gender: "n",
      ctx: { sg: ["Kraków to piękne stare miasto.", "Kraków is a beautiful old city."], pl: ["Kraków, Gdańsk i Wrocław są piękne.", "Kraków, Gdańsk and Wrocław are beautiful."] },
      sg: { nom: "miast|o", gen: "miast|a", dat: "miast|u", acc: "miast|o", ins: "miast|em", loc: "mieści|e" },
      pl: { nom: "miast|a", gen: "miast|", dat: "miast|om", acc: "miast|a", ins: "miast|ami", loc: "miast|ach" },
    },
    {
      word: "morze", en: "sea", enPl: "seas", uk: "море", gender: "n",
      ctx: { sg: ["Bałtyk to zimne morze.", "The Baltic is a cold sea."], pl: ["Bałtyk i Adriatyk są zupełnie inne.", "The Baltic and the Adriatic are completely different."] },
      cues: { ins: ["Jestem nad ___.", "I'm at the seaside.", "I'm interested in {enPl}."] },
      sg: { nom: "morz|e", gen: "morz|a", dat: "morz|u", acc: "morz|e", ins: "morz|em", loc: "morz|u" },
      pl: { nom: "morz|a", gen: "mórz|", dat: "morz|om", acc: "morz|a", ins: "morz|ami", loc: "morz|ach" },
    },
    {
      word: "imię", en: "name", enPl: "names", uk: "ім'я", gender: "n",
      ctx: { sg: ["Moja córka nazywa się Zosia.", "My daughter is called Zosia."], pl: ["Zosia, Ola i Kuba: tak nazywają się moje dzieci.", "Zosia, Ola and Kuba: that's what my children are called."] },
      skip: ["sg.dat", "pl.dat"],
      cues: {
        gen: ["Nie pamiętam ___.", "I don't remember the name.", "I don't remember the names."],
        acc: ["Znam ___.", "I know the name.", "I know the names."],
        ins: ["Interesuję się ___.", "I'm interested in the name.", "I'm interested in names."],
      },
      sg: { nom: "imi|ę", gen: "imieni|a", acc: "imi|ę", ins: "imieni|em", loc: "imieni|u" },
      pl: { nom: "imion|a", gen: "imion|", acc: "imion|a", ins: "imion|ami", loc: "imion|ach" },
    },
    {
      word: "dziecko", en: "child", enPl: "children", uk: "дитина", gender: "n", alive: true,
      ctx: { sg: ["Zosia to nasze najmłodsze dziecko.", "Zosia is our youngest child."], pl: ["Zosia i Kuba bawią się w ogrodzie.", "Zosia and Kuba are playing in the garden."] },
      note: "Neuter. In the plural ({dzieci}) it takes the {one} forms, even when the children are boys.",
      sg: { nom: "dzieck|o", gen: "dzieck|a", dat: "dzieck|u", acc: "dzieck|o", ins: "dziecki|em", loc: "dzieck|u", voc: "dzieck|o" },
      pl: { nom: "dzieci|", gen: "dzieci|", dat: "dzieci|om", acc: "dzieci|", ins: "dzieć|mi", loc: "dzieci|ach" },
    },
  ],
};
