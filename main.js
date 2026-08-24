/* ============================================
   EL ROCK DE TODOS LOS DÍAS — main.js
   Radio Player + Scroll Reveal + Playlist Rotation
   ============================================ */

(function () {
    'use strict';

    /* -----------------------------------------------
       1. ZENO RADIO PLAYER
    ----------------------------------------------- */
    const radioPlayer = document.getElementById('radioPlayer');
    const zenoAudio = document.getElementById('zenoAudio');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const radioClose = document.getElementById('radioClose');
    const radioToggle = document.getElementById('radioToggle');

    let isPlaying = false;
    let lastScrollY = 0;

    if (playPauseBtn && zenoAudio) {
        zenoAudio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.7;

        playPauseBtn.addEventListener('click', function () {
            if (isPlaying) {
                zenoAudio.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                isPlaying = false;
            } else {
                zenoAudio.load();
                zenoAudio.play().then(function () {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    isPlaying = true;
                }).catch(function () {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            }
        });

        if (volumeSlider) {
            volumeSlider.addEventListener('input', function () {
                zenoAudio.volume = parseFloat(this.value);
            });
        }
    }

    if (radioClose && radioPlayer) {
        radioClose.addEventListener('click', function () {
            radioPlayer.classList.add('hidden');
            if (zenoAudio) {
                zenoAudio.pause();
                isPlaying = false;
            }
        });
    }

    if (radioToggle && radioPlayer) {
        radioToggle.addEventListener('click', function () {
            radioPlayer.classList.toggle('collapsed');
        });
    }

    window.addEventListener('scroll', function () {
        if (!radioPlayer || radioPlayer.classList.contains('hidden')) return;
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            radioPlayer.classList.add('player-hidden');
        } else {
            radioPlayer.classList.remove('player-hidden');
        }
        lastScrollY = currentScrollY;
    }, { passive: true });

    /* -----------------------------------------------
       2. SCROLL REVEAL
    ----------------------------------------------- */
    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
        revealObserver.observe(el);
    });

    /* -----------------------------------------------
       3. PLAYLIST ROTATION (Spotify)
    ----------------------------------------------- */
    const playlists = [
        '153Gvei76OaDP0kMY75GQz',
        '63s4yzQv0fj8S2M5wzxqsl',
        '3bQ3tGi83EdE3eKRWCDi0P',
        '2d9fxhY8UL99jqkeRKyyjL',
        '2r39dbe9CWYhtpunIlFi2l',
        '2OWOGwxthxFvAuTnzcSaK2',
        '67ZQP9hbxurJaFav2ORplH'
    ];

    const playlistEmbeds = document.querySelectorAll('.playlist-embed');
    if (playlistEmbeds.length > 0) {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now - startOfYear;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const weekNumber = Math.floor(diff / oneWeek);
        const playlistIndex = weekNumber % playlists.length;
        const selectedPlaylist = playlists[playlistIndex];

        playlistEmbeds.forEach(function (embed) {
            embed.src = 'https://open.spotify.com/embed/playlist/' + selectedPlaylist + '?utm_source=generator&theme=0';
        });
    }

    /* -----------------------------------------------
       4. MARQUEE PAUSE ON HOVER
    ----------------------------------------------- */
    document.querySelectorAll('.marquee-track').forEach(function (track) {
        track.addEventListener('mouseenter', function () {
            this.style.animationPlayState = 'paused';
        });
        track.addEventListener('mouseleave', function () {
            this.style.animationPlayState = 'running';
        });
    });

    /* -----------------------------------------------
       5. SMOOTH SCROLL FOR ANCHORS
    ----------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* -----------------------------------------------
       6. CERRAR NOTA
       Vuelve atrás si el visitante llegó desde otra
       página del sitio; si no, va al fallback.
   ----------------------------------------------- */
    window.cerrarNota = function (fallback) {
        var cameFromSite = false;
        if (document.referrer) {
            try {
                cameFromSite = new URL(document.referrer).hostname === window.location.hostname;
            } catch (e) {
                cameFromSite = false;
            }
        }
        if (cameFromSite && window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = fallback || 'index.html';
        }
    };

    /* -----------------------------------------------
       7. VISITOR COUNTER (CounterAPI)
   ----------------------------------------------- */
    var viewCounterEl = document.getElementById('view-counter');
    if (viewCounterEl && typeof Counter !== 'undefined') {
        var counter = new Counter({ workspace: 'elrockdetodoslosdias' });
        var pageName = window.location.pathname.replace(/\.html$/, '').replace(/\//g, '-') || 'home';

        counter.up(pageName)
            .then(function (result) {
                viewCounterEl.textContent = result.value;
            })
            .catch(function () {
                viewCounterEl.textContent = '--';
            });
    }

    /* -----------------------------------------------
       8. LIKES DE NOTAS (Supabase)
----------------------------------------------- */
    var mainTag = document.querySelector('script[src*="main.js"]');
    if (mainTag) {
        var likesScript = document.createElement('script');
        likesScript.src = new URL('likes.js', mainTag.src).href;
        likesScript.defer = true;
        document.head.appendChild(likesScript);
    }

    /* -----------------------------------------------
       9. PLAYER UNIFICADO + NOW PLAYING (Zeno)
       Inyecta el estilo canónico del reproductor en
       todas las páginas y muestra el tema al aire.
   ----------------------------------------------- */
    var radioPlayer2 = document.getElementById('radioPlayer');
    if (radioPlayer2 && !document.getElementById('erd-player-css')) {
        var playerCss = document.createElement('style');
        playerCss.id = 'erd-player-css';
        playerCss.textContent =
            '.radio-player{position:fixed;bottom:0;left:0;width:100%;' +
            'background:rgba(0,0,0,.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
            'border-top:2px solid var(--red,#df2525);z-index:2000;' +
            'transition:transform .4s cubic-bezier(.4,0,.2,1)}' +
            '.radio-player.player-hidden{transform:translateY(100%)}' +
            '.radio-player.hidden{display:none}' +
            '.radio-player.collapsed .radio-content{display:none}' +
            '.radio-toggle{display:flex;justify-content:center;padding:4px 0 0;cursor:pointer;color:#555;font-size:10px;transition:.2s}' +
            '.radio-toggle:hover{color:#fff}' +
            '.radio-content{display:flex;align-items:center;gap:15px;padding:12px 30px 14px;max-width:none;margin:0}' +
            '.radio-live-dot{width:8px;height:8px;background:var(--red,#df2525);border-radius:50%;animation:pulse-dot 1.5s ease-in-out infinite;flex-shrink:0}' +
            '@keyframes pulse-dot{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(220,38,38,.6)}50%{opacity:.7;box-shadow:0 0 0 6px rgba(220,38,38,0)}}' +
            ".radio-label{font-family:'Space Mono',monospace;font-size:10px;font-weight:700;" +
            'text-transform:uppercase;color:#888;letter-spacing:1px;white-space:nowrap;flex-grow:0}' +
            ".radio-now-playing{font-family:'Space Mono',monospace;font-size:10px;font-weight:700;" +
            'color:#00ff00;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;' +
            'overflow:hidden;text-overflow:ellipsis;max-width:280px;display:none}' +
            '.radio-play-btn{background:var(--red,#df2525);color:#fff;border:none;width:36px;height:36px;' +
            'border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
            'font-size:14px;transition:.2s;flex-shrink:0}' +
            '.radio-play-btn:hover{background:#b91c1c;transform:scale(1.1)}' +
            '.radio-volume{width:80px;height:4px;-webkit-appearance:none;appearance:none;background:#333;' +
            'border-radius:2px;outline:none;cursor:pointer}' +
            '.radio-volume::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;' +
            'background:#fff;border-radius:50%;cursor:pointer}' +
            '.radio-volume::-moz-range-thumb{width:12px;height:12px;background:#fff;border-radius:50%;cursor:pointer;border:none}' +
            '.radio-close{background:none;border:none;color:#555;cursor:pointer;font-size:14px;transition:.2s;padding:5px}' +
            '.radio-close:hover{color:#fff}' +
            '@media(max-width:768px){.radio-content{padding:10px 15px;gap:10px}' +
            ".radio-label{font-size:8px}.radio-now-playing{font-size:8px;max-width:150px}.radio-volume{width:50px}}" +
            '@media(max-width:480px){.radio-label{display:none}.radio-now-playing{max-width:200px}.radio-volume{width:40px}}';
        document.head.appendChild(playerCss);

        var radioContent = radioPlayer2.querySelector('.radio-content');
        var radioLabel = radioPlayer2.querySelector('.radio-label');
        var nowPlayingEl = null;
        if (radioContent && radioLabel && !radioPlayer2.querySelector('.radio-now-playing')) {
            nowPlayingEl = document.createElement('span');
            nowPlayingEl.className = 'radio-now-playing';
            nowPlayingEl.id = 'radioNowPlaying';
            radioContent.insertBefore(nowPlayingEl, radioLabel.nextSibling);
        }

        if (nowPlayingEl && typeof EventSource !== 'undefined') {
            try {
                var zenoSSE = new EventSource('https://api.zeno.fm/mounts/metadata/subscribe/suqqst6xaq8uv');
                zenoSSE.addEventListener('message', function (ev) {
                    try {
                        var d = JSON.parse(ev.data);
                        var artist = d.artist || d.artist_name || '';
                        var track = d.title || d.track || d.song || '';
                        if (artist || track) {
                            nowPlayingEl.textContent = artist ? artist + ' \u2014 ' + track : track;
                            nowPlayingEl.style.display = 'inline-block';
                        }
                    } catch (e) {}
                });
            } catch (e) {}
        }
    }

    /* -----------------------------------------------
       10. RADIO CONTINUA ENTRE PÁGINAS
       Reanuda la transmisión si el usuario estaba
       escuchando en la página anterior.
   ----------------------------------------------- */
    var RADIO_STATE_KEY = 'erd_radio_state';
    var radioHeartbeat = null;

    function radioSaveState() {
        try {
            localStorage.setItem(RADIO_STATE_KEY, JSON.stringify({
                playing: true,
                vol: zenoAudio ? zenoAudio.volume : 0.7,
                t: Date.now()
            }));
        } catch (e) {}
    }

    function radioClearState() {
        try { localStorage.removeItem(RADIO_STATE_KEY); } catch (e) {}
        if (radioHeartbeat) {
            clearInterval(radioHeartbeat);
            radioHeartbeat = null;
        }
    }

    if (zenoAudio && playPauseBtn) {
        zenoAudio.addEventListener('playing', function () {
            if (radioHeartbeat) clearInterval(radioHeartbeat);
            radioSaveState();
            radioHeartbeat = setInterval(radioSaveState, 1000);
        });

        zenoAudio.addEventListener('pause', radioClearState);
        zenoAudio.addEventListener('error', radioClearState);

        var shouldResume = false;
        try {
            var rawState = localStorage.getItem(RADIO_STATE_KEY);
            if (rawState) {
                var prevState = JSON.parse(rawState);
                if (prevState && prevState.playing && prevState.t &&
                    (Date.now() - prevState.t) < 5000) {
                    shouldResume = true;
                    if (typeof prevState.vol === 'number') {
                        zenoAudio.volume = prevState.vol;
                        if (volumeSlider) volumeSlider.value = String(prevState.vol);
                    }
                }
            }
        } catch (e) {}

        if (shouldResume) {
            zenoAudio.load();
            var resumeAttempt = zenoAudio.play();
            if (resumeAttempt && resumeAttempt.then) {
                resumeAttempt.then(function () {
                    isPlaying = true;
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }).catch(function () {
                    isPlaying = false;
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            }
        }
    }

})();
