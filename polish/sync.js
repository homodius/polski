// Save progress to Google Drive by itself.
//
// SETUP: paste the OAuth Client ID from Google Cloud between the quotes below. While it is empty
// nothing of this feature shows on the site. Steps: docs/google-sync-setup.md.
var POLISH_GOOGLE_CLIENT_ID = "";

// What it does, once the visitor taps "Sign in with Google" one time:
// - every localStorage key starting with "polish." (the same set backup.js downloads) is copied to
//   a hidden file in the visitor's own Google Drive (the app data folder: only this site can see
//   it, it doesn't show in their Drive and doesn't count against much space);
// - a change is saved a few seconds after it happens, and when the page is closed or hidden;
// - on each page load the file is read back and merged, so a new phone, or Safari wiping the
//   site's storage, picks up where the visitor left off.
// No server: the browser talks to Google directly. Sign-in is a full-page redirect rather than a
// popup, because iPhone Safari blocks popups that don't come from a tap, and Google's access
// tokens last one hour: when one runs out, the next page load quietly fetches a new one
// (prompt=none), which takes about a second and needs no tap while the visitor stays signed in to
// Google in that browser.
(function () {
  var CLIENT_ID = String(POLISH_GOOGLE_CLIENT_ID || "").trim();
  if (!CLIENT_ID) return;
  try { if (window.top !== window.self) return; } catch (e) { return; }

  var PREFIX = "polish.";
  var SKIP = ["polish.audio."];
  var FILE_NAME = "polish-progress.json";
  var FORMAT = "homodius-polish-progress";
  var SCOPE = "https://www.googleapis.com/auth/drive.appdata email";
  var DRIVE = "https://www.googleapis.com/drive/v3/files";
  var UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
  // Our own keys start with "polish-sync." (no dot after "polish"), so they are never synced.
  var K = {
    token: "polish-sync.token",       // {access, exp}
    account: "polish-sync.account",   // {email}: present while saving is on
    base: "polish-sync.base",         // the data as of the last successful sync
    fileId: "polish-sync.fileId",
    changed: "polish-sync.changed",   // ms of the first local change not yet saved
    synced: "polish-sync.synced",     // ms of the last successful save or read
    reconnect: "polish-sync.reconnect", // "1" when a quiet sign-in failed and a tap is needed
    silentAt: "polish-sync.silentAt",   // ms of the last quiet sign-in attempt
    nudge: "polish-sync.nudge"          // ms when "Not now" was tapped
  };
  var SS_STATE = "polish-sync.state";   // sessionStorage: {nonce, back} for the redirect
  var SS_RESTORED = "polish-sync.restored";

  var here = document.currentScript && document.currentScript.src;
  var polishBase = here ? new URL(".", here) : new URL("/polish/", location.href);
  var REDIRECT = new URL("sync/", polishBase).href;

  // ---- storage helpers ----
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  function getJson(k) { try { return JSON.parse(get(k)); } catch (e) { return null; } }

  function wanted(key) {
    if (!key || key.indexOf(PREFIX) !== 0) return false;
    return !SKIP.some(function (p) { return key.indexOf(p) === 0; });
  }
  function localData() {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (wanted(k)) data[k] = localStorage.getItem(k);
      }
    } catch (e) { /* storage blocked */ }
    return data;
  }
  function same(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (k) { return b[k] === a[k]; });
  }

  function account() { return getJson(K.account); }
  function token() {
    var t = getJson(K.token);
    return t && t.access && t.exp - Date.now() > 60000 ? t.access : null;
  }

  // ---- sign-in (full-page redirect to Google and back to polish/sync/) ----
  function signIn(quiet) {
    var nonce = Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(16)), function (b) {
      return (b < 16 ? "0" : "") + b.toString(16);
    }).join("");
    try {
      sessionStorage.setItem(SS_STATE, JSON.stringify({ nonce: nonce, back: location.href, quiet: !!quiet }));
    } catch (e) {
      toast("This browser won't let the page sign in (private browsing?).");
      return;
    }
    var p = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT,
      response_type: "token",
      scope: SCOPE,
      include_granted_scopes: "true",
      state: nonce
    });
    var acc = account();
    if (acc && acc.email) p.set("login_hint", acc.email);
    if (quiet) {
      p.set("prompt", "none");
      set(K.silentAt, String(Date.now()));
    }
    location.assign("https://accounts.google.com/o/oauth2/v2/auth?" + p.toString());
  }

  function signOut() {
    var t = getJson(K.token);
    [K.token, K.account, K.base, K.fileId, K.changed, K.synced, K.reconnect, K.silentAt].forEach(del);
    if (t && t.access) {
      fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(t.access), { method: "POST", mode: "no-cors" }).catch(function () {});
    }
    render();
    toast("Stopped saving to Google. Your progress stays on this phone.");
  }

  // ---- Google Drive ----
  function api(url, opts) {
    var access = token();
    if (!access) return Promise.reject(needToken());
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers.Authorization = "Bearer " + access;
    return fetch(url, opts).then(function (r) {
      if (r.status === 401) { del(K.token); throw needToken(); }
      if (!r.ok) throw new Error("Google Drive answered " + r.status);
      return r;
    });
  }
  function needToken() { var e = new Error("token"); e.token = true; return e; }

  function findFile() {
    var id = get(K.fileId);
    if (id) return Promise.resolve(id);
    var q = "name='" + FILE_NAME + "' and trashed=false";
    return api(DRIVE + "?spaces=appDataFolder&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&q=" + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var f = j.files && j.files[0];
        if (f) set(K.fileId, f.id);
        return f ? f.id : null;
      });
  }

  // Resolves to the saved file ({data, updated}) or null when there's none yet.
  function readRemote() {
    return findFile().then(function (id) {
      if (!id) return null;
      return api(DRIVE + "/" + id + "?alt=media").then(function (r) { return r.json(); }, function (e) {
        if (!e.token) del(K.fileId); // deleted from Drive: look it up again next time
        throw e;
      });
    }).then(function (file) {
      if (!file) return null;
      var data = {};
      if (file.format === FORMAT && file.data && typeof file.data === "object") {
        Object.keys(file.data).forEach(function (k) {
          if (wanted(k) && typeof file.data[k] === "string") data[k] = file.data[k];
        });
      }
      return { data: data, updated: Date.parse(file.updated) || 0 };
    });
  }

  function body(data) {
    return JSON.stringify({ format: FORMAT, version: 1, updated: new Date().toISOString(), data: data });
  }

  function writeRemote(data, keepalive) {
    var text = body(data);
    // keepalive lets a save finish after the page closes, but only for small requests.
    var ka = !!keepalive && text.length < 60000;
    return findFile().then(function (id) {
      if (id) {
        return api(UPLOAD + "/" + id + "?uploadType=media", {
          method: "PATCH", keepalive: ka, headers: { "Content-Type": "application/json" }, body: text
        });
      }
      var boundary = "polishsync" + Date.now();
      var multipart =
        "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"], mimeType: "application/json" }) + "\r\n" +
        "--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" + text + "\r\n--" + boundary + "--";
      return api(UPLOAD + "?uploadType=multipart&fields=id", {
        method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + boundary }, body: multipart
      }).then(function (r) { return r.json(); }).then(function (j) { if (j.id) set(K.fileId, j.id); });
    });
  }

  // ---- merging ----
  // Three-way merge per key against the last synced copy: a key changed on only one side takes
  // that side; a key changed on both sides takes the newer side, and two JSON objects (ratings,
  // picks, mistakes...) are merged key by key so marks from both survive.
  function mergeValue(l, r, localNewer) {
    var lo, ro;
    try { lo = JSON.parse(l); ro = JSON.parse(r); } catch (e) { return localNewer ? l : r; }
    var plain = function (o) { return o && typeof o === "object" && !Array.isArray(o); };
    if (!plain(lo) || !plain(ro)) return localNewer ? l : r;
    var out = {};
    Object.keys(ro).forEach(function (k) { out[k] = ro[k]; });
    Object.keys(lo).forEach(function (k) { if (localNewer || !(k in ro)) out[k] = lo[k]; });
    return JSON.stringify(out);
  }
  function merge(local, remote, base, localNewer) {
    var out = {};
    var keys = {};
    [local, remote, base].forEach(function (m) { Object.keys(m).forEach(function (k) { keys[k] = true; }); });
    Object.keys(keys).forEach(function (k) {
      var l = local[k], r = remote[k], b = base[k], v;
      if (l === r) v = l;
      else if (l === b) v = r;
      else if (r === b) v = l;
      else if (l === undefined) v = localNewer ? undefined : r;
      else if (r === undefined) v = localNewer ? l : (b === undefined ? l : undefined);
      else v = mergeValue(l, r, localNewer);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }

  function applyLocal(data) {
    var now = localData();
    var touched = false;
    try {
      Object.keys(now).forEach(function (k) { if (!(k in data)) { rawRemove.call(localStorage, k); touched = true; } });
      Object.keys(data).forEach(function (k) { if (now[k] !== data[k]) { rawSet.call(localStorage, k, data[k]); touched = true; } });
    } catch (e) { /* storage full or blocked */ }
    return touched;
  }

  // ---- the sync loop ----
  var busy = null;
  var lastPull = 0;
  var state = "idle"; // idle | saving | error | offline | later (pass ran out, next page load renews it)

  function base() { return getJson(K.base) || {}; }
  function markSynced(data) {
    set(K.base, JSON.stringify(data));
    del(K.changed);
    set(K.synced, String(Date.now()));
  }

  // pull: read Drive first and merge. Without it, a save assumes Drive still holds the last
  // synced copy (true while one device is in use) and just writes.
  function sync(pull, keepalive) {
    if (!account()) return Promise.resolve(false);
    if (busy) return busy.then(function () { return sync(pull, keepalive); });
    if (!token()) { setState("later"); return Promise.resolve(false); }
    if (Date.now() - lastPull > 5 * 60000) pull = true;
    setState("saving");
    var b = base();
    var firstTime = !get(K.base);
    var changedRemote = false;
    busy = (pull ? readRemote() : Promise.resolve({ data: b, updated: 0, assumed: true }))
      .then(function (remote) {
        if (pull) lastPull = Date.now();
        var local = localData();
        var rdata = remote ? remote.data : {};
        var localAt = Number(get(K.changed)) || (firstTime ? 0 : Date.now());
        var localNewer = !remote || (remote.updated || 0) < localAt;
        var merged = merge(local, rdata, firstTime ? {} : b, localNewer);
        changedRemote = applyLocal(merged);
        if (remote && same(merged, rdata)) { markSynced(merged); return; }
        return writeRemote(merged, keepalive).then(function () { markSynced(merged); });
      })
      .then(function () { setState("idle"); return changedRemote; }, function (e) {
        setState(e && e.token ? "later" : (navigator.onLine === false ? "offline" : "error"));
        return false;
      })
      .then(function (r) { busy = null; return r; });
    return busy;
  }

  function dirty() {
    if (!account()) return false;
    var d = !same(localData(), base());
    if (d && !get(K.changed)) set(K.changed, String(Date.now()));
    return d;
  }

  var timer = null;
  function soon() {
    clearTimeout(timer);
    timer = setTimeout(function () { if (dirty()) sync(false); }, 2500);
  }

  // Hear about every change the Polish pages make, without editing each page.
  var rawSet = Storage.prototype.setItem;
  var rawRemove = Storage.prototype.removeItem;
  var rawClear = Storage.prototype.clear;
  try {
    Storage.prototype.setItem = function (k, v) {
      rawSet.apply(this, arguments);
      if (this === localStorage && wanted(String(k))) soon();
    };
    Storage.prototype.removeItem = function (k) {
      rawRemove.apply(this, arguments);
      if (this === localStorage && wanted(String(k))) soon();
    };
    Storage.prototype.clear = function () {
      rawClear.apply(this, arguments);
      if (this === localStorage) soon();
    };
  } catch (e) { /* the periodic check below still works */ }
  setInterval(function () { if (dirty() && !busy) sync(false); }, 15000);

  function flush() { if (dirty() && token()) sync(false, true); }
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
    else if (account() && token() && Date.now() - lastPull > 30000) sync(true);
  });
  window.addEventListener("online", function () { if (account() && token()) sync(true); });

  // ---- what the visitor sees ----
  function setState(s) { state = s; render(); }

  var style = document.createElement("style");
  style.textContent =
    ".pl-sync-status{padding:.45rem .75rem;font-size:.9em;line-height:1.35;color:var(--sn-muted,#6c757d)}" +
    ".pl-sync-status b{color:var(--sn-fg,#212529);font-weight:600}" +
    ".pl-sync-status.pl-sync-bad b{color:#c05600}" +
    ".pl-sync-g{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.18em;margin-right:.45em}" +
    ".pl-sync-card{position:fixed;left:50%;bottom:max(1rem,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2050;" +
    "width:min(26rem,calc(100% - 2rem));box-sizing:border-box;padding:1rem;border-radius:14px;background:var(--pl-card,#fff);" +
    "color:var(--pl-text,#212529);border:1px solid var(--pl-border,#dee2e6);box-shadow:0 6px 24px rgba(0,0,0,.22);" +
    "font:15px/1.4 -apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Arial,sans-serif}" +
    ".pl-sync-card p{margin:0 0 .75rem}" +
    ".pl-sync-card .pl-sync-row{display:flex;gap:.5rem;flex-wrap:wrap}" +
    ".pl-sync-card button{font:inherit;font-weight:600;cursor:pointer;border-radius:999px;padding:.6rem 1rem;min-height:44px}" +
    ".pl-sync-card .pl-sync-go{flex:1 1 auto;background:#fff;color:#1f1f1f;border:1px solid #747775;display:inline-flex;align-items:center;justify-content:center}" +
    ".pl-sync-card .pl-sync-later{background:transparent;color:var(--pl-muted,#6c757d);border:0}" +
    "@media print{.pl-sync-card{display:none}}";
  document.head.appendChild(style);

  var G_LOGO = '<svg class="pl-sync-g" viewBox="0 0 48 48" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  // Menu entries (in the side panel's "This page" group).
  var menuBox = document.createElement("div");
  menuBox.className = "pl-sync-menu";
  var status = document.createElement("div");
  status.className = "pl-sync-status";
  status.setAttribute("role", "status");
  var mainBtn = document.createElement("button");
  mainBtn.type = "button";
  mainBtn.addEventListener("click", function () {
    if (!account() || get(K.reconnect)) signIn(false);
    else if (confirm("Stop saving your progress to Google? What's on this phone stays.")) signOut();
  });
  var page = document.querySelector(".site-nav-page");
  if (page) {
    page.appendChild(status);
    page.appendChild(mainBtn);
  }

  var card = null;
  function closeCard() { if (card) { card.remove(); card = null; } }
  function showCard(text, button) {
    closeCard();
    card = document.createElement("div");
    card.className = "pl-sync-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Save progress with Google");
    card.innerHTML = '<p></p><div class="pl-sync-row"><button type="button" class="pl-sync-go"></button>' +
      '<button type="button" class="pl-sync-later">Not now</button></div>';
    card.querySelector("p").textContent = text;
    card.querySelector(".pl-sync-go").innerHTML = G_LOGO + button;
    card.querySelector(".pl-sync-go").addEventListener("click", function () { signIn(false); });
    card.querySelector(".pl-sync-later").addEventListener("click", function () {
      set(K.nudge, String(Date.now()));
      closeCard();
    });
    document.body.appendChild(card);
  }

  function timeText(ms) {
    var d = new Date(ms);
    var today = new Date().toDateString() === d.toDateString();
    return (today ? "" : d.toLocaleDateString([], { day: "numeric", month: "short" }) + " ") +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function render() {
    var acc = account();
    var needsTap = acc && get(K.reconnect);
    if (!acc) {
      status.hidden = true;
      mainBtn.innerHTML = G_LOGO + "Save progress with Google";
    } else if (needsTap) {
      status.hidden = false;
      status.className = "pl-sync-status pl-sync-bad";
      status.innerHTML = "<b>Google saving is paused.</b> Progress is kept on this phone until you sign in again.";
      mainBtn.innerHTML = G_LOGO + "Sign in again";
    } else {
      status.hidden = false;
      status.className = "pl-sync-status" + (state === "error" ? " pl-sync-bad" : "");
      var synced = Number(get(K.synced));
      var line = state === "saving" ? "Saving…" :
        state === "offline" ? "Offline, will save when back online." :
        state === "error" ? "Couldn't reach Google, will try again." :
        state === "later" ? "New changes save when you open the next page." :
        synced ? "Last saved " + timeText(synced) + "." : "";
      status.innerHTML = "<b>✓ Progress saves to Google</b><br>";
      status.appendChild(document.createTextNode((acc.email ? acc.email + ". " : "") + line));
      mainBtn.textContent = "Stop saving to Google";
    }
  }

  function nudge() {
    var acc = account();
    if (acc && get(K.reconnect)) {
      showCard("Saving your progress to Google is paused. Tap below to sign in again, it takes a moment.", "Sign in again");
      return;
    }
    if (acc) return;
    var later = Number(get(K.nudge)) || 0;
    if (Date.now() - later < 7 * 86400000) return;
    var hasProgress = Object.keys(localData()).some(function (k) { return k !== "polish.ukrainian"; });
    showCard(hasProgress
      ? "Keep your progress safe: sign in with Google once and it saves by itself, even if this phone loses it."
      : "Practised here before? Sign in with Google to bring your progress back, and keep saving it from now on.",
    "Sign in with Google");
  }

  function fetchEmail() {
    var acc = account();
    if (!acc || acc.email) return;
    api("https://www.googleapis.com/oauth2/v3/userinfo").then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.email && account()) { set(K.account, JSON.stringify({ email: j.email })); render(); }
    }).catch(function () {});
  }

  function toast(message) {
    var t = document.createElement("div");
    t.className = "pl-backup-toast";
    t.setAttribute("role", "status");
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }

  // ---- start ----
  var restored = false;
  try { restored = !!sessionStorage.getItem(SS_RESTORED); sessionStorage.removeItem(SS_RESTORED); } catch (e) { /* fine */ }
  var just = null;
  try { just = sessionStorage.getItem("polish-sync.just"); sessionStorage.removeItem("polish-sync.just"); } catch (e) { /* fine */ }

  render();
  if (!account()) { nudge(); return; }

  if (!token()) {
    // Quietly get a new hour-long pass from Google, at most every 10 minutes, and not offline.
    var lastTry = Number(get(K.silentAt)) || 0;
    if (!get(K.reconnect) && navigator.onLine !== false && Date.now() - lastTry > 10 * 60000) {
      signIn(true);
      return;
    }
    dirty();
    nudge();
    return;
  }

  fetchEmail();
  sync(true).then(function (changed) {
    if (changed && !restored) {
      // The page already read its data; reload once so it shows what came from Google.
      try { sessionStorage.setItem(SS_RESTORED, "1"); } catch (e) { /* fine */ }
      location.reload();
      return;
    }
    if (restored) toast("Progress restored from Google.");
    else if (just === "first") toast("Signed in. Your progress now saves to Google by itself.");
  });
})();
