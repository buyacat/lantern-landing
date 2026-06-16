/* Verify: across phone heights, the browser never overlaps the vocab strip and
   the strip never overlaps the scrubber; and no word chip clips its word. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'vocab-fit');
fs.mkdirSync(OUT, { recursive: true });

const NAMES = ['HOME','SIMPLIFY','TRANSLATE','IMMERSE','DISCUSS','PRACTICE','EVERYWHERE','INSTALL'];
const DEVICES = [[360,640,'360x640'],[375,667,'iphSE'],[412,732,'pixel'],[390,844,'iph14']];

(async () => {
  const browser = await chromium.launch();
  for (const [W,H,tag] of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGEERROR:', e.message));
    await page.goto('file:///C:/Landing%20Lantern/index.html');
    await page.waitForTimeout(3200);
    await page.evaluate(() => {
      if (window.LanternPhases) window.LanternPhases.jump(1);
      if (window.Shelf) ['phenomenon','genre','devoted','legacy','immersion','vocabulary'].forEach(w => { try { window.Shelf.add(w); } catch(e){} });
      if (window.Shelf && window.Shelf.reveal) window.Shelf.reveal();
    });
    await page.waitForTimeout(1200);
    for (const i of [2,5]) { // TRANSLATE + PRACTICE (tallest text)
      await page.evaluate((n) => { if (window.LanternPhases) window.LanternPhases.jump(n); }, i);
      await page.waitForTimeout(1400);
      const geo = await page.evaluate(() => {
        const r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(q.bottom) }; };
        const b = r(document.querySelector('#hero .browser')), v = r(document.getElementById('worddeck')), n = r(document.querySelector('.m-navcluster'));
        const ov = (a, c) => (a && c) ? Math.max(0, Math.round(a.bottom - c.top)) : 0;
        const clips = [...document.querySelectorAll('#worddeck .wd-card')].map(c => {
          const w = c.querySelector('.wd-w');
          return { word: w && w.textContent.trim(), cw: Math.round(c.getBoundingClientRect().width), clipped: w ? w.scrollWidth > w.clientWidth + 1 : null };
        });
        return { brIntoVocab: ov(b,v), vocabIntoNav: ov(v,n), anyClip: clips.some(c=>c.clipped), clips };
      });
      console.log(`${tag} P${i} ${NAMES[i]}: brIntoVocab=${geo.brIntoVocab} vocabIntoNav=${geo.vocabIntoNav} anyClip=${geo.anyClip}`);
      if (geo.anyClip || geo.brIntoVocab || geo.vocabIntoNav) console.log('   ', JSON.stringify(geo.clips));
      await page.screenshot({ path: path.join(OUT, `fix-${tag}-p${i}.png`) });
    }
    await ctx.close();
  }
  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
