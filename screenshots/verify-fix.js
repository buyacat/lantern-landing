const path=require('path'),fs=require('fs');
const {chromium}=require(path.join(process.env.APPDATA,'npm','node_modules','playwright'));
const OUT=path.join(__dirname,'verify-fix');fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  await p.goto('file:///C:/Landing%20Lantern/index.html');
  await p.waitForTimeout(2500);
  await p.screenshot({path:path.join(OUT,'s1.png')});
  // advance to screen 2 to confirm morph still runs
  await p.evaluate(()=>{ if(window.toP2) window.toP2(); else document.body.click(); });
  await p.waitForTimeout(1500);
  await p.screenshot({path:path.join(OUT,'s2.png')});
  const deck=await p.evaluate(()=>({deckCards:document.querySelectorAll('#worddeck .wd-card').length, heroCards:document.querySelectorAll('.hw-card').length}));
  console.log('after morph:',JSON.stringify(deck));
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
