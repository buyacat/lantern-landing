/* Capture EARLY frames of mobile HOME screen-1 to catch any "big -> small"
   jump in the hero word-cards on first load. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'repro-screen1');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));

  const log = [];
  await page.goto('file:///C:/Landing%20Lantern/index.html', { waitUntil: 'commit' });

  for (const t of [150, 300, 500, 800, 1200, 2000, 3200]) {
    await page.waitForTimeout(t === 150 ? 150 : 0);
    if (t !== 150) await page.waitForTimeout(t - log.lastT || 0);
  }

  // simpler: sample at fixed intervals
  const stamps = [120, 250, 400, 600, 900, 1400, 2200, 3400];
  let prev = 0;
  for (const s of stamps) {
    await page.waitForTimeout(s - prev); prev = s;
    await page.screenshot({ path: path.join(OUT, `t${String(s).padStart(4,'0')}.png`) });
    const cards = await page.evaluate(() => [...document.querySelectorAll('.hw-card')].map(c => {
      const wc = c.querySelector('.wordcard'); const w = c.querySelector('.w');
      const r = c.getBoundingClientRect();
      return { word: w && w.textContent, cls: wc && wc.className, cardW: wc && wc.style.width,
               wFont: w && getComputedStyle(w).fontSize, boxW: Math.round(r.width), boxH: Math.round(r.height) };
    }));
    console.log(`t=${s}ms n=${cards.length}`, JSON.stringify(cards));
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
