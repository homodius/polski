// Shared by every Polish page: hearing words (generated voice and native recordings) and the
// small building blocks pages use to show them. Exposes window.PolishPage, also as
// window.PolishAudio. It needs nothing else on the page. Site rule: every Polish word or
// sentence can be heard, so pages mark their Polish with lang="pl" and tapping it says it:
//
//   PolishPage.say(text, explicit, rate)  say text with the generated voice (rate < 1 is slower)
//   PolishPage.speakButtons(text)         a speaker + recording button pair for a word
//   PolishPage.sayable(el, text)          mark el as Polish, so tapping it says it (or text)
//   PolishPage.noteText(text, className)  English text with "quoted" or {braced} Polish made tappable
//   PolishPage.ruleBox(rule)              the rule shown after a wrong quiz answer, {en, uk}
//   PolishPage.whoLine(who)               quiz chips: singular / plural, gender, and the Polish pronoun
//   PolishPage.contextLine(pl, en)        a Polish sentence that sets the scene before a quiz sentence
(function () {
  function $(id) { return document.getElementById(id); }

  // ---------- Listening ----------

  var canSpeak = "speechSynthesis" in window;

  var VOICE_KEY = "polish.voice";
  // The Voice menu, shown only when the device has more than one Polish voice. A page can place
  // it with <label id="voice-row">; otherwise it goes under the page's heading, Polish menu and Learn / Quiz switch.
  if (!$("voice")) {
    var voiceRow = document.createElement("label");
    voiceRow.id = "voice-row";
    voiceRow.className = "pl-voice pl-small pl-muted";
    voiceRow.hidden = true;
    voiceRow.innerHTML = 'Voice <select id="voice" class="pl-input"></select>';
    var after = document.querySelector(".pl-variants") || document.querySelector(".pl-section-nav") || document.querySelector(".pl-title");
    if (after) after.insertAdjacentElement("afterend", voiceRow);
    else document.body.appendChild(voiceRow);
  }
  var voiceSelect = $("voice");

  function polishVoices() {
    return speechSynthesis.getVoices().filter(function (v) { return v.lang.toLowerCase().indexOf("pl") === 0; });
  }

  // Prefer the voice picked on the page, then one built into the device: streamed online
  // voices tend to end with a click.
  function defaultVoice(voices) {
    return voices.find(function (v) { return v.localService; }) || voices[0] || null;
  }

  function pickVoice() {
    var voices = polishVoices();
    var chosen = voiceSelect.value;
    return voices.find(function (v) { return v.name === chosen; }) || defaultVoice(voices);
  }

  function fillVoices() {
    var voices = polishVoices();
    var saved = null;
    try { saved = localStorage.getItem(VOICE_KEY); } catch (e) { /* storage blocked */ }
    voiceSelect.textContent = "";
    voices.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v.name;
      o.textContent = v.name + (v.localService ? "" : " (online)");
      voiceSelect.appendChild(o);
    });
    var best = voices.find(function (v) { return v.name === saved; }) || defaultVoice(voices);
    if (best) voiceSelect.value = best.name;
    $("voice-row").hidden = voices.length < 2;
  }

  // The click comes about a quarter of a second after the word ends, at the same loudness
  // whatever the speech volume: it is the device switching its audio output off. Playing an
  // inaudible signal through Web Audio keeps the output on while the page is open.
  var audioCtx = null;

  function keepAudioAwake() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) {
      try {
        audioCtx = new Ctx();
        var source = audioCtx.createConstantSource ? audioCtx.createConstantSource() : audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        gain.gain.value = 0.0001; // about -80 dB: silent, but not optimised away as digital silence
        source.connect(gain);
        gain.connect(audioCtx.destination);
        source.start();
      } catch (e) {
        audioCtx = null;
        return;
      }
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  document.addEventListener("visibilitychange", function () {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend();
    else audioCtx.resume();
  });

  var lastUtterance = null;

  // ---------- Native recordings ----------
  // Recordings by native speakers from Lingua Libre, hosted on Wikimedia Commons as
  // "File:LL-Q809 (pol)-<speaker>-<word>.wav". Played as audio files they avoid the click
  // that phones make after their built-in voice finishes. Lookups are cached in the browser.

  var AUDIO_KEY = "polish.audio.v1";
  var audioCache = {};
  try { audioCache = JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}") || {}; } catch (e) { audioCache = {}; }
  var lookups = {};
  var player = null;

  function recordingKey(text) {
    return text.replace(/[?.!,…]+/g, "").trim().toLowerCase();
  }

  // Resolves to a recording URL, or "" when Commons has none for this word.
  function findRecording(text) {
    var key = recordingKey(text);
    if (key in audioCache) return Promise.resolve(audioCache[key]);
    if (lookups[key]) return lookups[key];
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
      "&generator=search&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url" +
      "&gsrsearch=" + encodeURIComponent('intitle:"LL-Q809 (pol)" intitle:"' + key + '"');
    lookups[key] = fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var pages = (data.query && data.query.pages) || {};
        var suffix = "-" + key + ".wav";
        var found = "";
        Object.keys(pages).some(function (id) {
          var page = pages[id];
          var title = page.title.normalize("NFC").toLowerCase();
          if (title.indexOf("file:ll-q809 (pol)-") === 0 && title.slice(-suffix.length) === suffix.normalize("NFC") &&
            page.imageinfo && page.imageinfo[0]) {
            found = page.imageinfo[0].url;
            return true;
          }
          return false;
        });
        audioCache[key] = found;
        try { localStorage.setItem(AUDIO_KEY, JSON.stringify(audioCache)); } catch (e) { /* storage blocked */ }
        return found;
      })
      .catch(function () {
        delete lookups[key]; // network trouble: try again next time
        return "";
      });
    return lookups[key];
  }

  // A 10 ms silent WAV, played inside the first tap so phones allow later playback from
  // code that runs after the lookup finishes.
  var SILENCE = (function () {
    var n = 441;
    var bytes = new Uint8Array(44 + n * 2);
    var v = new DataView(bytes.buffer);
    function str(o, t) { for (var i = 0; i < t.length; i++) bytes[o + i] = t.charCodeAt(i); }
    str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVEfmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, n * 2, true);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return "data:audio/wav;base64," + btoa(bin);
  })();

  function unlockPlayer() {
    if (player) return;
    player = new Audio();
    player.preload = "auto";
    player.src = SILENCE;
    var p = player.play();
    if (p && p.catch) p.catch(function () { /* not allowed yet; real playback will retry */ });
  }

  // Recordings are played through Web Audio with a short fade in and out: many of them start
  // or stop mid-waveform, and computers play that edge as a click. Decoded sounds are kept
  // for the visit, so a second tap plays at once.
  var FADE = 0.03;
  var decoded = {};
  var playing = null; // the recording sound now playing

  function decodeRecording(url) {
    if (decoded[url]) return decoded[url];
    decoded[url] = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then(function (data) {
        // Callback form: older Safari has no promise version of decodeAudioData.
        return new Promise(function (resolve, reject) { audioCtx.decodeAudioData(data, resolve, reject); });
      });
    decoded[url].catch(function () { delete decoded[url]; });
    return decoded[url];
  }

  // Many recordings are very quiet. Scale each one so its loudest moment reaches 90% of full
  // volume, but boost by no more than 8x so a near-silent file doesn't turn into hiss.
  function loudness(buffer) {
    if (buffer.gainForPeak) return buffer.gainForPeak;
    var peak = 0;
    for (var c = 0; c < buffer.numberOfChannels; c++) {
      var data = buffer.getChannelData(c);
      for (var i = 0; i < data.length; i++) {
        var v = data[i] < 0 ? -data[i] : data[i];
        if (v > peak) peak = v;
      }
    }
    buffer.gainForPeak = peak ? Math.min(8, 0.9 / peak) : 1;
    return buffer.gainForPeak;
  }

  function playBuffer(buffer) {
    if (playing) {
      try { playing.stop(); } catch (e) { /* already stopped */ }
    }
    var t = audioCtx.currentTime + 0.01;
    var end = t + buffer.duration;
    var level = loudness(buffer);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + FADE);
    gain.gain.setValueAtTime(level, Math.max(t + FADE, end - FADE));
    gain.gain.linearRampToValueAtTime(0, end);
    var src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(t);
    src.stop(end);
    playing = src;
  }

  function playWithElement(url, text, explicit, rate) {
    if (!player) player = new Audio();
    player.pause();
    player.src = url;
    player.volume = 1;
    player.playbackRate = rate || 1;
    var p = player.play();
    if (p && p.catch) p.catch(function () { speakWithVoice(text, explicit, false, rate); });
  }

  function playRecording(url, text, explicit) {
    if (!audioCtx) {
      playWithElement(url, text, explicit);
      return;
    }
    decodeRecording(url).then(playBuffer, function () { playWithElement(url, text, explicit); });
  }

  // Look up a word's recording ahead of time, so tapping plays it straight away.
  function prefetch(text) {
    if (!("fetch" in window)) return;
    findRecording(text).then(function (url) {
      if (url && audioCtx) decodeRecording(url).catch(function () { /* played another way on tap */ });
    });
  }

  // Firefox's built-in voices end every word with a click, while played audio files are clean,
  // so there words without a recording play Google Translate's speech audio instead.
  var voiceClicks = /Firefox\//.test(navigator.userAgent);

  function speechAudioUrl(text) {
    return "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pl&q=" + encodeURIComponent(text);
  }

  function sayWithoutRecording(text, explicit, rate) {
    if (voiceClicks) playWithElement(speechAudioUrl(text), text, explicit, rate);
    else speakWithVoice(text, explicit, false, rate);
  }

  // Two ways to hear a word: "generated" speech, which is clear and loud, and a "recorded"
  // native speaker, which sounds natural but is missing for many words and phrases.
  // `explicit` is true when the visitor pressed a button; `rate` below 1 says it slower.
  function sayGenerated(text, explicit, rate) {
    keepAudioAwake();
    // Only needed when Web Audio is missing: starting a second audio stream can itself click.
    if (!audioCtx) unlockPlayer();
    sayWithoutRecording(text, explicit, rate);
  }

  // Resolves to true when a recording was played, false when there is none.
  function sayRecorded(text) {
    keepAudioAwake();
    if (!audioCtx) unlockPlayer();
    if (!("fetch" in window)) return Promise.resolve(false);
    return findRecording(text).then(function (url) {
      if (url) playRecording(url, text, true);
      return !!url;
    });
  }

  function hasNoRecording(text) {
    return audioCache[recordingKey(text)] === "";
  }

  function markNoRecording(button) {
    button.disabled = true;
    button.title = "No recording of this one yet";
  }


  // The device's built-in text-to-speech, used when no recording exists. If the device has no
  // Polish voice at all, a speaker tap opens the listen link instead of staying silent.
  function speakWithVoice(text, explicit, retried, rate) {
    if (!canSpeak) {
      if (explicit) window.open(listenLink(text).href, "_blank", "noopener");
      return;
    }
    var voice = pickVoice();
    if (!voice && !speechSynthesis.getVoices().length && !retried) {
      // Desktop browsers load their voice list late. Speaking before it arrives makes them
      // read the Polish with their default (often English) voice, so wait for it once.
      var done = false;
      var retry = function () {
        if (done) return;
        done = true;
        speechSynthesis.removeEventListener("voiceschanged", retry);
        speakWithVoice(text, explicit, true, rate);
      };
      speechSynthesis.addEventListener("voiceschanged", retry);
      setTimeout(retry, 3000);
      return;
    }
    if (!voice && speechSynthesis.getVoices().length) {
      // No Polish voice on this device: any other voice would read the word in its own
      // language. Open the listen link instead.
      if (explicit) window.open(listenLink(text).href, "_blank", "noopener");
      return;
    }
    keepAudioAwake();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    if (voice) u.voice = voice;
    // Full volume makes some voices clip at the end; slightly lower avoids the pop.
    u.volume = 0.8;
    u.rate = rate || 1;
    // Cancelling an idle synthesizer pops on some voices and makes iOS Safari drop the
    // next utterance, so only stop speech that is actually playing.
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    // Android Chrome can be left paused after the page was in the background.
    if (speechSynthesis.paused) speechSynthesis.resume();
    // Chrome can garbage-collect an utterance mid-speech; keep a reference until it ends.
    lastUtterance = u;
    speechSynthesis.speak(u);
  }

  if (canSpeak) {
    fillVoices();
    speechSynthesis.addEventListener("voiceschanged", fillVoices);
    voiceSelect.addEventListener("change", function () {
      try { localStorage.setItem(VOICE_KEY, voiceSelect.value); } catch (e) { /* storage blocked */ }
    });
  }

  // Native-speaker recordings for single words on Forvo; Google Translate reads whole phrases.
  function listenLink(pl) {
    var text = pl.replace(/[?.!…]+$/, "");
    if (text.indexOf(" ") === -1) {
      return { href: "https://forvo.com/word/" + encodeURIComponent(text.toLowerCase()) + "/#pl", label: "Forvo" };
    }
    return {
      href: "https://translate.google.com/?sl=pl&tl=en&op=translate&text=" + encodeURIComponent(pl),
      label: "Translate",
    };
  }

  var SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/>' +
    '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';

  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/>' +
    '<path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>';

  function iconButton(icon, title, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pl-speak";
    b.title = title;
    b.setAttribute("aria-label", label);
    b.innerHTML = icon;
    return b;
  }

  function speakButtons(text) {
    var box = node("span", "pl-speaks");
    var gen = iconButton(SPEAKER, "Generated voice", "Say " + text);
    gen.addEventListener("click", function () { sayGenerated(text, true); });
    var rec = iconButton(MIC, "Native speaker recording", "Play a recording of " + text);
    if (hasNoRecording(text)) markNoRecording(rec);
    rec.addEventListener("pointerdown", function () { prefetch(text); });
    rec.addEventListener("click", function () {
      sayRecorded(text).then(function (played) { if (!played) markNoRecording(rec); });
    });
    box.appendChild(gen);
    box.appendChild(rec);
    return box;
  }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  }

  // ---------- Tap to hear ----------
  // Every Polish word or sentence on the page can be heard: tapping any element marked
  // lang="pl" says its text with the generated voice. data-say="other text" says something
  // else (say "kobieta" for "ko-BIE-ta"); data-say="off" keeps an element quiet, as the letter
  // quiz does until the question is answered. Links and buttons inside keep their own job.

  function sayable(el, text) {
    el.lang = "pl";
    if (text) el.dataset.say = text;
    return el;
  }

  function sayElement(el) {
    var text = el.dataset.say || el.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;
    sayGenerated(text, true);
    el.classList.remove("pl-saying");
    void el.offsetWidth;
    el.classList.add("pl-saying");
  }

  function sayTarget(target) {
    var el = target.closest && target.closest('[lang="pl"]');
    if (!el || el.dataset.say === "off") return null;
    if (target.closest("a, button, input, select, textarea, label")) return null;
    return el;
  }

  document.addEventListener("click", function (e) {
    var el = sayTarget(e.target);
    if (!el) return;
    // Selecting a word to copy it shouldn't read it out.
    var picked = window.getSelection ? String(window.getSelection()) : "";
    if (picked && el.contains(window.getSelection().anchorNode)) return;
    sayElement(el);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target instanceof Element && e.target.getAttribute("lang") === "pl" ? sayTarget(e.target) : null;
    if (!el || el !== e.target) return;
    e.preventDefault();
    sayElement(el);
  });

  // Polish inside English text, as in notes: "Plural \"lata\": \"dwa lata\" = two years."
  // Text in straight double quotes is Polish, unless it has Cyrillic in it (Ukrainian); write
  // other languages in curly quotes (“bon”). {braces} mark Polish without quotes: {ząb} = zomp.
  // A sentence that compares with Ukrainian or Russian (Cyrillic, or names the language) is put in
  // .pl-uk-only, so it is hidden while Show Ukrainian is off. A note that is all comparison is
  // hidden whole (the returned box gets .pl-uk-only too).
  var UK_SENTENCE = /[\u0400-\u04FF]|\b(Ukrainian|Russian)\b/;
  function noteText(text, className) {
    var sentences = String(text).split(/(?<=[.!?])\s+(?=[A-Z{"\u201c(\u0400-\u04FF])/);
    var box = node("span", className);
    var hidden = 0;
    sentences.forEach(function (one, i) {
      var part = notePart(one + (i < sentences.length - 1 ? " " : ""));
      if (UK_SENTENCE.test(one)) {
        part.className = "pl-uk-only";
        hidden++;
      }
      while (part.firstChild && !part.className) box.appendChild(part.firstChild);
      if (part.className) box.appendChild(part);
    });
    if (hidden === sentences.length) box.classList.add("pl-uk-only");
    return box;
  }

  function notePart(text) {
    var box = node("span");
    var re = /"([^"]+)"|\{([^}]+)\}/g;
    var at = 0;
    var m;
    while ((m = re.exec(text))) {
      var pl = m[1] || m[2];
      if (/[Ѐ-ӿ]/.test(pl)) continue;
      if (m.index > at) box.appendChild(document.createTextNode(text.slice(at, m.index)));
      if (m[1]) box.appendChild(document.createTextNode("\""));
      // Words split into syllables (po-wy-ła-my) are said whole.
      var word = sayable(node("span", "pl-say-inline", pl), /\S-\S|^-/.test(pl) ? pl.replace(/-/g, "") : "");
      word.tabIndex = 0;
      word.title = "Tap to hear";
      box.appendChild(word);
      if (m[1]) box.appendChild(document.createTextNode("\""));
      at = re.lastIndex;
    }
    if (at < text.length) box.appendChild(document.createTextNode(text.slice(at)));
    return box;
  }

  // The look of tap-to-hear and of the speaker buttons, so a page needs only this script. It goes
  // first in <head>, so the page's own stylesheet can change any of it. Polish inside English
  // text gets a dotted underline (phones have no hover); other Polish just shows a hand.
  var ACCENT = "var(--pl-accent, #00a29a)";
  var style = document.createElement("style");
  style.textContent =
    '[lang="pl"]:not(a):not(button):not(input):not(select):not(textarea):not([data-say="off"]) { cursor: pointer; }' +
    ".pl-say-inline { text-decoration: underline dotted; text-underline-offset: 3px; text-decoration-thickness: 1px; }" +
    '[lang="pl"]:focus-visible { outline: 2px solid ' + ACCENT + "; outline-offset: 2px; border-radius: 3px; }" +
    ".pl-saying { animation: pl-saying 0.9s ease-out; }" +
    "@keyframes pl-saying { from { color: " + ACCENT + "; } }" +
    ".pl-speaks { display: inline-flex; gap: 6px; }" +
    ".pl-speak { width: 36px; height: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" +
    " color: " + ACCENT + "; background: var(--pl-accent-soft, #e0f4f3); border: 0; border-radius: 50%; cursor: pointer; }" +
    ".pl-speak:disabled { opacity: 0.35; cursor: default; }" +
    ".pl-speak svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2;" +
    " stroke-linecap: round; stroke-linejoin: round; }" +
    ".pl-rule { margin: 8px 0; padding: 8px 12px; border-left: 3px solid var(--pl-warn, #c05600);" +
    " background: var(--pl-warn-soft, #fff3e0); border-radius: 6px; text-align: left; }" +
    ".pl-rule p { margin: 4px 0; }" +
    ".pl-rule strong { color: var(--pl-warn, #c05600); }";
  document.head.insertBefore(style, document.head.firstChild);

  // ---------- Show / Hide Ukrainian ----------
  // D learns Polish without Ukrainian parallels, so every [lang="uk"] (and .pl-uk-only) on the
  // Polish pages is hidden unless the "Show Ukrainian" switch in the site menu (js/site-nav.js)
  // is on. polish.css hides it before any script runs; html.pl-show-uk shows it. One setting for
  // the whole section, saved as polish.ukrainian ("on" / "off") so the progress download keeps it.
  // The old per-quiz setting (polish.showUkrainian) defaulted to on, so it is dropped: everyone
  // starts with Ukrainian off.
  var UK_KEY = "polish.ukrainian";
  try { localStorage.removeItem("polish.showUkrainian"); } catch (e) { /* storage blocked */ }

  function showingUk() {
    try { return localStorage.getItem(UK_KEY) === "on"; } catch (e) { return false; }
  }

  function applyUk() {
    document.documentElement.classList.toggle("pl-show-uk", showingUk());
  }

  function setShowUk(show) {
    try { localStorage.setItem(UK_KEY, show ? "on" : "off"); } catch (e) { /* storage blocked */ }
    applyUk();
    window.dispatchEvent(new CustomEvent("polish-uk-change", { detail: { show: !!show } }));
  }

  applyUk();
  // The menu switch, another tab, or a loaded progress file changed it.
  window.addEventListener("polish-uk-change", applyUk);
  window.addEventListener("storage", function (e) { if (e.key === UK_KEY || e.key === null) applyUk(); });


  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 ' +
    '1.2-6.5-4.8-4.6 6.6-.9z"/></svg>';

  // A star marking a word D added.
  function mineBadge() {
    var b = node("span", "pl-mine");
    b.title = "Added by you";
    b.setAttribute("role", "img");
    b.setAttribute("aria-label", "Added by you");
    b.innerHTML = STAR;
    return b;
  }

  // An example sentence under a word: the Polish with a button to hear it, then its meaning.
  // A word with several examples gives a list of them, and each one gets its own line.
  function exampleLine(ex) {
    if (Array.isArray(ex[0])) {
      var all = document.createDocumentFragment();
      ex.forEach(function (one) { all.appendChild(exampleLine(one)); });
      return all;
    }
    var box = node("span", "pl-word-example");
    var say = iconButton(SPEAKER, "Generated voice", "Say " + ex[0]);
    say.addEventListener("click", function () { sayGenerated(ex[0], true); });
    box.appendChild(say);
    var pl = node("span", "pl-example-pl", ex[0]);
    pl.lang = "pl";
    box.appendChild(pl);
    var meaning = node("span", "pl-example-meaning", ex[1]);
    var uk = node("span", "", " · " + ex[2]);
    uk.lang = "uk";
    meaning.appendChild(uk);
    box.appendChild(meaning);
    return box;
  }

  // A warning sign marking a special case: a letter said differently from its usual sound.
  var EXCEPTION = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 1.6 20.8h20.8z"/>' +
    '<path class="pl-exception-mark" d="M12 9.5v5.2M12 17.4v.1"/></svg>';

  function exceptionIcon() {
    var b = node("span", "pl-exception-icon");
    b.innerHTML = EXCEPTION;
    return b;
  }

  // The special cases of a letter (letters.js "exceptions"), each with the warning sign.
  function exceptionList(items) {
    var box = node("ul", "pl-exceptions");
    box.setAttribute("aria-label", "Special cases");
    items.forEach(function (text) {
      var li = node("li", "pl-exception");
      li.appendChild(exceptionIcon());
      li.appendChild(noteText(text));
      box.appendChild(li);
    });
    return box;
  }

  // A letter that is soft like the Ukrainian and Russian soft sign ь (letters.js "softSign").
  // The whole box is a Ukrainian / Russian comparison, so it hides with Show Ukrainian off.
  function softSignNote(text) {
    var box = node("p", "pl-soft-sign pl-uk-only");
    var badge = node("span", "pl-soft-sign-badge", "ь");
    badge.lang = "uk";
    badge.title = "Like the soft sign ь";
    badge.setAttribute("aria-label", "Like the soft sign");
    box.appendChild(badge);
    box.appendChild(noteText(text));
    return box;
  }

  // A grammar rule after a wrong quiz answer: an English line, then the same in Ukrainian
  // (lang="uk", so it is hidden while the menu's Show Ukrainian switch is off). In both, {braced} Polish can be
  // tapped to hear it and **text** is the part that answers the question.
  function ruleBox(rule) {
    var box = node("div", "pl-rule");
    [["en", rule.en], ["uk", rule.uk]].forEach(function (pair) {
      if (!pair[1]) return;
      var p = node("p", "pl-rule-" + pair[0] + (pair[0] === "uk" ? " pl-uk" : ""));
      if (pair[0] === "uk") p.lang = "uk";
      // A non-breaking hyphen keeps an ending such as -em on one line.
      pair[1].replace(/(^|[\s(*])-/g, "$1\u2011").split("**").forEach(function (part, i) {
        if (!part) return;
        var piece = noteText(part);
        if (i % 2) {
          var strong = node("strong");
          strong.appendChild(piece);
          piece = strong;
        }
        p.appendChild(piece);
      });
      box.appendChild(p);
    });
    return box;
  }

  // The chips under a quiz card's heading that say who or what the card is about, so number and
  // gender are never left to guess: who = {num: [en, uk], gender: [en, uk] or null, pronoun}.
  // Each chip's Ukrainian is a lang="uk" span, hidden while Show Ukrainian is off.
  function whoLine(who) {
    var box = node("p", "pl-who");
    function chip(cls, pair) {
      if (!pair || !pair[0]) return;
      var c = node("span", "pl-who-chip " + cls, pair[0]);
      if (pair[1]) {
        var uk = node("span", "pl-who-uk", " · " + pair[1]);
        uk.lang = "uk";
        c.appendChild(uk);
      }
      box.appendChild(c);
    }
    chip("pl-who-num", who.num);
    chip("pl-who-gender", who.gender);
    if (who.pronoun) {
      var p = node("span", "pl-who-chip pl-who-pronoun", who.pronoun);
      sayable(p, who.pronoun);
      box.appendChild(p);
    }
    return box;
  }

  // A sentence that sets the scene ("Puffy to mój pies.") before the quiz sentence, with its
  // English below. Tap or press the speaker to hear it.
  function contextLine(pl, en) {
    var box = node("div", "pl-context");
    var line = node("p", "pl-context-pl");
    var text = node("span", null, pl);
    sayable(text, pl);
    line.appendChild(text);
    line.appendChild(speakButtons(pl));
    box.appendChild(line);
    if (en) box.appendChild(node("p", "pl-context-en pl-muted pl-small", en));
    return box;
  }

  // ---------- Taking back a mistap ----------
  // The quizzes are practice, not a test, so a wrong tap can be taken back: the mistake is
  // forgotten and the card asks again with the same options.

  // A "Misclicked? Undo" link, hidden until a wrong answer shows it.
  function undoButton(onUndo) {
    var b = node("button", "pl-link pl-undo", "Misclicked? Undo");
    b.type = "button";
    b.hidden = true;
    b.title = "Take back this answer and choose again (U)";
    b.addEventListener("click", onUndo);
    return b;
  }

  // Takes one mistake off `key` in polish.mistakes, dropping the key when it reaches 0.
  function forgetMistake(key) {
    try {
      var all = JSON.parse(localStorage.getItem("polish.mistakes")) || {};
      if (!all[key]) return;
      if (all[key] > 1) all[key]--;
      else delete all[key];
      localStorage.setItem("polish.mistakes", JSON.stringify(all));
    } catch (e) { /* storage blocked */ }
  }

  // Makes answer buttons tappable again and clears their right / wrong colours.
  function reopenOptions(container) {
    Array.prototype.forEach.call(container.children, function (b) {
      b.disabled = false;
      b.classList.remove("is-right", "is-wrong");
    });
    if (container.firstElementChild) container.firstElementChild.focus({ preventScroll: true });
  }

  // True for the key that takes back an answer: U, or Backspace.
  function isUndoKey(e) {
    return e.key === "u" || e.key === "U" || e.key === "Backspace";
  }

  window.PolishPage = window.PolishAudio = {
    undoButton: undoButton,
    forgetMistake: forgetMistake,
    reopenOptions: reopenOptions,
    isUndoKey: isUndoKey,
    whoLine: whoLine,
    contextLine: contextLine,
    say: sayGenerated,
    sayable: sayable,
    noteText: noteText,
    node: node,
    iconButton: iconButton,
    speakButtons: speakButtons,
    sayGenerated: sayGenerated,
    sayRecorded: sayRecorded,
    findRecording: findRecording,
    hasNoRecording: hasNoRecording,
    markNoRecording: markNoRecording,
    decodeRecording: decodeRecording,
    hasAudioContext: function () { return !!audioCtx; },
    listenLink: listenLink,
    mineBadge: mineBadge,
    exampleLine: exampleLine,
    SPEAKER: SPEAKER,
    MIC: MIC,
    exceptionIcon: exceptionIcon,
    exceptionList: exceptionList,
    softSignNote: softSignNote,
    ruleBox: ruleBox,
    showingUk: showingUk,
    setShowUk: setShowUk,
  };
})();
