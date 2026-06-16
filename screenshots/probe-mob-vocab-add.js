/* Probe: mobile vocab strip — how new words render relative to existing cards.
   Captures before/after state at each P2+ phase. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const OUT = path.join(__dirname, 'mob-vocab-add');
fs.mkdirSync(OUT, { recursive: true });

async function cardInfo(page) {
  return page.evaluate(() => {
    const stack = document.getElementById('wd-stack');
    if (!stack) return { exists: false };
    const sr = stack.getBoundingClientRect();
    const cards = [...stack.querySelectorAll('.wd-card')];
    return {
      stackBox: { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) },
      stackDisplay: getComputedStyle(stack).display,
      stackFlex: getComputedStyle(stack).flexDirection,
      cardCount: cards.length,
      cards: cards.map((c, i) => {
        const r = c.getBoundingClientRect();
        const cs = getComputedStyle(c);
        return {
          i,
          w: c.dataset.w,
          box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          classes: [...c.classList].join(' '),
          margin: cs.marginTop,
          zIndex: cs.zIndex,
          position: cs.position,
        };
      }),
      bodyClasses: [...document.body.classList].filter(c => /hero-|ph-|vocab|at-/.test(c)).join(' '),
    };
  });
}

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

  // Jump to P2 (Simplify) and wait for deck to settle
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(1));
  await page.waitForTimeout(2800);

  const before = await cardInfo(page);
  console.log('BEFORE adding word:\n', JSON.stringify(before, null, 2));
  await page.screenshot({ path: path.join(OUT, '01-p2-before.png') });

  // Add a new word directly via Shelf.add (simulates the user saving from popup)
  await page.evaluate(() => {
    if (window.Shelf) window.Shelf.add('saturation');
  });
  await page.waitForTimeout(800);

  const after1 = await cardInfo(page);
  console.log('\nAFTER adding saturation:\n', JSON.stringify(after1, null, 2));
  await page.screenshot({ path: path.join(OUT, '02-p2-after1.png') });

  // Add another word
  await page.evaluate(() => {
    if (window.Shelf) window.Shelf.add('trajectory');
  });
  await page.waitForTimeout(800);

  const after2 = await cardInfo(page);
  console.log('\nAFTER adding trajectory:\n', JSON.stringify(after2, null, 2));
  await page.screenshot({ path: path.join(OUT, '03-p2-after2.png') });

  // Scroll the strip to the right to see all cards
  await page.evaluate(() => {
    const s = document.getElementById('wd-stack');
    if (s) s.scrollLeft = s.scrollWidth;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '04-p2-scrolled.png') });

  // Jump to P3 (Translate) and add another word
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(2));
  await page.waitForTimeout(1500);
  await page.evaluate(() => { if (window.Shelf) window.Shelf.add('benchmark'); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '05-p3-add.png') });
  console.log('\nP3 state:\n', JSON.stringify(await cardInfo(page), null, 2));

  await browser.close();
  console.log('\ndone ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
