// Floating share button. On phones it opens the system share sheet (WhatsApp, Telegram,
// Messages...); elsewhere it shows a small menu to copy the link or send it via an app.
// Include on any page with:
// <script src="<relative path>/js/share.js" defer></script>
(function () {
    var accent = '#00a29a';
    var style = document.createElement('style');
    style.textContent =
        '.site-share{position:fixed;right:1rem;bottom:1rem;z-index:2000;' +
        'font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}' +
        '.site-share-btn{width:48px;height:48px;border:0;border-radius:50%;background:' + accent + ';color:#fff;' +
        'display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
        '.site-share-btn:hover,.site-share-btn:focus-visible{filter:brightness(1.1)}' +
        '.site-share-btn svg{width:22px;height:22px}' +
        '.site-share-menu{position:absolute;right:0;bottom:56px;min-width:180px;background:#fff;border-radius:12px;' +
        'box-shadow:0 4px 16px rgba(0,0,0,.25);padding:.35rem;display:none}' +
        '.site-share.open .site-share-menu{display:block}' +
        '.site-share-menu a,.site-share-menu button{display:block;width:100%;box-sizing:border-box;text-align:left;' +
        'padding:.55rem .75rem;border:0;border-radius:8px;background:none;color:#222!important;font:inherit;' +
        'text-decoration:none!important;cursor:pointer}' +
        '.site-share-menu a:hover,.site-share-menu button:hover,.site-share-menu a:focus,.site-share-menu button:focus{background:#e6f6f5}' +
        '@media print{.site-share{display:none}}';
    document.head.appendChild(style);

    var url = location.href.split('#')[0];
    var title = document.title;
    var text = encodeURIComponent(title + ' ' + url);
    var links = [
        ['WhatsApp', 'https://wa.me/?text=' + text],
        ['Telegram', 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title)],
        ['Email', 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(url)]
    ];

    var box = document.createElement('div');
    box.className = 'site-share';
    box.innerHTML =
        '<div class="site-share-menu" role="menu">' +
        '<button type="button" class="site-share-copy" role="menuitem">Copy link</button>' +
        links.map(function (l) {
            return '<a role="menuitem" target="_blank" rel="noopener" href="' + l[1] + '">' + l[0] + '</a>';
        }).join('') +
        '</div>' +
        '<button type="button" class="site-share-btn" aria-label="Share this page" aria-haspopup="true" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
        '<line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>' +
        '</button>';

    var btn = box.querySelector('.site-share-btn');
    var copy = box.querySelector('.site-share-copy');

    function setOpen(open) {
        box.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
        // Touch devices get the native share sheet, which lists every messaging app installed.
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
            navigator.share({ title: title, url: url }).catch(function () {});
            return;
        }
        setOpen(!box.classList.contains('open'));
    });

    copy.addEventListener('click', function () {
        function done() {
            copy.textContent = 'Link copied!';
            setTimeout(function () { copy.textContent = 'Copy link'; setOpen(false); }, 1200);
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
        } else {
            prompt('Copy this link:', url);
        }
    });

    document.addEventListener('click', function (e) {
        if (!box.contains(e.target) || e.target.closest('.site-share-menu a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setOpen(false);
    });

    document.body.appendChild(box);
})();
