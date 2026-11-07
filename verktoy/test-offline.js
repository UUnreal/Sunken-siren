// Offline-test: laster nettstedet, venter til alle språk er lagret, skrur av nettet og sjekker forside, spill, alle språk og nedlastet fil. Krever lokal server på 8765.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[],csp=[];
c.on('console',m=>{if(/Refused|Content.Security/.test(m.text()))csp.push(m.text().slice(0,200))});p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForFunction(()=>/alle språk/.test(document.getElementById('offline').textContent),null,{timeout:120000});
console.log('forside:',await p.textContent('#offline'));
await p.waitForTimeout(1500);
await c.setOffline(true);
const r=[];for(const u of ['','spill/','spill/?fast','spill/index.en.html']){await p.goto('http://localhost:8765/'+u).catch(e=>r.push(u+' FEIL '+e.message.slice(0,80)));await p.waitForTimeout(700);
 r.push(u+' -> '+await p.evaluate(()=>[document.title,document.documentElement.lang,!!window.MU,window.VO?Object.keys(VO).length:'-',!!window.GAME]).catch(e=>'x'))}
await p.goto('http://localhost:8765/spill/');await p.waitForTimeout(500);await p.click('#bNew');await p.waitForTimeout(2000);r.push('nytt spill offline: '+await p.evaluate(()=>GAME.S.room));
const f=await c.newPage();await f.goto('file:///mnt/project-files/spill/sunken-siren.html');await f.waitForTimeout(800);r.push('fil offline: '+await f.evaluate(()=>[!!window.GAME,window.VO?Object.keys(VO).length:0]));
console.log(r.join('\n'));console.log('errs',errs,'csp',csp);await b.close()})()
