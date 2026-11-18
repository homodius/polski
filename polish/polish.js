// Words and Flashcards pages: a searchable vocabulary list (words/) and a flashcard trainer
// (flashcards/) over the same words, narrowed by the same topic, Words and Practise menus.
// Each part runs only on the page that has its markup.
(function () {
  var SRS = window.PolishSRS;
  var Ratings = window.PolishRatings;
  var P = window.PolishPage;
  var NEW_PER_SESSION = 10;
  var STORAGE_KEY = "polish.progress.v1";
  var SHUFFLE_KEY = "polish.shuffle";
  var SET_KEY = "polish.set";

  var EXAMPLES = window.POLISH_EXAMPLES || {};
  var WORDS = window.POLISH_VOCAB.map(function (w) {
    return Object.assign({ id: SRS.cardId(w.pl), example: EXAMPLES[w.pl] }, w);
  });

  function $(id) { return document.getElementById(id); }

  var node = P.node;
  var speakButtons = P.speakButtons;
  var sayGenerated = P.sayGenerated;
  var sayRecorded = P.sayRecorded;
  var listenLink = P.listenLink;
  var mineBadge = P.mineBadge;
  var exampleLine = P.exampleLine;
  var markNoRecording = P.markNoRecording;

  // ---------- Vocabulary ----------

  var search = $("vocab-search");
  var list = $("vocab-rows");
  var count = $("vocab-count");

  // ---------- Word sets and topics ----------
  // The Words menu shows all words or only the ones D added (topic "my words"). The topic menu
  // can pick several topics; none picked means every topic. D's words have no topic of their
  // own, so the topic menu leaves them out and is off while only D's words are shown.
  var setSelect = $("word-set");
  var MY_TOPIC = "my words";
  var topicButton = $("topic-button");
  var topicMenu = $("topic-menu");
  var topicBoxes = [];

  function isMine(w) { return w.topic === MY_TOPIC; }
  function onlyMine() { return setSelect.value === "mine"; }

  function chosenTopics() {
    return topicBoxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
  }

  function inSet(w) { return !onlyMine() || isMine(w); }

  // In the chosen set and, unless only D's words are shown, in one of the chosen topics.
  function inScope(w) {
    if (onlyMine()) return isMine(w);
    var topics = chosenTopics();
    return !topics.length || topics.indexOf(w.topic) !== -1;
  }

  // ---------- Practice sets ----------
  // Words D marked hard, normal or easy, or picked by hand (ratings.js). The Practice menu
  // narrows both the list and the flashcards, on top of the Words and topic menus.
  var practiceSelect = $("practice-set");

  function wordId(w) { return w.pl; }
  function practiceSet() { return practiceSelect.value || "all"; }

  function fillPracticeSets() {
    Ratings.fillSelect(practiceSelect, WORDS.filter(inScope), "word", wordId);
  }

  function inFilters(w) {
    return inScope(w) && (practiceSet() === "all" || Ratings.filter([w], "word", practiceSet(), wordId).length === 1);
  }

  try {
    var savedSet = localStorage.getItem(SET_KEY);
    if (savedSet && setSelect.querySelector('option[value="' + savedSet + '"]')) setSelect.value = savedSet;
  } catch (e) { /* storage blocked */ }

  var topicNames = [];
  WORDS.forEach(function (w) {
    if (!isMine(w) && topicNames.indexOf(w.topic) === -1) topicNames.push(w.topic);
  });
  topicNames.forEach(function (t) {
    var label = node("label", "pl-check pl-topic-option");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.value = t;
    label.appendChild(box);
    label.appendChild(document.createTextNode(" " + t));
    $("topic-options").appendChild(label);
    topicBoxes.push(box);
  });

  function showTopicLabel() {
    var topics = chosenTopics();
    topicButton.disabled = onlyMine();
    if (onlyMine()) setTopicMenu(false);
    topicButton.textContent = onlyMine() || !topics.length ? "All topics"
      : topics.length <= 2 ? topics.join(", ") : topics.length + " topics";
    $("topic-clear").hidden = !topics.length;
  }

  function setTopicMenu(open) {
    topicMenu.hidden = !open;
    topicButton.setAttribute("aria-expanded", open ? "true" : "false");
  }

  topicButton.addEventListener("click", function () { setTopicMenu(topicMenu.hidden); });
  document.addEventListener("click", function (e) {
    if (!topicMenu.hidden && !$("topic-picker").contains(e.target)) setTopicMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !topicMenu.hidden) {
      setTopicMenu(false);
      topicButton.focus();
    }
  });

  WORDS.forEach(function (w) {
    w.haystack = SRS.fold([w.pl, w.en, w.uk, w.note || ""].join(" "));
  });

  // The list shows words in Polish alphabetical order (a, ą, b, c, ć, …), whatever their order
  // in vocab.js. Flashcards keep their own order.
  var collator = window.Intl ? new Intl.Collator("pl", { sensitivity: "base" }) : null;
  var SORTED = WORDS.slice().sort(function (a, b) {
    return collator ? collator.compare(a.pl, b.pl) : a.pl.localeCompare(b.pl);
  });


  // The letters of the Polish alphabet, for jumping down the list.
  var LETTERS = "a ą b c ć d e ę f g h i j k l ł m n ń o ó p r s ś t u w y z ź ż".split(" ");
  var letters = $("vocab-letters");

  function firstLetter(w) { return w.pl.trim().charAt(0).toLocaleLowerCase("pl"); }

  // One button per letter; it scrolls to the first word shown that starts with that letter,
  // and is off when no word shown does.
  function renderLetters(firstRows) {
    letters.textContent = "";
    LETTERS.forEach(function (l) {
      var b = node("button", "pl-letter", l.toLocaleUpperCase("pl"));
      b.type = "button";
      var row = firstRows[l];
      b.disabled = !row;
      if (row) {
        b.title = "Go to " + row.dataset.pl;
        b.addEventListener("click", function () {
          row.scrollIntoView({ behavior: "smooth", block: "start" });
          row.classList.remove("pl-flash");
          void row.offsetWidth;
          row.classList.add("pl-flash");
        });
      }
      letters.appendChild(b);
    });
  }

  function renderVocab() {
    if (!list) return;
    var q = SRS.fold(search.value.trim());
    var inThisSet = SORTED.filter(inSet);
    var shown = inThisSet.filter(function (w) {
      return inFilters(w) && (!q || w.haystack.indexOf(q) !== -1);
    });
    var firstRows = {};

    list.textContent = "";
    shown.forEach(function (w) {
      var li = node("li", "pl-word");
      li.dataset.pl = w.pl;
      var letter = firstLetter(w);
      if (!firstRows[letter]) firstRows[letter] = li;
      li.appendChild(speakButtons(w.pl));

      var pl = node("span", "pl-word-pl", w.pl);
      pl.lang = "pl";
      if (isMine(w)) pl.appendChild(mineBadge());
      li.appendChild(pl);
      li.appendChild(node("span", "pl-word-topic", w.topic));

      var meaning = node("span", "pl-word-meaning", w.en);
      var uk = node("span", "", " · " + w.uk);
      uk.lang = "uk";
      meaning.appendChild(uk);
      meaning.appendChild(document.createTextNode(" · "));
      var link = listenLink(w.pl);
      var a = node("a", "", "listen on " + link.label);
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener";
      meaning.appendChild(a);
      li.appendChild(meaning);

      if (w.note) li.appendChild(P.noteText(w.note, "pl-word-note"));
      if (w.example) li.appendChild(exampleLine(w.example));
      li.appendChild(Ratings.control(document, "word", w.pl));
      list.appendChild(li);
    });

    count.textContent = shown.length === inThisSet.length
      ? inThisSet.length + " words"
      : shown.length + " of " + inThisSet.length + " words";
    $("vocab-empty").hidden = shown.length > 0;
    renderLetters(firstRows);
  }

  if (search) search.addEventListener("input", renderVocab);
  showTopicLabel();
  fillPracticeSets();
  renderVocab();


  // ---------- Flashcards ----------

  function loadProgress() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) { /* storage blocked */ }
  }

  var el = {
    card: $("fc-card"), front: $("fc-front"), back: $("fc-back"), en: $("fc-en"), uk: $("fc-uk"),
    note: $("fc-note"), topic: $("fc-topic"), reveal: $("fc-reveal"), grades: $("fc-grades"),
    speak: $("fc-speak"), record: $("fc-record"), done: $("fc-done"), more: $("fc-more"), stats: $("fc-stats"),
    reset: $("fc-reset"), shuffle: $("fc-shuffle"), nextWord: $("fc-next"),
    mine: $("fc-mine"),
    mineText: $("fc-mine-text"), example: $("fc-example"),
    doneText: $("fc-done-text"),
    rate: Ratings.control(document, "word", ""),
  };
  var hasCards = !!el.card; // only the Flashcards page has the card
  if (hasCards) $("fc-rate").appendChild(el.rate);

  var progress = loadProgress();
  var queue = [];
  var current = null;
  var revealed = false;

  function deckCards() {
    return WORDS.filter(inFilters);
  }

  // Tells the word quiz (words-quiz.js) that the topic, Words or Practise menu changed.
  function announceFilters() {
    window.dispatchEvent(new CustomEvent("polish:filters"));
  }

  function filtersChanged() {
    showTopicLabel();
    fillPracticeSets();
    renderVocab();
    startSession();
    announceFilters();
  }

  setSelect.addEventListener("change", function () {
    try { localStorage.setItem(SET_KEY, setSelect.value); } catch (e) { /* storage blocked */ }
    filtersChanged();
  });
  topicBoxes.forEach(function (b) { b.addEventListener("change", filtersChanged); });
  practiceSelect.addEventListener("change", function () {
    Ratings.saveSet(practiceSelect.value);
    renderVocab();
    startSession();
    announceFilters();
  });
  // Marking a word only refreshes the menu's numbers: the list and the session in progress
  // stay as they are, so a word doesn't vanish from under the finger.
  window.addEventListener("polish:ratings", function (e) {
    if (e.detail.kind === "word") fillPracticeSets();
  });
  $("topic-clear").addEventListener("click", function () {
    topicBoxes.forEach(function (b) { b.checked = false; });
    filtersChanged();
  });

  if (hasCards) try { el.shuffle.checked = localStorage.getItem(SHUFFLE_KEY) !== "off"; } catch (e) { /* default on */ }

  // With shuffle on, new words are drawn at random from the deck and the session order is mixed.
  // Practising a chosen set (hard, easy, picked…) goes through every word in it, due or not.
  function startSession() {
    if (!hasCards) return;
    var cards = deckCards();
    if (el.shuffle.checked) cards = SRS.shuffle(cards);
    queue = practiceSet() === "all" ? SRS.buildQueue(cards, progress, Date.now(), NEW_PER_SESSION) : cards;
    if (el.shuffle.checked) queue = SRS.shuffle(queue);
    next();
  }

  function next() {
    current = queue.shift() || null;
    revealed = false;
    renderCard();
  }

  function renderCard() {
    var s = SRS.stats(deckCards(), progress, Date.now());
    el.stats.textContent = (queue.length + (current ? 1 : 0)) + " left in this session · " +
      s.learned + " learned · " + s.unseen + " not seen yet";

    el.card.hidden = !current;
    el.done.hidden = !!current;
    if (!current) {
      var wholeSet = practiceSet() !== "all";
      el.doneText.textContent = !wholeSet ? "Nothing left to review right now. Come back later for the cards that are due."
        : s.total ? "You went through every word in this set."
        : "No words in this set yet. Mark words as hard, normal or easy, or pick them, in the list or on a card.";
      el.more.textContent = wholeSet ? "Go through this set again" : "Learn 10 new words";
      el.more.hidden = wholeSet ? s.total === 0 : s.unseen === 0;
      return;
    }
    el.rate.update("word", current.pl);
    var mine = isMine(current);
    el.front.textContent = current.pl;
    showCardRecording(current);
    el.en.textContent = current.en;
    el.uk.textContent = current.uk;
    el.note.textContent = "";
    if (current.note) el.note.appendChild(P.noteText(current.note));
    el.example.textContent = "";
    if (current.example) el.example.appendChild(exampleLine(current.example));
    // The corner badge already says "My word", so D's words show no topic line.
    el.topic.textContent = mine ? "" : current.topic;
    el.mine.classList.toggle("is-mine", mine);
    el.mineText.textContent = mine ? "My word" : "Not my word";
    el.mine.title = mine ? "A word you added" : "Not one of the words you added";
    el.back.hidden = !revealed;
    el.reveal.hidden = revealed;
    el.grades.hidden = !revealed;
  }

  // The Recording button stays off while Commons is checked, and stays off if it has none.
  function showCardRecording(card) {
    setCardRecording(false, "Looking for a recording…");
    if (!("fetch" in window)) return setCardRecording(false, "No recording of this one yet");
    P.findRecording(card.pl).then(function (url) {
      if (current !== card) return;
      if (url) {
        setCardRecording(true, "Native speaker recording (R)");
        if (P.hasAudioContext()) P.decodeRecording(url).catch(function () { /* played another way on tap */ });
      } else if (P.hasNoRecording(card.pl)) {
        setCardRecording(false, "No recording of this one yet");
      } else {
        setCardRecording(true, "Native speaker recording (R)"); // lookup failed: a tap tries again
      }
    });
  }

  function setCardRecording(on, title) {
    el.record.disabled = !on;
    el.record.title = title;
  }

  function reveal() {
    if (!current || revealed) return;
    revealed = true;
    renderCard();
    sayGenerated(current.pl);
  }

  // Next word leaves the card's schedule untouched: a new word stays new, a due word stays due.
  function nextWord() {
    if (!current) return;
    next();
  }

  function grade(g) {
    if (!current || !revealed) return;
    progress[current.id] = SRS.schedule(progress[current.id], g, Date.now());
    saveProgress();
    if (g === "again") queue.push(current); // a missed card comes back in this session
    next();
  }

  function playCardRecording() {
    if (!current || el.record.disabled) return;
    sayRecorded(current.pl).then(function (played) { if (!played) markNoRecording(el.record); });
  }

  if (hasCards) {
    el.reveal.addEventListener("click", reveal);
    el.nextWord.addEventListener("click", nextWord);
    el.speak.addEventListener("click", function () { if (current) sayGenerated(current.pl, true); });
    el.record.addEventListener("click", playCardRecording);
    el.more.addEventListener("click", startSession);
    el.shuffle.addEventListener("change", function () {
      try { localStorage.setItem(SHUFFLE_KEY, el.shuffle.checked ? "on" : "off"); } catch (e) { /* storage blocked */ }
      startSession();
    });
    el.grades.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b && b.dataset.grade) grade(b.dataset.grade);
    });
    el.reset.addEventListener("click", function () {
      if (!confirm("Forget all flashcard progress and start over?")) return;
      progress = {};
      saveProgress();
      startSession();
    });

    // Keyboard shortcuts while the flashcards (not the word quiz) are open and you're not typing.
    document.addEventListener("keydown", function (e) {
      if ($("fc-cards-view").hidden) return;
      var t = e.target;
      if ((t instanceof HTMLInputElement && t.type !== "checkbox") || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) return;
      // A focused card button already acts on Space/Enter by itself.
      if (t instanceof HTMLButtonElement && el.card.contains(t) && (e.key === " " || e.key === "Enter")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        reveal();
      } else if (["1", "2", "3", "4"].indexOf(e.key) !== -1) {
        grade(SRS.GRADES[Number(e.key) - 1]);
      } else if (e.key.toLowerCase() === "s" && current) {
        sayGenerated(current.pl, true);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") {
        nextWord();
      } else if (e.key.toLowerCase() === "r" && current) {
        playCardRecording();
      }
    });

    startSession();
  }

  // For the word quiz (words-quiz.js): every word, and the words the menus above select.
  Object.assign(window.PolishPage, {
    allWords: WORDS,
    words: deckCards,
    isMine: isMine,
  });
})();
