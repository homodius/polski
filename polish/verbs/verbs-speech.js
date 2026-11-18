// Tap-to-hear for the Verb tenses page until the shared Polish audio does it: any element with
// lang="pl" says its text (or its data-say) with PolishPage.sayGenerated from ../common.js.
// Without common.js it uses the device's Polish voice, or Google Translate's speech audio in
// Firefox (whose voices click after every word) and on devices with no Polish voice.
(function () {
  if (window.PolishAudio) return; // the shared audio already makes lang="pl" tappable

  var canSpeak = "speechSynthesis" in window;
  var useAudio = /Firefox\//.test(navigator.userAgent) || !canSpeak;
  var player = null;
  var lastUtterance = null;

  function polishVoice() {
    var voices = speechSynthesis.getVoices();
    var pl = voices.filter(function (v) { return v.lang.toLowerCase().indexOf("pl") === 0; });
    // Prefer a voice built into the device: streamed online voices tend to end with a click.
    var best = pl.find(function (v) { return v.localService; }) || pl[0];
    if (best) return best;
    return voices.length ? false : null; // false: the list is loaded and has no Polish voice
  }

  function playAudio(text, rate) {
    if (!player) player = new Audio();
    player.pause();
    player.src = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=pl&q=" + encodeURIComponent(text);
    player.playbackRate = rate || 1;
    var p = player.play();
    if (p && p.catch) p.catch(function () { /* blocked or offline */ });
  }

  function say(text, explicit, rate) {
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (window.PolishPage && window.PolishPage.sayGenerated) {
      window.PolishPage.sayGenerated(text, explicit, rate);
      return;
    }
    var voice = useAudio ? false : polishVoice();
    if (voice === false) {
      playAudio(text, rate);
      return;
    }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "pl-PL";
    if (voice) u.voice = voice;
    u.volume = 0.8; // full volume makes some voices clip at the end
    u.rate = rate || 1;
    // Cancelling an idle synthesizer pops on some voices, so only stop speech that is playing.
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
    if (speechSynthesis.paused) speechSynthesis.resume();
    lastUtterance = u; // Chrome can garbage-collect an utterance mid-speech
    speechSynthesis.speak(u);
  }

  if (canSpeak) speechSynthesis.getVoices(); // start loading the voice list early

  function target(e) {
    var t = e.target.closest && e.target.closest('[lang="pl"]');
    if (!t || t.getAttribute("data-say") === "off" || t.closest("a, select, input, textarea")) return null;
    return t;
  }

  function sayElement(t) { say(t.getAttribute("data-say") || t.textContent, true); }

  document.addEventListener("click", function (e) {
    var t = target(e);
    if (t) sayElement(t);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var t = target(e);
    if (!t || t.tagName === "BUTTON") return; // buttons already click on Enter and Space
    e.preventDefault();
    sayElement(t);
  });

  window.VerbSpeech = { say: say };
})();
