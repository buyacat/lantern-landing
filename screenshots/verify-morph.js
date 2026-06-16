const path=require('path'),fs=require('fs');
const {chromium}=require(path.join(process.env.APPDATA,'npm','node_modules','playwright'));
const OUT=path.join(__dirname,'verify-fix');
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  await p.goto('file:///C:/Landing%20Lantern/index.html');
  await p.waitForTimeout(2500);
  const has=await p.evaluate(()=>({hasHeroWords:!!(window.HeroWords&&window.HeroWords.foldToDeck), pending:window.HeroWords&&window.HeroWords.pending&&window.HeroWords.pending()}));
  console.log('api:',JSON.stringify(has));
  await p.evaluate(()=>{ document.body.classList.add('hero-p2'); if(window.HeroWords) window.HeroWords.foldToDeck(); });
  await p.waitForTimeout(1500);
  await p.screenshot({path:path.join(OUT,'s2-morph.png')});
  const deck=await p.evaluate(()=>({deckIn:document.querySelectorAll('#worddeck .wd-card.in').length, deckTotal:document.querySelectorAll('#worddeck .wd-card').length, heroLeft:document.querySelectorAll('.hw-card').length}));
  console.log('after foldToDeck:',JSON.stringify(deck));
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
