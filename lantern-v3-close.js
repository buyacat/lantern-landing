/* ============================================================
   Lantern Landing v3 — THE CLOSE
   Self-builds the install button content (Chrome mark + label + arrow).
   The old "day one" reading-streak row was removed — the install button
   is the whole CTA now.
   ============================================================ */
(function () {
  /* official Google Chrome mark (Feb-2022 brand SVG): gradient spokes + precise
     path coords so the red/green/yellow segments tile seamlessly. The old hand
     -trimmed flat-colour version left thin "scratch" gaps radiating from the hub.
     Gradient IDs are namespaced (chr-*) so they can't clash with page ids. */
  var CHROME =
    '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="chr-a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d93025"/><stop offset="1" stop-color="#ea4335"/></linearGradient>' +
    '<linearGradient id="chr-b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fcc934"/><stop offset="1" stop-color="#fbbc04"/></linearGradient>' +
    '<linearGradient id="chr-c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1e8e3e"/><stop offset="1" stop-color="#34a853"/></linearGradient>' +
    '</defs>' +
    '<circle cx="24" cy="23.9947" r="12" fill="#fff"/>' +
    '<path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" fill="url(#chr-a)"/>' +
    '<circle cx="24" cy="24" r="9.5" fill="#1a73e8"/>' +
    '<path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" fill="url(#chr-b)"/>' +
    '<path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" fill="url(#chr-c)"/>' +
    '</svg>';
  var ARROW =
    '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
    'stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 6l6 6-6 6"/></svg>';

  function init() {
    var wrap = document.querySelector('.d1-wrap');
    if (!wrap || wrap.dataset.built) return;
    wrap.dataset.built = '1';

    // ---- build the install button content (chrome mark + label + arrow) ----
    var btn = wrap.querySelector('[data-cta]');
    if (btn && !btn.childElementCount) {
      var c = document.createElement('span'); c.className = 'd1-chrome'; c.innerHTML = CHROME;
      var t = document.createElement('span'); t.textContent = 'Add Lantern to Chrome';
      var a = document.createElement('span'); a.className = 'd1-arrow'; a.innerHTML = ARROW;
      btn.append(c, t, a);
    }

    // streak mechanic removed — the install button is the whole CTA now.
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}   // re-measure section height
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
