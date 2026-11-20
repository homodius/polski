// Offline support for the Polish section when it is installed as an app (Add to Home Screen).
// Lives in polish/ so it controls only the Polish pages. Every URL here is relative to this
// file, so it works both at the site root (Netlify) and under a base path such as /art/.
//
// Strategy: network first, so new versions of the site show up as soon as there is a
// connection; whatever was fetched is kept, and used when the phone is offline or the
// network is too slow. On install it also caches every Polish page and the files they load.
var CACHE = "polish-app-v3";
var PAGES = [
  "./", "words/", "flashcards/", "letters/", "twisters/", "practice/",
  "cases/", "cases-quiz/", "verbs/", "verbs-quiz/", "demonstratives/",
  "demonstratives-quiz/", "translate/", "translate-quiz/", "phrases/", "phrases-quiz/"
];
var EXTRA = [
  "manifest.webmanifest", "app/apple-touch-icon.png", "app/icon-192.png", "app/icon-512.png"
];
var TIMEOUT_MS = 4000;

function sameOrigin(url) { return new URL(url, self.location.href).origin === self.location.origin; }

// Cache one URL; a failure (offline, 404) just skips it.
function put(cache, url) {
  return fetch(url, { cache: "no-cache" }).then(function (res) {
    if (!res.ok) return null;
    // Safari refuses page responses that went through a redirect, so store a clean copy.
    var keep = res.redirected ? new Response(res.clone().body, res) : res.clone();
    return cache.put(url, keep).then(function () { return res; });
  }).catch(function () { return null; });
}

// Cache a page, then every same-origin script, stylesheet and icon it references.
function cachePage(cache, pageUrl) {
  return put(cache, pageUrl).then(function (res) {
    if (!res) return;
    return res.text().then(function (html) {
      var re = /<(?:script|link)\b[^>]*?\b(?:src|href)="([^"#?]+)"/gi, m, urls = [];
      while ((m = re.exec(html))) {
        var u = new URL(m[1], res.url || pageUrl).href;
        if (sameOrigin(u) && /\.(js|css|png|webmanifest)$/.test(u)) urls.push(u);
      }
      return Promise.all(urls.map(function (u) { return put(cache, u); }));
    });
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    var base = self.location.href;
    return Promise.all(
      PAGES.map(function (p) { return cachePage(cache, new URL(p, base).href); })
        .concat(EXTRA.map(function (p) { return put(cache, new URL(p, base).href); }))
    );
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf("polish-app-") === 0 && k !== CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request, { ignoreSearch: true }).then(function (hit) {
      if (hit || request.mode !== "navigate") return hit;
      // "words" vs "words/" vs "words/index.html": try the folder form too.
      var url = new URL(request.url);
      url.search = ""; url.hash = "";
      var path = url.href.replace(/index\.html$/, "");
      if (!/\/$/.test(path)) path += "/";
      return cache.match(path);
    });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET" || !sameOrigin(req.url)) return; // audio lookups etc. go straight to the network
  event.respondWith(new Promise(function (resolve) {
    var done = false;
    function finish(res) { if (!done && res) { done = true; resolve(res); } }
    var cached = fromCache(req);
    var timer = setTimeout(function () { cached.then(finish); }, TIMEOUT_MS);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok && res.type === "basic" && !res.redirected) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      if (done) return;
      done = true;
      // A redirected page (e.g. "words" -> "words/") must be redirected again, not served.
      resolve(res.redirected && req.mode === "navigate" ? Response.redirect(res.url, 302) : res);
    }).catch(function () {
      clearTimeout(timer);
      cached.then(function (hit) {
        if (done) return;
        done = true;
        resolve(hit || new Response("Offline, and this page is not saved yet.", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
        }));
      });
    });
  }));
});
