/* Find the Practice phase (body.hero-p5) and verify its subhead shows on mobile. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const URL = 'file:///C:/Landing%20Lantern/index.html';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true
  });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(2600);

  for (let i = 0; i < 8; i++) {
    await page.evaluate(n => window.LanternPhases && window.LanternPhases.jump(n), i);
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => {
      const isP5 = document.body.classList.contains('hero-p5');
      const cap = (document.querySelector('.m-phase-cap, .hx-cap, [class*="cap"]') || {}).textContent || '';
      return { isP5, cap: cap.trim().slice(0, 30) };
    });
    if (info.isP5) {
      await page.waitForTimeout(1400);
      const sub = await page.evaluate(() => {
        const el = document.querySelector('#hero .hero-copy-p5 .p2-sub');
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { display: cs.display, opacity: cs.opacity, top: Math.round(r.top), h: Math.round(r.height), text: (el.textContent||'').slice(0,50) };
      });
      console.log(`jump(${i}) = PRACTICE  cap="${info.cap}"  sub=`, JSON.stringify(sub));
      await page.screenshot({ path: path.join(__dirname, 'p5-sub.png') });
      break;
    }
  }
  await browser.close();
})();
