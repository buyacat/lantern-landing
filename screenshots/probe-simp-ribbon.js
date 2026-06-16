/* Verify the council's Simplify-payoff change on desktop (1520x800 reference):
   1) the LEFT explanatory copy (.hero-copy-p2) stays visible through the payoff
   2) the "We made the living dictionary" ribbon (#hero-simp-ribbon) rises pinned to
      the browser's bottom edge (not over the left column)
   3) the ribbon then crossfades into the "Next: Translate" pill (#hero-simp-next) */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'simp-ribbon');
fs.mkdirSync(OUT, { recursive: true });

const geo = () => {
  const opa = el => el ? parseFloat(getComputedStyle(el).opacity) : null;
  const r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(q.bottom), left: Math.round(q.left), right: Math.round(q.right), cx: Math.round(q.left + q.width / 2) }; };
  const br = document.querySelector('#hero .browser');
  const rib = document.getElementById('hero-simp-ribbon');
  const p2 = document.querySelector('#hero .hero-copy-p2');
  const nx = document.getElementById('hero-simp-next');
  return {
    p2Opacity: opa(p2),
    ribOpacity: opa(rib), ribRect: r(rib), ribText: rib && rib.textContent.trim(),
    nextShow: nx ? nx.classList.contains('show') : null, nextOpacity: opa(nx),
    brRect: r(br),
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1520, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  // returning visitor → no onboarding gate; gloss in UK
  await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2500);
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1400);
  // click the orange simplify dot
  await page.evaluate(() => { const d = document.getElementById('hero-simp-dot'); if (d) d.click(); });

  let sawRibbon = false, sawNext = false;
  for (let t = 0; t <= 8000; t += 250) {
    await page.waitForTimeout(250);
    const g = await page.evaluate(geo);
    const ribVis = g.ribOpacity > 0.5;
    const nextVis = g.nextShow && g.nextOpacity > 0.5;
    if (ribVis && !sawRibbon) {
      sawRibbon = true;
      const edgeGap = g.ribRect.top - g.brRect.bottom;          // ~0 = straddling the bottom edge
      const centred = Math.abs(g.ribRect.cx - g.brRect.cx);     // ~0 = centred on the browser
      const overLeft = g.ribRect.right < g.brRect.left;         // true would mean it sits over the left column (bad)
      console.log(`RIBBON @${t}ms: p2Opacity=${g.p2Opacity} ribText="${g.ribText}" edgeGap=${edgeGap} centredOffset=${centred} overLeftColumn=${overLeft}`);
      await page.screenshot({ path: path.join(OUT, 'desk-ribbon.png') });
    }
    if (nextVis && !sawNext) {
      sawNext = true;
      console.log(`NEXT   @${t}ms: ribOpacity=${g.ribOpacity} (should be fading) p2Opacity=${g.p2Opacity} nextShow=${g.nextShow}`);
      await page.screenshot({ path: path.join(OUT, 'desk-next.png') });
    }
  }
  if (!sawRibbon) console.log('FAIL: ribbon never reached visible opacity');
  if (!sawNext) console.log('FAIL: Next pill never reached visible opacity');
  await ctx.close();
  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
