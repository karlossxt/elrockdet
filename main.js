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

})();
