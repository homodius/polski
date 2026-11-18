// Polish cases (przypadki): what each case is for, its endings, and example words declined
// through all seven cases. Used by the rules page (cases-page.js).
//
// Shapes
//   CASE_ORDER   ids in the order Polish grammars list them; every `forms` array follows it.
//                The rules page gives each case section the same id (cases/#gen).
//   cases[]      { id, pl, q, uk, ukQ, en, uses[], preps: [[pl, en]], endings: { sg[], pl[] },
//                  examples: [[pl, en, uk]], ukNote }
//   nouns[]      { id, pl, gender, en, uk, note, forms: { sg: [7], pl: [7] } }
//   adjectives[] { id, pl, en, uk, note, forms: { mAnim, mInan, f, n, plMen, plOther: [7] } }
//   pronouns[]   { id, pl, en, uk, forms: [7] }: a form can list variants ("jego / go / niego");
//                null means the case has no form.
//
// Text conventions
//   "stem|ending"   every declined form. The part before "|" is shown plainly, the part after it
//                   is the ending. An empty ending ("kot|") is the zero ending. The stem itself can
//                   change (pies → ps|a, kot → koc|ie); the noun's note says how.
//   "[stem|ending]" inside a Polish example sentence marks the declined word; "[word]" marks a
//                   whole word. Strip "[", "]" and "|" to get the plain sentence.
//   "{polski}"      inside English prose marks Polish words, which the page makes tappable.
//   gender ids: "m-pers" (men), "m-anim" (animals), "m-inan" (things), "f", "n".
(function () {
  var CASE_ORDER = ["nom", "gen", "dat", "acc", "ins", "loc", "voc"];

  var genders = [
    {
      id: "m-pers", pl: "męski osobowy", uk: "чоловічий (особи)", en: "masculine, people",
      spot: "Usually ends in a consonant and means a man: {student}, {nauczyciel}, {brat}. A few end in -a: {mężczyzna}, {kolega}.",
    },
    {
      id: "m-anim", pl: "męski żywotny", uk: "чоловічий (істоти)", en: "masculine, animals",
      spot: "Ends in a consonant and means an animal: {kot}, {pies}, {małż}.",
    },
    {
      id: "m-inan", pl: "męski nieżywotny", uk: "чоловічий (речі)", en: "masculine, things",
      spot: "Ends in a consonant and means a thing or idea: {dom}, {stół}, {klucz}, {spacer}.",
    },
    {
      id: "f", pl: "żeński", uk: "жіночий", en: "feminine",
      spot: "Ends in -a: {kobieta}, {matka}, {ulica}, {połowa}. Some end in a soft consonant, often -ść or -c: {noc}, {wątpliwość}.",
    },
    {
      id: "n", pl: "nijaki", uk: "середній", en: "neuter",
      spot: "Ends in -o, -e, -ę or -um: {okno}, {miasto}, {morze}, {imię}, {muzeum}.",
    },
  ];

  var cases = [
    {
      id: "nom", pl: "mianownik", q: "kto? co?", uk: "називний", ukQ: "хто? що?", en: "nominative",
      uses: [
        "The subject: who or what does the action.",
        "After {to jest} and {to są} (this is, these are).",
        "The form you find in a dictionary.",
      ],
      preps: [],
      endings: {
        sg: [
          "Masculine: no ending, the word ends in a consonant: {kot}, {dom}, {student}.",
          "Feminine: -a ({kobieta}, {ulica}), or no ending after a soft consonant ({noc}).",
          "Neuter: -o, -e or -ę: {okno}, {morze}, {imię}.",
        ],
        pl: [
          "Men: -i or -y, often with a softened stem: {studenci}, {Polacy}. Some take -owie: {panowie}, {synowie}.",
          "Other masculine and feminine: -y after hard consonants ({koty}, {kobiety}), -i after k and g ({matki}), -e after soft ones ({klucze}, {ulice}, {noce}).",
          "Neuter: -a: {okna}, {miasta}, {morza}.",
        ],
      },
      examples: [
        ["To jest [kot|].", "This is a cat.", "Це кіт."],
        ["[Kobiet|a] czyta gazetę.", "The woman is reading a newspaper.", "Жінка читає газету."],
        ["[Studenc|i] są w domu.", "The students are at home.", "Студенти вдома."],
      ],
      ukNote: "The same job as the Ukrainian називний.",
    },
    {
      id: "gen", pl: "dopełniacz", q: "kogo? czego?", uk: "родовий", ukQ: "кого? чого?", en: "genitive",
      uses: [
        "Of: whose something is. {Dom brata} (the brother's house).",
        "After any negated verb: {Nie mam kota} (I don't have a cat), {Nie ma czasu} (there is no time).",
        "Amounts: {dużo}, {mało}, {trochę}, {kilo}, and numbers from 5 up: {pięć kotów}.",
        "After verbs such as {szukać}, {potrzebować}, {słuchać}, {uczyć się}, {bać się}.",
      ],
      preps: [
        ["do", "to"], ["od", "from"], ["z", "out of, from"], ["bez", "without"], ["u", "at someone's"],
        ["dla", "for"], ["obok", "next to"], ["koło", "near"], ["podczas", "during"],
        ["zamiast", "instead of"], ["co do", "as for, about"],
      ],
      endings: {
        sg: [
          "Masculine people and animals: -a: {studenta}, {kota}, {psa}.",
          "Masculine things: usually -u ({domu}, {stołu}, {spaceru}), but many common things take -a ({klucza}, {chleba}, {noża}). This is learnt word by word.",
          "Feminine: -y after hard consonants and after c, cz, sz, rz, ż ({kobiety}, {ulicy}, {nocy}); -i after k, g, l, j and soft consonants ({matki}, {ziemi}, {wątpliwości}).",
          "Neuter: -a: {okna}, {miasta}, {morza}.",
        ],
        pl: [
          "Masculine: -ów after hard consonants ({kotów}, {domów}, {studentów}), -y or -i after soft ones ({kluczy}, {nauczycieli}, {małży}).",
          "Feminine and neuter: no ending at all, only the stem: {kobiet}, {ulic}, {miast}. An extra e often appears ({matek}, {okien}) and o can turn into ó ({połów}, {mórz}).",
          "Feminine words without -a: -y or -i: {nocy}, {wątpliwości}.",
        ],
      },
      examples: [
        ["Nie mam [kot|a].", "I don't have a cat.", "У мене немає кота."],
        ["Szukam [klucz|a].", "I'm looking for the key.", "Я шукаю ключ."],
        ["Idę do [dom|u].", "I'm going home.", "Я йду додому."],
        ["Mam co do [teg|o] wątpliwości.", "I have doubts about this.", "Я маю щодо цього сумніви."],
      ],
      ukNote: "Like the родовий, but Polish uses it even more: after every negated verb ({Nie mam czasu} = Не маю часу) and after {szukać}, which in Ukrainian takes a plain object (шукаю ключ).",
    },
    {
      id: "dat", pl: "celownik", q: "komu? czemu?", uk: "давальний", ukQ: "кому? чому?", en: "dative",
      uses: [
        "To or for someone: the person who gets something. {Daję mamie kwiaty} (I give Mum flowers).",
        "After verbs such as {pomagać}, {dziękować}, {ufać}, {wierzyć}, {podobać się}.",
        "How someone feels: {Zimno mi} (I'm cold), {Jest mi smutno} (I'm sad).",
      ],
      preps: [["dzięki", "thanks to"], ["ku", "towards"], ["przeciw", "against"], ["wbrew", "despite"]],
      endings: {
        sg: [
          "Masculine: -owi: {studentowi}, {domowi}, {nauczycielowi}. A few short, everyday words take -u: {kotu}, {psu}, {bratu}, {panu}, {ojcu}.",
          "Feminine: the same as the locative. -e with a softened stem after hard consonants ({kobiecie}, {matce}, {połowie}), -y or -i after soft ones ({ulicy}, {nocy}).",
          "Neuter: -u: {oknu}, {miastu}, {morzu}.",
        ],
        pl: [
          "Every gender: -om: {kotom}, {kobietom}, {oknom}.",
        ],
      },
      examples: [
        ["Pomagam [kobiec|ie].", "I'm helping the woman.", "Я допомагаю жінці."],
        ["Daję [kot|u] mleko.", "I'm giving the cat some milk.", "Я даю котові молоко."],
        ["Dziękuję [nauczyciel|owi].", "I thank the teacher.", "Я дякую вчителеві."],
      ],
      ukNote: "Polish -owi is the Ukrainian -ові / -еві: студентові = {studentowi}. The plural -om is the Ukrainian -ам.",
    },
    {
      id: "acc", pl: "biernik", q: "kogo? co?", uk: "знахідний", ukQ: "кого? що?", en: "accusative",
      uses: [
        "The direct object: what you have, see, want, buy or love. {Mam kota}, {Widzę kobietę}.",
        "Where you are going, after {na} and {w}: {Idę na spacer} (I'm going for a walk).",
        "A length of time: {na tydzień} (for a week), {cały dzień} (all day).",
      ],
      preps: [
        ["na", "onto, to"], ["w", "into"], ["przez", "through, because of"],
        ["za", "for (dziękuję za pomoc)"], ["o", "asking for (proszę o wodę)"],
      ],
      endings: {
        sg: [
          "Masculine people and animals: the same as the genitive, -a: {studenta}, {kota}, {psa}.",
          "Masculine things: the same as the nominative: {dom}, {klucz}, {spacer}.",
          "Feminine: -ę: {kobietę}, {matkę}, {ulicę}. Words without -a stay the same: {noc}.",
          "Neuter: the same as the nominative: {okno}, {morze}.",
        ],
        pl: [
          "Men: the same as the genitive: {studentów}, {nauczycieli}.",
          "Everything else: the same as the nominative: {koty}, {kobiety}, {okna}.",
        ],
      },
      examples: [
        ["Mam [kot|a].", "I have a cat.", "У мене є кіт."],
        ["Widzę [kobiet|ę].", "I see the woman.", "Я бачу жінку."],
        ["Idę na [spacer|].", "I'm going for a walk.", "Я йду на прогулянку."],
      ],
      ukNote: "Works like the знахідний: жінку = {kobietę}. At the end of a word ę is said almost like a plain e.",
    },
    {
      id: "ins", pl: "narzędnik", q: "(z) kim? (z) czym?", uk: "орудний", ukQ: "ким? чим?", en: "instrumental",
      uses: [
        "Together with someone or something, after {z}: {Idę z psem}.",
        "The tool or way you do something: {Piszę długopisem} (with a pen), {Jadę autobusem} (by bus).",
        "What someone is, after {być} and {zostać}: {Jestem studentem} (I'm a student).",
      ],
      preps: [
        ["z", "with"], ["przed", "in front of"], ["za", "behind"], ["nad", "above"],
        ["pod", "under"], ["między", "between"],
      ],
      endings: {
        sg: [
          "Masculine and neuter: -em ({kotem}, {domem}, {oknem}); after k and g -iem: {chłopakiem}.",
          "Feminine: -ą: {kobietą}, {ulicą}, {nocą}.",
        ],
        pl: [
          "Every gender: -ami: {kotami}, {kobietami}, {oknami}. A few take -mi: {ludźmi}, {dziećmi}.",
        ],
      },
      examples: [
        ["Idę na spacer z [ps|em].", "I'm going for a walk with the dog.", "Я йду на прогулянку з собакою."],
        ["Jestem [student|em].", "I'm a student.", "Я студент."],
        ["Rozmawiam z [kobiet|ą].", "I'm talking with the woman.", "Я розмовляю з жінкою."],
      ],
      ukNote: "Polish -ą is the Ukrainian -ою (жінкою = {kobietą}) and -em is -ом (котом = {kotem}). Unlike Ukrainian, Polish always puts the noun after {być} in the instrumental: {Jestem studentem}, never {Jestem student}.",
    },
    {
      id: "loc", pl: "miejscownik", q: "o kim? o czym?", uk: "місцевий", ukQ: "на кому? на чому?", en: "locative",
      uses: [
        "Only after a preposition, never alone.",
        "Where something is: {w domu}, {na stole}, {w mieście}.",
        "What you talk or think about, after {o}: {Myślę o tobie}.",
      ],
      preps: [["w", "in"], ["na", "on, at"], ["o", "about"], ["przy", "by, near"], ["po", "after, around"]],
      endings: {
        sg: [
          "Masculine and neuter with a hard stem: -e, and the last consonant softens: {kocie}, {stole}, {spacerze}, {oknie}, {mieście}.",
          "After k, g, ch and soft consonants: -u: {kluczu}, {nauczycielu}, {morzu}, {małżu}. Also {domu}, {synu}, {panu}.",
          "Feminine: -e with a softened stem after hard consonants ({kobiecie}, {matce}, {połowie}), -y or -i after soft ones ({ulicy}, {nocy}).",
        ],
        pl: [
          "Every gender: -ach: {kotach}, {kobietach}, {oknach}.",
        ],
      },
      examples: [
        ["Mieszkam w [mieśc|ie].", "I live in the city.", "Я живу в місті."],
        ["Klucz jest na [stol|e].", "The key is on the table.", "Ключ на столі."],
        ["Jestem w [dom|u].", "I'm at home.", "Я вдома."],
      ],
      ukNote: "Like the місцевий, it only comes after a preposition, and the consonant softens the same way: на столі = {na stole}, у місті = {w mieście}.",
    },
    {
      id: "voc", pl: "wołacz", q: "o!", uk: "кличний", ukQ: "о!", en: "vocative",
      uses: [
        "Calling or addressing someone: {Mamo!} {Panie profesorze!}",
        "Friends' names often stay in the nominative in everyday speech, but titles and family words use the vocative: {Dzień dobry, panie doktorze}.",
      ],
      preps: [],
      endings: {
        sg: [
          "Masculine: mostly the same as the locative: -e with a softened stem ({studencie}, {kocie}) or -u ({nauczycielu}, {synu}).",
          "Feminine: -o after hard consonants ({kobieto}, {matko}), -u for pet names ({Basiu}, {mamusiu}), -y or -i for words without -a ({nocy}).",
          "Neuter: the same as the nominative: {okno}.",
        ],
        pl: [
          "Every gender: the same as the nominative: {studenci}, {kobiety}.",
        ],
      },
      examples: [
        ["[Mam|o], gdzie jest klucz?", "Mum, where is the key?", "Мамо, де ключ?"],
        ["Dzień dobry, [pan|ie] profesorze!", "Good morning, professor!", "Добрий день, пане професоре!"],
      ],
      ukNote: "Ukrainian still uses the кличний every day (мамо, пане, друже), and so does Polish: {mamo}, {panie}, {kolego}.",
    },
  ];

  // Example nouns, one or more for each gender and stem type.
  var nouns = [
    {
      id: "student", pl: "student", gender: "m-pers", en: "student", uk: "студент",
      note: "t softens to c before -ie and before the men's plural -i.",
      forms: {
        sg: ["student|", "student|a", "student|owi", "student|a", "student|em", "studenc|ie", "studenc|ie"],
        pl: ["studenc|i", "student|ów", "student|om", "student|ów", "student|ami", "student|ach", "studenc|i"],
      },
    },
    {
      id: "nauczyciel", pl: "nauczyciel", gender: "m-pers", en: "teacher", uk: "вчитель",
      note: "Soft stem (l): locative -u, men's plural -e, genitive plural -i.",
      forms: {
        sg: ["nauczyciel|", "nauczyciel|a", "nauczyciel|owi", "nauczyciel|a", "nauczyciel|em", "nauczyciel|u", "nauczyciel|u"],
        pl: ["nauczyciel|e", "nauczyciel|i", "nauczyciel|om", "nauczyciel|i", "nauczyciel|ami", "nauczyciel|ach", "nauczyciel|e"],
      },
    },
    {
      id: "kot", pl: "kot", gender: "m-anim", en: "cat", uk: "кіт",
      note: "A short word, so the dative is -u, not -owi. t softens to c before -ie.",
      forms: {
        sg: ["kot|", "kot|a", "kot|u", "kot|a", "kot|em", "koc|ie", "koc|ie"],
        pl: ["kot|y", "kot|ów", "kot|om", "kot|y", "kot|ami", "kot|ach", "kot|y"],
      },
    },
    {
      id: "pies", pl: "pies", gender: "m-anim", en: "dog", uk: "пес, собака",
      note: "The e of {pies} drops out in every other form, as in Ukrainian пес → пса.",
      forms: {
        sg: ["pies|", "ps|a", "ps|u", "ps|a", "ps|em", "ps|ie", "ps|ie"],
        pl: ["ps|y", "ps|ów", "ps|om", "ps|y", "ps|ami", "ps|ach", "ps|y"],
      },
    },
    {
      id: "malz", pl: "małż", gender: "m-anim", en: "clam", uk: "молюск",
      note: "An animal, so the accusative is {małża}. ż counts as soft: locative -u, plural -e, genitive plural -y.",
      forms: {
        sg: ["małż|", "małż|a", "małż|owi", "małż|a", "małż|em", "małż|u", "małż|u"],
        pl: ["małż|e", "małż|y", "małż|om", "małż|e", "małż|ami", "małż|ach", "małż|e"],
      },
    },
    {
      id: "dom", pl: "dom", gender: "m-inan", en: "house, home", uk: "дім",
      note: "A thing, so the accusative is the same as the nominative. The locative {w domu} is an exception: -u, not -e.",
      forms: {
        sg: ["dom|", "dom|u", "dom|owi", "dom|", "dom|em", "dom|u", "dom|u"],
        pl: ["dom|y", "dom|ów", "dom|om", "dom|y", "dom|ami", "dom|ach", "dom|y"],
      },
    },
    {
      id: "stol", pl: "stół", gender: "m-inan", en: "table", uk: "стіл",
      note: "ó turns into o as soon as an ending is added, as in Ukrainian стіл → стола. ł softens to l before -e.",
      forms: {
        sg: ["stół|", "stoł|u", "stoł|owi", "stół|", "stoł|em", "stol|e", "stol|e"],
        pl: ["stoł|y", "stoł|ów", "stoł|om", "stoł|y", "stoł|ami", "stoł|ach", "stoł|y"],
      },
    },
    {
      id: "spacer", pl: "spacer", gender: "m-inan", en: "walk, stroll", uk: "прогулянка",
      note: "r softens to rz before the locative -e: {na spacerze}. Going for a walk is the accusative: {iść na spacer}.",
      forms: {
        sg: ["spacer|", "spacer|u", "spacer|owi", "spacer|", "spacer|em", "spacerz|e", "spacerz|e"],
        pl: ["spacer|y", "spacer|ów", "spacer|om", "spacer|y", "spacer|ami", "spacer|ach", "spacer|y"],
      },
    },
    {
      id: "klucz", pl: "klucz", gender: "m-inan", en: "key", uk: "ключ",
      note: "Genitive -a although it is a thing. cz counts as soft: locative -u, plural -e, genitive plural -y.",
      forms: {
        sg: ["klucz|", "klucz|a", "klucz|owi", "klucz|", "klucz|em", "klucz|u", "klucz|u"],
        pl: ["klucz|e", "klucz|y", "klucz|om", "klucz|e", "klucz|ami", "klucz|ach", "klucz|e"],
      },
    },
    {
      id: "kobieta", pl: "kobieta", gender: "f", en: "woman", uk: "жінка",
      note: "t softens to c in the dative and locative. The genitive plural has no ending at all.",
      forms: {
        sg: ["kobiet|a", "kobiet|y", "kobiec|ie", "kobiet|ę", "kobiet|ą", "kobiec|ie", "kobiet|o"],
        pl: ["kobiet|y", "kobiet|", "kobiet|om", "kobiet|y", "kobiet|ami", "kobiet|ach", "kobiet|y"],
      },
    },
    {
      id: "matka", pl: "matka", gender: "f", en: "mother", uk: "мати",
      note: "k changes to c before -e: {matce}. After k Polish writes -i, never -y. The genitive plural {matek} gets an extra e.",
      forms: {
        sg: ["matk|a", "matk|i", "matc|e", "matk|ę", "matk|ą", "matc|e", "matk|o"],
        pl: ["matk|i", "matek|", "matk|om", "matk|i", "matk|ami", "matk|ach", "matk|i"],
      },
    },
    {
      id: "polowa", pl: "połowa", gender: "f", en: "half", uk: "половина",
      note: "w softens before -ie: {w połowie}. In the genitive plural o turns into ó: {połów}.",
      forms: {
        sg: ["połow|a", "połow|y", "połow|ie", "połow|ę", "połow|ą", "połow|ie", "połow|o"],
        pl: ["połow|y", "połów|", "połow|om", "połow|y", "połow|ami", "połow|ach", "połow|y"],
      },
    },
    {
      id: "ulica", pl: "ulica", gender: "f", en: "street", uk: "вулиця",
      note: "c counts as soft: -y instead of -e in the dative and locative, plural -e.",
      forms: {
        sg: ["ulic|a", "ulic|y", "ulic|y", "ulic|ę", "ulic|ą", "ulic|y", "ulic|o"],
        pl: ["ulic|e", "ulic|", "ulic|om", "ulic|e", "ulic|ami", "ulic|ach", "ulic|e"],
      },
    },
    {
      id: "noc", pl: "noc", gender: "f", en: "night", uk: "ніч",
      note: "A feminine word without -a, like Ukrainian ніч. The accusative stays {noc}.",
      forms: {
        sg: ["noc|", "noc|y", "noc|y", "noc|", "noc|ą", "noc|y", "noc|y"],
        pl: ["noc|e", "noc|y", "noc|om", "noc|e", "noc|ami", "noc|ach", "noc|e"],
      },
    },
    {
      id: "watpliwosc", pl: "wątpliwość", gender: "f", en: "doubt", uk: "сумнів",
      note: "Like {noc}, but ć is written ci before a vowel: {wątpliwości}, {wątpliwością}. Mostly used in the plural: {Mam wątpliwości}.",
      forms: {
        sg: ["wątpliwość|", "wątpliwośc|i", "wątpliwośc|i", "wątpliwość|", "wątpliwośc|ią", "wątpliwośc|i", "wątpliwośc|i"],
        pl: ["wątpliwośc|i", "wątpliwośc|i", "wątpliwośc|iom", "wątpliwośc|i", "wątpliwośc|iami", "wątpliwośc|iach", "wątpliwośc|i"],
      },
    },
    {
      id: "okno", pl: "okno", gender: "n", en: "window", uk: "вікно",
      note: "Genitive plural {okien}: no ending and an extra ie, as in Ukrainian вікон.",
      forms: {
        sg: ["okn|o", "okn|a", "okn|u", "okn|o", "okn|em", "okn|ie", "okn|o"],
        pl: ["okn|a", "okien|", "okn|om", "okn|a", "okn|ami", "okn|ach", "okn|a"],
      },
    },
    {
      id: "miasto", pl: "miasto", gender: "n", en: "city, town", uk: "місто",
      note: "In the locative st softens to ść and a turns into e: {w mieście}.",
      forms: {
        sg: ["miast|o", "miast|a", "miast|u", "miast|o", "miast|em", "mieśc|ie", "miast|o"],
        pl: ["miast|a", "miast|", "miast|om", "miast|a", "miast|ami", "miast|ach", "miast|a"],
      },
    },
    {
      id: "morze", pl: "morze", gender: "n", en: "sea", uk: "море",
      note: "rz counts as soft: locative -u ({w morzu}). Genitive plural {mórz}: o turns into ó.",
      forms: {
        sg: ["morz|e", "morz|a", "morz|u", "morz|e", "morz|em", "morz|u", "morz|e"],
        pl: ["morz|a", "mórz|", "morz|om", "morz|a", "morz|ami", "morz|ach", "morz|a"],
      },
    },
  ];

  var adjectives = [
    {
      id: "dobry", pl: "dobry", en: "good", uk: "добрий",
      note: "The usual pattern. Masculine accusative: {dobrego} for people and animals, {dobry} for things. In the men's plural r softens to rz: {dobrzy}.",
      forms: {
        mAnim: ["dobr|y", "dobr|ego", "dobr|emu", "dobr|ego", "dobr|ym", "dobr|ym", "dobr|y"],
        mInan: ["dobr|y", "dobr|ego", "dobr|emu", "dobr|y", "dobr|ym", "dobr|ym", "dobr|y"],
        f: ["dobr|a", "dobr|ej", "dobr|ej", "dobr|ą", "dobr|ą", "dobr|ej", "dobr|a"],
        n: ["dobr|e", "dobr|ego", "dobr|emu", "dobr|e", "dobr|ym", "dobr|ym", "dobr|e"],
        plMen: ["dobrz|y", "dobr|ych", "dobr|ym", "dobr|ych", "dobr|ymi", "dobr|ych", "dobrz|y"],
        plOther: ["dobr|e", "dobr|ych", "dobr|ym", "dobr|e", "dobr|ymi", "dobr|ych", "dobr|e"],
      },
    },
    {
      id: "polski", pl: "polski", en: "Polish", uk: "польський",
      note: "After k and g every y becomes i and every e becomes ie: {polskiego}, {polskie}. In the men's plural sk turns into sc: {polscy}.",
      forms: {
        mAnim: ["polsk|i", "polsk|iego", "polsk|iemu", "polsk|iego", "polsk|im", "polsk|im", "polsk|i"],
        mInan: ["polsk|i", "polsk|iego", "polsk|iemu", "polsk|i", "polsk|im", "polsk|im", "polsk|i"],
        f: ["polsk|a", "polsk|iej", "polsk|iej", "polsk|ą", "polsk|ą", "polsk|iej", "polsk|a"],
        n: ["polsk|ie", "polsk|iego", "polsk|iemu", "polsk|ie", "polsk|im", "polsk|im", "polsk|ie"],
        plMen: ["polsc|y", "polsk|ich", "polsk|im", "polsk|ich", "polsk|imi", "polsk|ich", "polsc|y"],
        plOther: ["polsk|ie", "polsk|ich", "polsk|im", "polsk|ie", "polsk|imi", "polsk|ich", "polsk|ie"],
      },
    },
  ];

  var pronouns = [
    { id: "ja", pl: "ja", en: "I", uk: "я", forms: ["ja", "mnie", "mnie / mi", "mnie", "mną", "mnie", null] },
    { id: "ty", pl: "ty", en: "you", uk: "ти", forms: ["ty", "ciebie / cię", "tobie / ci", "ciebie / cię", "tobą", "tobie", "ty"] },
    { id: "on", pl: "on", en: "he", uk: "він", forms: ["on", "jego / go / niego", "jemu / mu / niemu", "jego / go / niego", "nim", "nim", null] },
    { id: "ona", pl: "ona", en: "she", uk: "вона", forms: ["ona", "jej / niej", "jej / niej", "ją / nią", "nią", "niej", null] },
    { id: "ono", pl: "ono", en: "it", uk: "воно", forms: ["ono", "jego / go / niego", "jemu / mu / niemu", "je / nie", "nim", "nim", null] },
    { id: "my", pl: "my", en: "we", uk: "ми", forms: ["my", "nas", "nam", "nas", "nami", "nas", null] },
    { id: "wy", pl: "wy", en: "you (all)", uk: "ви", forms: ["wy", "was", "wam", "was", "wami", "was", "wy"] },
    { id: "oni", pl: "oni", en: "they (with men)", uk: "вони", forms: ["oni", "ich / nich", "im / nim", "ich / nich", "nimi", "nich", null] },
    { id: "one", pl: "one", en: "they (no men)", uk: "вони", forms: ["one", "ich / nich", "im / nim", "je / nie", "nimi", "nich", null] },
    { id: "kto", pl: "kto", en: "who", uk: "хто", forms: ["kto", "kogo", "komu", "kogo", "kim", "kim", null] },
    { id: "co", pl: "co", en: "what", uk: "що", forms: ["co", "czego", "czemu", "co", "czym", "czym", null] },
    { id: "ten", pl: "ten", en: "this (masculine)", uk: "цей", forms: ["ten", "tego", "temu", "tego / ten", "tym", "tym", null] },
    { id: "ta", pl: "ta", en: "this (feminine)", uk: "ця", forms: ["ta", "tej", "tej", "tę", "tą", "tej", null] },
    { id: "to", pl: "to", en: "this (neuter)", uk: "це", forms: ["to", "tego", "temu", "to", "tym", "tym", null] },
  ];

  var pronounNotes = [
    "The short forms ({mi}, {ci}, {go}, {mu}) are the usual ones in the middle of a sentence: {Daj mi to}. The long forms ({mnie}, {tobie}, {jego}) go at the start of a sentence or carry emphasis: {Tobie to daję, nie jemu}.",
    "After a preposition he, she, it and they start with n: {do niego}, {z nią}, {o nich}, {dla niej}.",
    "{Ten} in the masculine accusative is {tego} for people and animals and {ten} for things: {widzę tego psa}, {widzę ten dom}.",
  ];

  window.POLISH_CASES = {
    CASE_ORDER: CASE_ORDER,
    genders: genders,
    cases: cases,
    nouns: nouns,
    adjectives: adjectives,
    pronouns: pronouns,
    pronounNotes: pronounNotes,
  };
})();
