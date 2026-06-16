/* Verify the CSS FLIP morph: ribbon pill physically moves & shrinks into Next pill.
   Captures time-series of clone's left/top/width + color across the 600ms morph. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'simp-ribbon', 'flip');
fs.mkdirSync(OUT, { recursive: true });

const measure = () => {
  const clone = document.querySelector('[data-sc-morph]');
  const next  = document.getElementById('hero-simp-next');
  const rib   = document.getElementById('hero-simp-ribbon');
  const r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { left: Math.round(q.left), top: Math.round(q.top), w: Math.round(q.width), h: Math.round(q.height) }; };
  const cs = el => el ? getComputedStyle(el).color : null;
  return {
    clone: r(clone), cloneColor: cs(clone),
    next: r(next), nextOpacity: next ? parseFloat(getComputedStyle(next).opacity) : null,
    ribOpacity: rib ? parseFloat(getComputedStyle(rib).opacity) : null,
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1520, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERROR:', e.message));
  await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch(e){} });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2400);
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1400);
  await page.evaluate(() => { const d = document.getElementById('hero-simp-dot'); if (d) d.click(); });

  // wait for ribbon to appear, then wait for morph to start
  let ribbonAppeared = false;
  for (let t = 0; t < 5000; t += 100) {
    await page.waitForTimeout(100);
    const m = await page.evaluate(() => {
      const rib = document.getElementById('hero-simp-ribbon');
      return rib ? parseFloat(getComputedStyle(rib).opacity) : 0;
    });
    if (m > 0.5) { ribbonAppeared = true; console.log('ribbon visible @' + t + 'ms'); break; }
  }
  if (!ribbonAppeared) { console.log('FAIL: ribbon never visible'); await browser.close(); return; }

  // wait for morph clone to appear
  let cloneAppeared = false;
  for (let t = 0; t < 4000; t += 50) {
    await page.waitForTimeout(50);
    const hasClone = await page.evaluate(() => !!document.querySelector('[data-sc-morph]'));
    if (hasClone) { cloneAppeared = true; console.log('clone appeared @' + t + 'ms after ribbon'); break; }
  }
  if (!cloneAppeared) { console.log('FAIL: clone never appeared'); await browser.close(); return; }

  // capture time-series during morph
  const frames = [];
  for (let i = 0; i < 16; i++) {
    const m = await page.evaluate(measure);
    frames.push({ t: i * 60, ...m });
    if (i === 0 || i === 5 || i === 10 || i === 15) {
      await page.screenshot({ path: path.join(OUT, 'f' + String(i).padStart(2,'0') + '.png'), clip: { x: 300, y: 530, width: 920, height: 260 }, animations: 'allow' });
    }
    await page.waitForTimeout(60);
  }

  // print time-series
  console.log('\nTime-series (clone rect + color):');
  frames.forEach(f => {
    const c = f.clone;
    console.log(`  t=${String(f.t).padStart(4)}ms  clone=${c ? JSON.stringify(c) : 'gone'}  color=${f.cloneColor}  nextOpa=${f.nextOpacity}`);
  });

  const first = frames.find(f => f.clone);
  const last  = [...frames].reverse().find(f => f.clone);
  if (first && last && first.clone && last.clone) {
    console.log('\nFLIP summary:');
    console.log('  left:  ' + first.clone.left + ' → ' + last.clone.left + ' (Δ=' + (last.clone.left - first.clone.left) + 'px)');
    console.log('  top:   ' + first.clone.top  + ' → ' + last.clone.top  + ' (Δ=' + (last.clone.top  - first.clone.top)  + 'px)');
    console.log('  width: ' + first.clone.w    + ' → ' + last.clone.w    + ' (Δ=' + (last.clone.w    - first.clone.w)    + 'px)');
  }

  // wait for Next pill to appear
  let nextSeen = false;
  for (let t = 0; t < 2000; t += 100) {
    await page.waitForTimeout(100);
    const m = await page.evaluate(measure);
    if (!m.clone && m.nextOpacity > 0.5) {
      nextSeen = true;
      console.log('\nNext pill visible, opacity=' + m.nextOpacity + ' rect=' + JSON.stringify(m.next));
      await page.screenshot({ path: path.join(OUT, 'next-pill.png'), clip: { x: 300, y: 530, width: 920, height: 260 } });
      break;
    }
  }
  if (!nextSeen) console.log('FAIL: Next pill never appeared after clone');

  await ctx.close();
  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
