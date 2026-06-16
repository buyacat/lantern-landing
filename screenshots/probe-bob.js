const path=require('path');
const {chromium}=require(path.join(process.env.APPDATA,'npm','node_modules','playwright'));
(async()=>{
  const b=await chromium.launch();
  for (const W of [360,390,768,820,1000,1100]){
    const ctx=await b.newContext({viewport:{width:W,height:800},deviceScaleFactor:1,hasTouch:true,isMobile:W<1000});
    const p=await ctx.newPage();
    await p.goto('file:///C:/Landing%20Lantern/index.html');
    await p.waitForTimeout(2500);
    const info=await p.evaluate(()=>{
      const cs=[...document.querySelectorAll('.hw-card')];
      return {n:cs.length, data: cs.slice(0,1).map(c=>{
        const wc=c.querySelector('.wordcard'); const w=c.querySelector('.w');
        const r=c.getBoundingClientRect();
        return {disp:getComputedStyle(c).display, rested:c.classList.contains('rested'),
          anim:getComputedStyle(c).animationName, wcls:wc&&wc.className,
          wFont:w&&getComputedStyle(w).fontSize, boxW:Math.round(r.width)};
      })};
    });
    console.log('W='+W, JSON.stringify(info));
    await ctx.close();
  }
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
