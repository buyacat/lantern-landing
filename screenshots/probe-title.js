const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'title-fit'); fs.mkdirSync(OUT, { recursive: true });
const DEVICES = [[320,568,'320'],[360,640,'360'],[375,667,'iphSE'],[412,732,'pixel'],[390,844,'iph14']];

(async () => {
  const browser = await chromium.launch();
  for (const [W,H,tag] of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('file:///C:/Landing%20Lantern/index.html');
    await page.waitForTimeout(2600);
    const g = await page.evaluate(() => {
      const h1 = document.querySelector('#hero .hero-copy h1');
      const cs = getComputedStyle(h1);
      const lh = parseFloat(cs.lineHeight);
      return { fs: cs.fontSize, lines: Math.round(h1.getBoundingClientRect().height/lh),
        overflow: h1.scrollWidth > h1.clientWidth + 1, text: h1.textContent.replace(/\s+/g,' ').trim() };
    });
    console.log(`${tag}: fs=${g.fs} lines=${g.lines} overflow=${g.overflow} "${g.text}"`);
    await page.screenshot({ path: path.join(OUT, `t-${tag}.png`) });
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
