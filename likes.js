/* ============================================
   EL ROCK DE TODOS LOS DÍAS — likes.js
   Botón de likes para notas vía Supabase RPC
   ============================================ */

(function () {
    'use strict';

    /* --- CONFIGURACIÓN: pega tus claves de Supabase ---
       Supabase Dashboard > Project Settings > API */
    var SUPABASE_URL = 'https://qllxthykvdyvkrxovxcn.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsbHh0aHlrdmR5dmtyeG92eGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzA4MTUsImV4cCI6MjEwMzEwNjgxNX0.lL1ZbEWaLLWM6DC1U0EeTwDNQuDYkFCXRaWA6v91dAI';
    /* -------------------------------------------------- */

    if (!SUPABASE_URL || SUPABASE_URL.indexOf('http') !== 0 || !SUPABASE_ANON_KEY) return;

    if (!document.querySelector('.btn-cerrar')) return;

    var slug = window.location.pathname
        .replace(/\.html$/, '')
        .replace(/^\/|\/$/g, '')
        .replace(/\//g, '-') || 'home';

    var storageKey = 'erd_like_' + slug;

    var css = document.createElement('style');
    css.textContent =
        '.erd-like{position:fixed;left:18px;bottom:95px;z-index:9998;' +
        'display:flex;align-items:center;gap:8px;padding:10px 16px;' +
        "font-family:'Space Mono',monospace;font-size:12px;font-weight:700;" +
        'letter-spacing:2px;color:#00ff00;background:rgba(0,0,0,.9);' +
        'border:1px solid #00ff00;cursor:pointer;text-transform:uppercase;' +
        'transition:box-shadow .15s}' +
        '.erd-like:hover{box-shadow:0 0 14px rgba(0,255,0,.5)}' +
        '.erd-like .erd-heart{color:#df2525;font-size:15px;line-height:1;' +
        'transition:transform .15s;display:inline-block}' +
        '.erd-like.erd-liked{color:#fff;border-color:#df2525}' +
        '@keyframes erdpop{50%{transform:scale(1.7)}}' +
        '.erd-like.erd-pop .erd-heart{animation:erdpop .3s}' +
        '@media(max-width:640px){.erd-like{left:12px;bottom:85px;padding:8px 12px;font-size:10px}}';
    document.head.appendChild(css);

    var btn = document.createElement('button');
    btn.className = 'erd-like';
    btn.setAttribute('aria-label', 'Dar like a esta nota');
    btn.innerHTML = '<span class="erd-heart">&#9825;</span><span class="erd-count">&middot;&middot;&middot;</span>';
    document.body.appendChild(btn);

    var heartEl = btn.querySelector('.erd-heart');
    var countEl = btn.querySelector('.erd-count');
    var liked = false;

    try { liked = localStorage.getItem(storageKey) === '1'; } catch (e) { liked = false; }
    if (liked) {
        btn.classList.add('erd-liked');
        heartEl.innerHTML = '&#9829;';
    }

    function rpc(fn, slugArg, cb) {
        fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_slug: slugArg })
        })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(cb)
            .catch(function () {
                countEl.textContent = '--';
            });
    }

    rpc('get_likes', slug, function (n) {
        countEl.textContent = n;
    });

    btn.addEventListener('click', function () {
        if (liked) return;
        liked = true;
        try { localStorage.setItem(storageKey, '1'); } catch (e) {}
        var current = parseInt(countEl.textContent, 10);
        if (!isNaN(current)) countEl.textContent = current + 1;
        rpc('add_like', slug, function (n) {
            countEl.textContent = n;
        });
        btn.classList.add('erd-liked', 'erd-pop');
        heartEl.innerHTML = '&#9829;';
        setTimeout(function () { btn.classList.remove('erd-pop'); }, 350);
    });
})();
