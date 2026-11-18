// Download and load back everything the Polish page keeps in this browser (progress, marks,
// quiz scores, settings), so it survives clearing the browser or moves to another device.
// Adds two buttons to the site's top bar. Every localStorage key starting with "polish." is
// included, except caches that the page can rebuild by itself.
(function () {
  var PREFIX = "polish.";
  var SKIP = ["polish.audio."]; // recording lookups, rebuilt on demand
  var FORMAT = "homodius-polish-progress";

  function wanted(key) {
    if (!key || key.indexOf(PREFIX) !== 0) return false;
    return !SKIP.some(function (p) { return key.indexOf(p) === 0; });
  }

  function ownKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (wanted(k)) keys.push(k);
      }
    } catch (e) { /* storage blocked */ }
    return keys.sort();
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function download() {
    var data = {};
    ownKeys().forEach(function (k) {
      try { data[k] = localStorage.getItem(k); } catch (e) { /* storage blocked */ }
    });
    var now = new Date();
    var file = { format: FORMAT, version: 1, exported: now.toISOString(), data: data };
    var blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "polish-progress-" + now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast(Object.keys(data).length ? "Progress downloaded." : "Nothing saved yet, downloaded an empty file.");
  }

  // Returns the {key: string} map from a file, or throws with a message for the visitor.
  function parse(text) {
    var file;
    try { file = JSON.parse(text); } catch (e) { throw new Error("That file isn't a progress file."); }
    if (!file || file.format !== FORMAT || !file.data || typeof file.data !== "object") {
      throw new Error("That file isn't a progress file from this page.");
    }
    var data = {};
    Object.keys(file.data).forEach(function (k) {
      var v = file.data[k];
      if (wanted(k) && typeof v === "string") data[k] = v;
    });
    return data;
  }

  function load(text) {
    var data;
    try { data = parse(text); } catch (e) { toast(e.message); return; }
    var count = Object.keys(data).length;
    if (!confirm("Replace the progress in this browser with the " + count + " saved item" + (count === 1 ? "" : "s") +
      " from this file? What's here now will be overwritten.")) return;
    try {
      ownKeys().forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(data).forEach(function (k) { localStorage.setItem(k, data[k]); });
    } catch (e) {
      toast("This browser won't let the page save anything.");
      return;
    }
    // The page reads storage when it starts, so reload to show what was loaded.
    try { sessionStorage.setItem("polish-backup-loaded", "1"); } catch (e) { /* fine */ }
    location.reload();
  }

  function toast(message) {
    var t = document.createElement("div");
    t.className = "pl-backup-toast";
    t.setAttribute("role", "status");
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  var style = document.createElement("style");
  style.textContent =
    ".pl-backup{display:flex;gap:.5rem}" +
    ".pl-backup button{font:inherit;color:#fff;border:0;cursor:pointer;padding:.35rem .75rem;border-radius:999px;background:rgba(255,255,255,.15)}" +
    ".pl-backup button:hover,.pl-backup button:focus-visible{background:rgba(255,255,255,.3)}" +
    ".pl-backup-toast{position:fixed;left:50%;bottom:1.25rem;transform:translateX(-50%);z-index:2100;max-width:calc(100% - 2rem);" +
    "padding:.6rem 1rem;border-radius:10px;background:#212529;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.3);" +
    "font:500 14px/1.3 system-ui,-apple-system,\"Segoe UI\",Roboto,Arial,sans-serif}" +
    "@media (max-width:480px){.pl-backup .pl-backup-long{display:none}}" +
    "@media print{.pl-backup{display:none}}";
  document.head.appendChild(style);

  var box = document.createElement("div");
  box.className = "pl-backup";
  box.innerHTML =
    '<button type="button" class="pl-backup-save" title="Save your progress, marks and scores to a file">Download<span class="pl-backup-long"> progress</span></button>' +
    '<button type="button" class="pl-backup-load" title="Continue from a progress file you downloaded">Load<span class="pl-backup-long"> progress</span></button>' +
    '<input type="file" accept=".json,application/json" hidden />';
  var input = box.querySelector("input");
  box.querySelector(".pl-backup-save").addEventListener("click", download);
  box.querySelector(".pl-backup-load").addEventListener("click", function () { input.click(); });
  input.addEventListener("change", function () {
    var f = input.files && input.files[0];
    input.value = "";
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { load(String(reader.result)); };
    reader.onerror = function () { toast("Couldn't read that file."); };
    reader.readAsText(f);
  });

  // The site menu has a "This page" group for buttons like these; without it they sit on top of the page.
  var page = document.querySelector(".site-nav-page");
  if (page) {
    while (box.firstChild) page.appendChild(box.firstChild);
  } else {
    document.body.insertBefore(box, document.body.firstChild);
  }

  // Saving to Google Drive by itself lives in sync.js (shown only once a Google Client ID is set there).
  var me = document.currentScript && document.currentScript.src;
  if (me) {
    var sync = document.createElement("script");
    sync.src = new URL("sync.js", me).href;
    document.head.appendChild(sync);
  }

  try {
    if (sessionStorage.getItem("polish-backup-loaded")) {
      sessionStorage.removeItem("polish-backup-loaded");
      toast("Progress loaded.");
    }
  } catch (e) { /* fine */ }
})();
