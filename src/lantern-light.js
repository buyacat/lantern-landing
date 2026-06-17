/* ============================================================
   Lantern Landing — CURSOR LIGHT (desktop only, whole landing)
   The cursor acts as a soft lantern. A single global light
   DIRECTION is derived from the pointer's position relative to
   the viewport centre, eased frame-to-frame, and exposed as CSS
   vars (--lit-dx / --lit-dy / --lit-a). Elevated surfaces across
   the landing (see the body.lantern-light rules in lantern-v3.css)
   add a faint directional drop-shadow that falls AWAY from the
   light — a quiet lean, never a hard spotlight.

   Opt-OUT (the body class is never added, so the CSS filter never
   attaches and mobile is byte-for-byte unchanged):
     - coarse / no-hover pointers (touch)
     - prefers-reduced-motion
     - narrow viewports (<920px)
   ============================================================ */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;   /* desktop pointers only */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (innerWidth < 920) return;

  var root = document.documentElement;
  var MAXX = 26, MAXY = 16;        /* px offset caps — how far the shadow leans */
  var A_BASE = 0.07, A_GAIN = 0.24; /* extra-shadow alpha: faint near centre, deeper to the edges */
  var EASE = 0.14;                  /* per-frame lerp → smooth, never jumpy */

  var tx = 0, ty = 0, ta = 0;       /* targets from the live pointer */
  var cx = 0, cy = 0, ca = 0;       /* eased current values written to CSS */
  var raf = 0;

  function tick() {
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    ca += (ta - ca) * EASE;
    root.style.setProperty('--lit-dx', cx.toFixed(2) + 'px');
    root.style.setProperty('--lit-dy', cy.toFixed(2) + 'px');
    root.style.setProperty('--lit-a',  ca.toFixed(3));
    /* keep running until settled, then idle (no rAF while the pointer is still) */
    if (Math.abs(tx - cx) > 0.04 || Math.abs(ty - cy) > 0.04 || Math.abs(ta - ca) > 0.0012) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var nx = (e.clientX / innerWidth  - 0.5) * 2;   /* -1 (left) .. 1 (right) */
    var ny = (e.clientY / innerHeight - 0.5) * 2;   /* -1 (top)  .. 1 (bottom) */
    var dist = Math.min(1, Math.sqrt(nx * nx + ny * ny));
    tx = -nx * MAXX;                 /* shadow falls opposite the light */
    ty = -ny * MAXY;
    ta = A_BASE + dist * A_GAIN;     /* centred pointer ≈ light overhead ≈ near-no side shadow */
    kick();
  }, { passive: true });

  /* pointer leaves the window → ease the light back to neutral (no extra shadow) */
  document.addEventListener('mouseleave', function () { tx = 0; ty = 0; ta = 0; kick(); });

  document.body.classList.add('lantern-light');
})();
