/* Verify: mobile strip card entrance animation start state.
   Captures the transform applied BEFORE .in is added (the start state).
   With the fix, should be scale(0.85) not translateX(16px) scale(0.96). */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const OUT = path.join(__dirname, 'mob-anim-state');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);

  // Jump to P2, wait for deck to settle
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(1));
  await page.waitForTimeout(2800);

  // Intercept Shelf.add to capture the card's transform BEFORE .in is added
  const startTransform = await page.evaluate(() => {
    return new Promise(resolve => {
      const origAdd = window.Shelf.add;
      window.Shelf.add = function(lemma, opts) {
        const card = origAdd.call(this, lemma, opts);
        // Capture style IMMEDIATELY after appendChild (synchronous, before rAF)
        const cs = getComputedStyle(card);
        const info = {
          classes: [...card.classList].join(' '),
          transform: cs.transform,
          opacity: cs.opacity,
          computedTransform: cs.transform,
        };
        // Restore
        window.Shelf.add = origAdd;
        resolve(info);
        return card;
      };
      window.Shelf.add('saturation');
    });
  });

  console.log('Start state (before .in):', JSON.stringify(startTransform, null, 2));

  // Small delay to let the rAF fire
  await page.waitForTimeout(100);

  const afterIn = await page.evaluate(() => {
    const card = document.querySelector('.wd-card[data-w="saturation"]');
    if (!card) return null;
    const cs = getComputedStyle(card);
    return {
      classes: [...card.classList].join(' '),
      transform: cs.transform,
      opacity: cs.opacity,
    };
  });
  console.log('\nAfter .in added:', JSON.stringify(afterIn, null, 2));

  await page.waitForTimeout(700);
  const settled = await page.evaluate(() => {
    const card = document.querySelector('.wd-card[data-w="saturation"]');
    if (!card) return null;
    const cs = getComputedStyle(card);
    const r = card.getBoundingClientRect();
    return {
      classes: [...card.classList].join(' '),
      transform: cs.transform,
      opacity: cs.opacity,
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  });
  console.log('\nSettled state:', JSON.stringify(settled, null, 2));

  await page.screenshot({ path: path.join(OUT, 'settled.png') });
  await browser.close();
  console.log('\ndone ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
