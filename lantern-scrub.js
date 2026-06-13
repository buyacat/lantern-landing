/* ============================================================
   Lantern Landing — mobile phase SCRUBBER (main.html)
   A timeline bar above the footer: drag the amber bead anywhere
   and the demo PLAYS every phase on the way there — speed-capped,
   one phase per DWELL ms, so a full-track fling still shows the
   whole story. The bead is the truth (current phase); a hollow
   ring marks your goal while the demo catches up. Tap a spot on
   the track = same thing without the drag.
   Needs window.LanternPhases (main.html inline) + .m-scrub styles.
   ============================================================ */
(function () {
  var N = 7;                       /* phases 0..6 */
  var DWELL = 1150;                /* manual drag/tap speed cap between phase steps */
  var BREATH = 600;               /* PLAY: beat after a scene finishes before the next */
  var MAX_SCENE = 18000;          /* PLAY: safety cap so a stuck scene can't hang the reel */
  var NAMES = ['HOME', 'SIMPLIFY', 'TRANSLATE', 'DISCUSS', 'PRACTICE', 'EVERYWHERE', 'INSTALL'];

  function init() {
    var scrub = document.getElementById('m-scrub');
    var LP = window.LanternPhases;
    if (!scrub || !LP) return;
    if (window.innerWidth > 920) return;          /* mobile-only, init-time gate */

    var track = scrub.querySelector('.m-scrub-track');
    var fill  = scrub.querySelector('.m-scrub-fill');
    var ball  = scrub.querySelector('.m-scrub-ball');
    var cap   = document.getElementById('m-phase-caption');
    if (!track || !fill || !ball) return;

    /* notches + the goal ring */
    var ticks = [];
    for (var i = 0; i < N; i++) {
      var t = document.createElement('div');
      t.className = 'm-scrub-tick';
      t.style.left = (i / (N - 1) * 100) + '%';
      track.appendChild(t);
      ticks.push(t);
    }
    var goal = document.createElement('div');
    goal.className = 'm-scrub-goal';
    track.appendChild(goal);
    track.appendChild(ball);                       /* keep the bead on top */

    var target = LP.get();                         /* where the user pointed */
    var lastStep = 0;
    var lastBusy = 0;                              /* last moment a scene was performing — BREATH measured from here */
    var dragging = false;
    var playing = false;                           /* PLAY owns the chase + drives the runway */

    function pct(p) { return (p / (N - 1) * 100) + '%'; }

    function render() {
      var cur = LP.get();
      if (!dragging) {
        ball.style.left = pct(cur);
        fill.style.width = pct(cur);
      }
      ticks.forEach(function (t, i) { t.classList.toggle('passed', i <= cur); });
      var chasing = (cur !== target);
      scrub.classList.toggle('chasing', chasing);
      if (chasing) goal.style.left = pct(target);
    }

    /* keep the scroll runway (and so the bead's resting scroll position) under
       the current phase while PLAY drives — without letting that programmatic
       scroll feed back in and re-drive phases */
    function syncRunway(p) {
      if (window.LanternCrank && window.LanternCrank.syncTo) {
        window.LanternCrank.suppress(900);
        window.LanternCrank.syncTo(p);
      }
    }

    /* chase engine — two cadences:
       - PLAY forward = cinema: step only once the phase's scripted scene has
         played out (LP.actionPlaying() clears), then a BREATH; a safety cap
         steps anyway if a scene forgets to release.
       - drag / tap / rewind = snappy: DWELL-capped, only gated by busy(). */
    var rafId = 0;
    function chase() {
      rafId = 0;
      var cur = LP.get();
      if (cur === target) { render(); if (playing) stopPlay(); return; }
      var now = performance.now(), dir = cur < target ? 1 : -1, ready;
      if (playing && dir > 0) {
        if (now - lastStep >= MAX_SCENE) ready = true;       /* safety cap fires even mid-scene */
        else if (LP.busy() || LP.actionPlaying()) { lastBusy = now; ready = false; }
        else ready = (now - lastBusy >= BREATH);
      } else {
        ready = (now - lastStep >= DWELL) && !LP.busy();
      }
      if (ready && LP.step(dir)) {
        lastStep = now; lastBusy = now;
        /* NB: don't scroll the runway here — a leaked scroll event would feed
           back through the crank handler and reset target to the current
           phase, silently halting the reel. The bead shows the phase; the
           runway is re-synced only when PLAY stops (chase no longer running). */
        render();
      }
      rafId = requestAnimationFrame(chase);
    }
    function kick() { if (!rafId) rafId = requestAnimationFrame(chase); }

    /* finger → fraction of the track */
    function frac(e) {
      var r = track.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      return Math.max(0, Math.min(1, x));
    }
    function setTarget(f) {
      var t = Math.round(f * (N - 1));
      if (t !== target) {
        target = t;
        if (cap && NAMES[t]) cap.textContent = '0' + (t + 1) + ' · ' + NAMES[t];
      }
    }

    var pointerDownX = 0, pointerDownY = 0, wasDrag = false;
    scrub.addEventListener('pointerdown', function (e) {
      stopPlay();                                  /* grabbing the bead = take control */
      dragging = true; wasDrag = false;
      pointerDownX = e.clientX; pointerDownY = e.clientY;
      scrub.classList.add('drag');
      try { scrub.setPointerCapture(e.pointerId); } catch (err) {}
      var f = frac(e);
      ball.style.left = (f * 100) + '%';
      fill.style.width = (f * 100) + '%';
      setTarget(f);
      kick();
      e.preventDefault();
    });
    scrub.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - pointerDownX) > 4 || Math.abs(e.clientY - pointerDownY) > 4) wasDrag = true;
      var f = frac(e);
      ball.style.left = (f * 100) + '%';
      fill.style.width = (f * 100) + '%';
      setTarget(f);
      kick();
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      scrub.classList.remove('drag');
      /* tap (no movement) → jump directly; drag → let chase walk there */
      if (!wasDrag && LP.jump) {
        LP.jump(target);
        render();
      } else {
        render();
        kick();
      }
    }
    scrub.addEventListener('pointerup', release);
    scrub.addEventListener('pointercancel', release);

    /* phases also move by swipe/tap — keep the bead in sync. When no chase is
       in flight, any phase drift came from outside: adopt it as the new goal
       (a swipe mid-chase keeps the chase goal — it'll converge anyway). */
    setInterval(function () {
      if (dragging) return;
      if (!rafId && LP.get() !== target) target = LP.get();
      render();
    }, 300);

    /* ── CRANK: native scroll = the barrel-organ handle. The runway (#m-crank)
       gives the page real scroll height; finger position along it = goal phase;
       the same chase engine walks the story there, speed-capped — a full-track
       fling still plays every beat on the way. ── */
    var playBtn = document.getElementById('m-playbtn');
    var progScroll = false;
    function crankRange() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

    var crank = document.getElementById('m-crank');
    var crankSuppressUntil = 0;
    if (crank) {
      window.__mCrank = true;        /* tells main.html: drive phases here, not via discrete wheel */
      var lastScrollTs = 0;
      window.addEventListener('scroll', function () {
        if (progScroll) { progScroll = false; return; }
        if (performance.now() < crankSuppressUntil) return;   /* a swipe is stepping discretely — ignore its momentum */
        lastScrollTs = performance.now();
        setTarget(Math.max(0, Math.min(1, window.scrollY / crankRange())));
        kick();
      }, { passive: true });
      /* a swipe is ~half a flick but a phase is ~80vh of runway, so flicks rarely
         cross a boundary. index.html's touch handler steps the phase directly and
         then calls these to snap the runway to it + swallow the leftover momentum. */
      window.LanternCrank = {
        syncTo: function (p) {
          var y = Math.round(Math.max(0, Math.min(N - 1, p)) / (N - 1) * crankRange());
          progScroll = true; window.scrollTo(0, y);
        },
        suppress: function (ms) { crankSuppressUntil = performance.now() + (ms || 650); }
      };
      /* phase moved some other way (track tap, CTA back) → quietly bring the
         scroll position along so the next flick continues from the right spot */
      setInterval(function () {
        if (dragging || playing) return;
        if (performance.now() - lastScrollTs < 700) return;
        var want = target / (N - 1) * crankRange();
        if (Math.abs(window.scrollY - want) > 8) { progScroll = true; window.scrollTo(0, want); }
      }, 350);
    }

    /* ── PLAY = cinema: the chase engine walks the whole story, but each screen
       waits for its scripted scene to finish (LP.actionPlaying clears) before
       the next — so it reads like a film, not a flick-book. The runway scrolls
       to follow. Any real touch / wheel / key / drag hands control back and
       freezes on the current screen — manual always wins. ── */
    function setPlayUI(on) {
      if (!playBtn) return;
      playBtn.classList.toggle('playing', on);
      playBtn.setAttribute('aria-label', on ? 'Stop' : 'Play the story');
    }
    function stopPlay() {
      if (!playing) return;
      playing = false; window.LanternPlaying = false;
      target = LP.get();                          /* freeze on this screen */
      setPlayUI(false);
      render();
      syncRunway(LP.get());                       /* chase is idle now → safe to bring the runway along */
    }
    function startPlay() {
      var cur = LP.get();
      target = (cur >= N - 1) ? 0 : N - 1;         /* at the end → rewind home; else play to the end */
      lastStep = lastBusy = performance.now();     /* first screen gets its full beat */
      playing = true; window.LanternPlaying = true;
      setPlayUI(true);
      render();
      kick();
    }
    if (playBtn) {
      playBtn.addEventListener('click', function () { if (playing) stopPlay(); else startPlay(); });
      var userInterrupt = function (e) {
        if (!playing) return;
        if (e && e.target && e.target.closest && e.target.closest('.m-playbtn')) return;
        stopPlay();
      };
      window.addEventListener('touchstart', userInterrupt, { passive: true });
      window.addEventListener('wheel', userInterrupt, { passive: true });
      window.addEventListener('keydown', userInterrupt);
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
