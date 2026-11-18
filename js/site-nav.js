// Shared top bar (Menu, Back and Home buttons) and a side panel with every section of the site.
// The panel slides in over the page; on wide screens it can be pinned open beside it (remembered
// in localStorage "site-nav-pinned").
// Include on any page with:
// <script src="<relative path>/js/site-nav.js" defer></script>
// Pages can add their own buttons to the panel's "This page" group: append them to .site-nav-page.
// Section links in an element whose id ends in "-contents" are copied to its "On this page" group.
(function () {
    var script = document.currentScript;
    var home = new URL('../', script.src).href;
    var start = home + 'polish/'; // standalone Polish site: its start page

    // Every section of the site, in the order of the home page tiles. "children" are sub-pages
    // listed under their section in the menu; Polish gets its pages from polish/pages.js below.
    var SECTIONS = [
        { title: 'Polish', href: 'polish/', children: [], polish: true }
    ];

    // "/polish/index.html", "/polish/" and "/polish" are the same page.
    function pathOf(url) {
        return new URL(url, home).pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    }
    var here = pathOf(location.href);
    var isHome = here === pathOf(home) || here === pathOf(start);
    var polishRoot = pathOf(home + 'polish/');
    var inPolish = here === polishRoot || here.indexOf(polishRoot + '/') === 0;

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    // "also" lists other URLs of the same entry (a Polish topic's quiz page), which mark it current too.
    function link(item) {
        var current = [item.href].concat(item.also || []).some(function (h) { return pathOf(home + h) === here; });
        return '<a class="site-nav-link" href="' + esc(home + item.href) + '"' +
            (current ? ' aria-current="page"' : '') + '>' + esc(item.title) + '</a>';
    }

    function section(item, i) {
        var kids = item.children || [];
        if (!kids.length) return '<li data-section="' + i + '">' + link(item) + '</li>';
        // Open the section the visitor is in, so its sub-pages show straight away.
        var root = pathOf(home + item.href);
        var inside = here === root || here.indexOf(root + '/') === 0;
        var id = 'site-nav-sub-' + i;
        return '<li data-section="' + i + '" class="site-nav-group' + (inside ? ' open' : '') + '">' +
            '<div class="site-nav-row">' + link(item) +
            '<button type="button" class="site-nav-expand" aria-expanded="' + inside + '" aria-controls="' + id + '"' +
            ' aria-label="' + esc(item.title) + ' pages"><svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="m6 9 6 6 6-6"/></svg></button></div>' +
            '<ul class="site-nav-sub" id="' + id + '">' +
            kids.map(function (k) { return '<li>' + link(k) + '</li>'; }).join('') +
            '</ul></li>';
    }

    // The side panel can be pinned open next to the page on screens at least this wide.
    var PIN_MEDIA = window.matchMedia('(min-width: 1000px)');
    var PIN_KEY = 'site-nav-pinned';
    var root = document.documentElement;

    var style = document.createElement('style');
    style.textContent =
        ':root{--site-nav-panel-w:17.5rem}' +
        '.site-nav,.site-nav-panel{--sn-bg:#fff;--sn-fg:#212529;--sn-muted:#6c757d;--sn-hover:#e6f6f5;--sn-line:#dee2e6;' +
        'font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box;text-align:left}' +
        '@media (prefers-color-scheme:dark){.site-nav,.site-nav-panel{--sn-bg:#212529;--sn-fg:#e9ecef;--sn-muted:#9aa1a8;--sn-hover:#17403e;--sn-line:#3a4046}}' +
        '.site-nav{position:relative;z-index:1050;display:flex;gap:.5rem;align-items:center;padding:.5rem 1rem;background:#00a29a}' +
        '.site-nav>a,.site-nav-burger{color:#fff!important;text-decoration:none!important;padding:.35rem .75rem;border-radius:999px;' +
        'background:rgba(255,255,255,.15);border:0;font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem}' +
        '.site-nav>a:hover,.site-nav>a:focus-visible,.site-nav-burger:hover,.site-nav-burger:focus-visible,' +
        '.site-nav-burger[aria-expanded="true"]{background:rgba(255,255,255,.3)}' +
        '.site-nav svg,.site-nav-panel svg{width:18px;height:18px;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;fill:none}' +
        // The panel: slides in from the left over the page, or sits beside it when pinned.
        '.site-nav-panel{position:fixed;top:0;left:0;bottom:0;z-index:2000;width:min(var(--site-nav-panel-w),calc(100vw - 3rem));' +
        'display:flex;flex-direction:column;background:var(--sn-bg);color:var(--sn-fg);box-shadow:0 0 24px rgba(0,0,0,.3);' +
        'transform:translateX(-105%);visibility:hidden;transition:transform .2s ease,visibility 0s .2s}' +
        '.site-nav-panel.open{transform:none;visibility:visible;transition:transform .2s ease}' +
        '.site-nav-backdrop{position:fixed;inset:0;z-index:1999;background:rgba(0,0,0,.35);opacity:0;visibility:hidden;' +
        'transition:opacity .2s,visibility 0s .2s}' +
        '.site-nav-backdrop.open{opacity:1;visibility:visible;transition:opacity .2s}' +
        '.site-nav-head{display:flex;align-items:center;gap:.25rem;padding:.5rem .5rem .5rem 1.15rem;background:#00a29a;color:#fff;' +
        'min-height:var(--site-nav-h,44px);box-sizing:border-box}' +
        '.site-nav-head strong{flex:1;font:inherit}' +
        '.site-nav-head button{width:2.2rem;height:2.2rem;border:0;border-radius:999px;background:rgba(255,255,255,.15);color:#fff;' +
        'cursor:pointer;display:flex;align-items:center;justify-content:center}' +
        '.site-nav-head button:hover,.site-nav-head button:focus-visible{background:rgba(255,255,255,.3)}' +
        '.site-nav-pin[aria-pressed="true"]{background:#fff;color:#00a29a}' +
        '.site-nav-pin[aria-pressed="true"]:hover{background:#e6f6f5}' +
        '.site-nav-body{flex:1;overflow:auto;overscroll-behavior:contain;padding:.4rem}' +
        '.site-nav-body ul{list-style:none;margin:0;padding:0}' +
        '.site-nav-row{display:flex;align-items:center}' +
        '.site-nav-row .site-nav-link{flex:1}' +
        '.site-nav-link,.site-nav-page>button,.site-nav-page>a{display:block;width:100%;box-sizing:border-box;text-align:left;' +
        'padding:.6rem .75rem;border:0;border-radius:8px;background:none;color:var(--sn-fg)!important;font:inherit;' +
        'text-decoration:none!important;cursor:pointer}' +
        '.site-nav-link:hover,.site-nav-link:focus-visible,.site-nav-page>button:hover,.site-nav-page>button:focus-visible,' +
        '.site-nav-page>a:hover,.site-nav-page>a:focus-visible,.site-nav-expand:hover,.site-nav-expand:focus-visible{background:var(--sn-hover)}' +
        '.site-nav-link[aria-current]{color:#00a29a!important;box-shadow:inset 3px 0 0 #00a29a}' +
        '.site-nav-expand{flex:none;width:2.4rem;height:2.4rem;border:0;border-radius:8px;background:none;color:var(--sn-muted);cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center}' +
        '.site-nav-expand svg{transition:transform .15s}' +
        '.site-nav-group.open .site-nav-expand svg{transform:rotate(180deg)}' +
        '.site-nav-sub{display:none;margin:0 0 .2rem .75rem!important;padding-left:.5rem!important;border-left:2px solid var(--sn-line)}' +
        '.site-nav-group.open .site-nav-sub{display:block}' +
        '.site-nav-sub .site-nav-link,.site-nav-toc .site-nav-link{font-weight:500;padding:.5rem .75rem}' +
        '.site-nav-toc,.site-nav-page{border-top:1px solid var(--sn-line);margin-top:.4rem;padding-top:.4rem}' +
        '.site-nav-toc:empty,.site-nav-page:empty{display:none}' +
        '.site-nav-toc::before,.site-nav-page::before{content:"On this page";display:block;padding:.35rem .75rem .2rem;color:var(--sn-muted);' +
        'font-size:12px;text-transform:uppercase;letter-spacing:.04em}' +
        '.site-nav-page::before{content:"This page"}' +
        // Polish settings: the Show Ukrainian switch.
        '.site-nav-settings{border-top:1px solid var(--sn-line);margin-top:.4rem;padding-top:.4rem}' +
        '.site-nav-settings::before{content:"Polish settings";display:block;padding:.35rem .75rem .2rem;color:var(--sn-muted);' +
        'font-size:12px;text-transform:uppercase;letter-spacing:.04em}' +
        '.site-nav-switch{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.6rem .75rem;' +
        'border-radius:8px;cursor:pointer;user-select:none}' +
        '.site-nav-switch:hover{background:var(--sn-hover)}' +
        '.site-nav-switch input{appearance:none;-webkit-appearance:none;margin:0;flex:none;width:38px;height:22px;border-radius:11px;' +
        'background:var(--sn-muted);position:relative;cursor:pointer;transition:background .15s}' +
        '.site-nav-switch input::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;' +
        'background:#fff;transition:transform .15s}' +
        '.site-nav-switch input:checked{background:#00a29a}' +
        '.site-nav-switch input:checked::after{transform:translateX(16px)}' +
        '.site-nav-switch input:focus-visible{outline:2px solid #00a29a;outline-offset:2px}' +
        '.site-nav-pin{display:none!important}' +
        '@media (min-width:1000px){.site-nav-pin{display:flex!important}' +
        // Pinned: the panel stays open and the page moves right to make room for it.
        'html.site-nav-pinned{padding-left:var(--site-nav-panel-w)}' +
        'html.site-nav-pinned .site-nav-panel{width:var(--site-nav-panel-w);box-shadow:1px 0 0 var(--sn-line)}' +
        'html.site-nav-pinned .site-nav-burger,html.site-nav-pinned .site-nav-close,html.site-nav-pinned .site-nav-backdrop{display:none!important}}' +
        '@media (max-width:420px){.site-nav-burger-label{display:none}}' +
        '@media (prefers-reduced-motion:reduce){.site-nav-panel,.site-nav-backdrop{transition:none!important}}' +
        '@media print{.site-nav,.site-nav-panel,.site-nav-backdrop{display:none!important}html.site-nav-pinned{padding-left:0}}';
    document.head.appendChild(style);

    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site');
    nav.innerHTML =
        '<button type="button" class="site-nav-burger" aria-expanded="false" aria-controls="site-nav-panel" aria-label="Menu">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
        '<span class="site-nav-burger-label">Menu</span></button>' +
        // The home page has nowhere to go back to.
        (isHome ? '' : '<a href="' + start + '" class="site-nav-back">&larr; Back</a><a href="' + start + '">Home</a>');

    var panel = document.createElement('aside');
    panel.className = 'site-nav-panel';
    panel.id = 'site-nav-panel';
    panel.setAttribute('aria-label', 'Site menu');
    panel.innerHTML =
        '<div class="site-nav-head"><strong>Menu</strong>' +
        '<button type="button" class="site-nav-pin" aria-pressed="false" title="Keep the menu open beside the page" aria-label="Pin menu">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6M10 4v6l-3 4h10l-3-4V4M12 14v6"/></svg></button>' +
        '<button type="button" class="site-nav-close" aria-label="Close menu">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
        '<div class="site-nav-body site-nav-menu">' +
        '<ul>' + SECTIONS.map(section).join('') + '</ul>' +
        (inPolish ? '<div class="site-nav-settings"><label class="site-nav-switch">' +
            '<span>Show Ukrainian</span><input type="checkbox" role="switch" class="site-nav-uk"></label></div>' : '') +
        '<ul class="site-nav-toc"></ul>' +
        '<div class="site-nav-page"></div></div>';
    var backdrop = document.createElement('div');
    backdrop.className = 'site-nav-backdrop';

    var burger = nav.querySelector('.site-nav-burger');
    var menu = panel.querySelector('.site-nav-body');
    var pinButton = panel.querySelector('.site-nav-pin');
    var toc = panel.querySelector('.site-nav-toc');

    // "On this page": the page's own list of section links (the chips under a page's heading, in an
    // element with an id ending in "-contents"), so a long page can be crossed without scrolling up.
    function fillToc() {
        var links = document.querySelectorAll('[id$="-contents"] a[href^="#"]');
        toc.innerHTML = '';
        Array.prototype.forEach.call(links, function (a) {
            var li = document.createElement('li');
            var copy = document.createElement('a');
            copy.className = 'site-nav-link';
            copy.href = a.getAttribute('href');
            copy.textContent = a.textContent;
            if (a.lang) copy.lang = a.lang;
            copy.dataset.say = 'off';
            li.appendChild(copy);
            toc.appendChild(li);
        });
    }

    var wantPinned = false;
    try { wantPinned = localStorage.getItem(PIN_KEY) === '1'; } catch (e) { /* storage blocked */ }
    function pinned() { return wantPinned && PIN_MEDIA.matches; }

    var lastFocus = null;
    function setOpen(open) {
        if (pinned()) open = true;
        if (open && !panel.classList.contains('open')) fillToc();
        panel.classList.toggle('open', open);
        backdrop.classList.toggle('open', open && !pinned());
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        // An overlay panel keeps focus inside it; a pinned one is just part of the page.
        if (open && !pinned()) {
            lastFocus = document.activeElement;
            panel.querySelector('.site-nav-close').focus({ preventScroll: true });
        } else if (!open && lastFocus && panel.contains(document.activeElement)) {
            lastFocus.focus({ preventScroll: true });
        }
    }
    function applyPin() {
        var on = pinned();
        root.classList.toggle('site-nav-pinned', on);
        pinButton.setAttribute('aria-pressed', on ? 'true' : 'false');
        pinButton.setAttribute('aria-label', on ? 'Unpin menu' : 'Pin menu');
        pinButton.title = on ? 'Let the menu slide away' : 'Keep the menu open beside the page';
        root.style.setProperty('--site-nav-w', on ? 'var(--site-nav-panel-w)' : '0px');
        setOpen(on);
    }
    pinButton.addEventListener('click', function () {
        wantPinned = !pinned();
        try { localStorage.setItem(PIN_KEY, wantPinned ? '1' : '0'); } catch (e) { /* storage blocked */ }
        applyPin();
        if (!wantPinned) setOpen(false);
    });
    if (PIN_MEDIA.addEventListener) PIN_MEDIA.addEventListener('change', applyPin);
    else if (PIN_MEDIA.addListener) PIN_MEDIA.addListener(applyPin);

    burger.addEventListener('click', function () { setOpen(!panel.classList.contains('open')); });
    panel.querySelector('.site-nav-close').addEventListener('click', function () { setOpen(false); });
    backdrop.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('open') && !pinned()) {
            setOpen(false);
            burger.focus();
        }
    });
    menu.addEventListener('click', function (e) {
        var expand = e.target.closest('.site-nav-expand');
        if (expand) {
            var group = expand.closest('.site-nav-group');
            var open = !group.classList.contains('open');
            group.classList.toggle('open', open);
            expand.setAttribute('aria-expanded', open ? 'true' : 'false');
        } else if (e.target.closest('a, button') && !pinned()) {
            setOpen(false);
        }
    });

    // Show Ukrainian: one switch for the whole Polish section, off unless the visitor turns it on.
    // Saved as polish.ukrainian ("on" / "off"); polish.css hides every [lang="uk"] until
    // html.pl-show-uk is set, and polish/common.js listens for "polish-uk-change".
    var ukSwitch = panel.querySelector('.site-nav-uk');
    function ukOn() {
        try { return localStorage.getItem('polish.ukrainian') === 'on'; } catch (e) { return false; }
    }
    function applyUk() {
        var on = ukOn();
        root.classList.toggle('pl-show-uk', on);
        if (ukSwitch) ukSwitch.checked = on;
    }
    if (ukSwitch) {
        applyUk();
        ukSwitch.addEventListener('change', function () {
            try { localStorage.setItem('polish.ukrainian', ukSwitch.checked ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
            applyUk();
            window.dispatchEvent(new CustomEvent('polish-uk-change', { detail: { show: ukSwitch.checked } }));
        });
        window.addEventListener('polish-uk-change', applyUk);
        window.addEventListener('storage', function (e) { if (e.key === 'polish.ukrainian' || e.key === null) applyUk(); });
    }

    // Other scripts (the Polish "All topics" button) can open the panel.
    window.SiteNav = {
        open: function () { setOpen(true); },
        close: function () { setOpen(false); }
    };

    // The Polish sub-list comes from polish/pages.js (window.POLISH_PAGES), so a page added there
    // shows up here too; pages still being built (ready: false) and entries marked menu: false (a
    // variant reached from inside another page) are left out. Polish pages load
    // that script themselves; every other page fetches it just for the menu.
    var polishIndex = SECTIONS.findIndex(function (s) { return s.polish; });
    function fillPolish() {
        var pages = window.POLISH_PAGES;
        if (!pages || polishIndex < 0) return;
        var item = SECTIONS[polishIndex];
        item.children = pages.filter(function (p) { return p.ready !== false && p.menu !== false; })
            .map(function (p) {
                var variants = [p.learn, p.quiz].filter(Boolean)
                    .map(function (v) { return item.href + v.path; });
                return { title: p.title, href: item.href + p.path, also: variants };
            });
        var li = menu.querySelector('[data-section="' + polishIndex + '"]');
        if (li) li.outerHTML = section(item, polishIndex);
    }
    if (window.POLISH_PAGES) {
        fillPolish();
    } else if (polishIndex >= 0) {
        var pagesScript = document.createElement('script');
        pagesScript.src = home + SECTIONS[polishIndex].href + 'pages.js';
        pagesScript.onload = fillPolish;
        document.head.appendChild(pagesScript);
    }

    // Go back in history when the visitor came from this site, otherwise go home. Pages that send
    // no referrer (the Polish ones) leave document.referrer empty, so this tab also remembers that
    // it has already been on the site.
    var seen = false;
    try {
        seen = sessionStorage.getItem('site-nav-seen') === '1';
        sessionStorage.setItem('site-nav-seen', '1');
    } catch (e) { /* storage blocked */ }
    var back = nav.querySelector('.site-nav-back');
    if (back) back.addEventListener('click', function (e) {
        var fromSite = seen || (document.referrer && new URL(document.referrer).origin === location.origin);
        if (fromSite && history.length > 1) {
            e.preventDefault();
            history.back();
        }
    });

    // Stretch the bar edge to edge even when the page gives <body> a margin or padding.
    var body = getComputedStyle(document.body);
    var top = parseFloat(body.marginTop) + parseFloat(body.paddingTop);
    var left = parseFloat(body.marginLeft) + parseFloat(body.paddingLeft);
    var right = parseFloat(body.marginRight) + parseFloat(body.paddingRight);
    nav.style.margin = '-' + top + 'px -' + right + 'px ' + top + 'px -' + left + 'px';

    document.body.insertBefore(nav, document.body.firstChild);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    // Pages with their own fixed header (the CV) use this to sit below the bar.
    root.style.setProperty('--site-nav-h', nav.offsetHeight + 'px');
    applyPin();
    // Pages that build their contents after loading (cases, this & that) fill "On this page" later.
    if (pinned()) window.addEventListener('load', fillToc);
})();
