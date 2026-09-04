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
       9. NOW PLAYING (Zeno)
       Muestra el tema al aire. El CSS del reproductor
       vive en styles.css (ya no se inyecta por JS).
   ----------------------------------------------- */
    var radioPlayer2 = document.getElementById('radioPlayer');
    var radioContent = radioPlayer2 ? radioPlayer2.querySelector('.radio-content') : null;
    var radioLabel = radioPlayer2 ? radioPlayer2.querySelector('.radio-label') : null;
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
