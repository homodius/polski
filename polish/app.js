// Makes the Polish section work as an app on a phone:
//  - registers the service worker (sw.js) so the pages open offline,
//  - asks the browser to keep this site's saved progress (navigator.storage.persist),
//  - on iPhone/iPad Safari, shows a small hint on how to Add to Home Screen. Safari may wipe
//    a website's saved data after 7 days without a visit; an app on the Home Screen keeps it.
// Load from any Polish page: <script src="../app.js" defer></script>. Paths are worked out
// from this script's own URL, so it works at the site root and under a base path like /art/.
(function () {
  var script = document.currentScript;
  var here = script && script.src ? script.src : location.href;
  var HINT_KEY = "polish.appHint"; // date (ms) until which the hint stays hidden
  var HIDE_DAYS = 7;

  var standalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(new URL("sw.js", here).href, { scope: new URL("./", here).href })
        .catch(function () { /* offline support is a bonus; the site works without it */ });
    });
  }

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(function (yes) {
      if (!yes) return navigator.storage.persist();
    }).catch(function () { /* not supported */ });
  }

  if (!ios || standalone) return;

  function hiddenUntil() {
    try { return Number(localStorage.getItem(HINT_KEY)) || 0; } catch (e) { return 0; }
  }
  if (hiddenUntil() > Date.now()) return;

  // Has she already saved something in Safari? Then say how to carry it over.
  function hasProgress() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("polish.") === 0 && !/^polish\.(audio|voice|ukrainian|appHint)/.test(k)) return true;
      }
    } catch (e) { /* storage blocked */ }
    return false;
  }

  var SHARE = '<svg class="pl-app-hint-share" viewBox="0 0 24 24" aria-label="Share" role="img">' +
    '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function show() {
    var host = document.querySelector("main") || document.body;
    var box = document.createElement("aside");
    box.className = "pl-app-hint";
    box.setAttribute("role", "note");
    box.innerHTML =
      '<button type="button" class="pl-app-hint-close" aria-label="Hide for now">&times;</button>' +
      '<img src="' + new URL("app/apple-touch-icon.png", here).href + '" alt="" width="44" height="44">' +
      '<div><strong>Keep your progress safe</strong>' +
      '<p>Add Polish to your Home Screen. In Safari tap ' + SHARE + ' <b>Share</b> ' +
      '(or <b>\u2022\u2022\u2022</b> first, then Share), then <b>Add to Home Screen</b>. ' +
      'From then on open it with the <b>Polski</b> icon.</p>' +
      (hasProgress()
        ? '<p class="pl-app-hint-more">The app starts fresh. To take today’s progress with you: ' +
          'here, open <b>Menu</b> → <b>Download progress</b>; then in the app, <b>Menu</b> → <b>Load progress</b>.</p>'
        : '') +
      '</div>';
    box.querySelector(".pl-app-hint-close").addEventListener("click", function () {
      try { localStorage.setItem(HINT_KEY, String(Date.now() + HIDE_DAYS * 864e5)); } catch (e) { /* storage blocked */ }
      box.remove();
    });
    host.insertBefore(box, host.firstChild);

    var css = document.createElement("style");
    css.textContent =
      ".pl-app-hint{position:relative;display:flex;gap:12px;align-items:flex-start;margin:0 0 16px;padding:12px 40px 12px 12px;" +
      "border:1px solid var(--pl-border,#dee2e6);border-left:4px solid var(--pl-accent,#00a29a);border-radius:10px;" +
      "background:var(--pl-accent-soft,#e0f4f3);color:var(--pl-text,#212529);font-size:15px;line-height:1.4}" +
      ".pl-app-hint img{flex:none;border-radius:10px}" +
      ".pl-app-hint p{margin:4px 0 0}" +
      ".pl-app-hint-more{color:var(--pl-muted,#6c757d);font-size:14px}" +
      ".pl-app-hint-share{width:18px;height:18px;vertical-align:-3px;color:#007aff}" +
      ".pl-app-hint-close{position:absolute;top:4px;right:4px;width:36px;height:36px;border:0;background:none;" +
      "color:var(--pl-muted,#6c757d);font-size:24px;line-height:1;cursor:pointer}";
    document.head.appendChild(css);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show);
  else show();
})();
