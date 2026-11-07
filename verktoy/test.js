// Pentest + funksjonstest for nettstedet. Start først: (cd ut && python3 -m http.server 8765), så: node test.js
// Pentest + funksjonstest: CSP-brudd, nettverkskall, ondsinnet lagring, lagringskoder
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});
const out={csp:[],ext:[],errs:[],xss:false};c.on('console',m=>{if(/Content.Security|Refused/i.test(m.text()))out.csp.push(m.text().slice(0,160))});
c.on('request',r=>{if(!r.url().startsWith('http://localhost:8765/'))out.ext.push(r.url())});
await c.exposeFunction('pwned',()=>{out.xss=true});
const p=await c.newPage();p.on('pageerror',e=>out.errs.push('forside:'+e.message));
await p.goto('http://localhost:8765/');
// 1) ondsinnet lagring
const evil={room:'c7<img src=x onerror=pwned()>',ch:'7"><script>pwned()</script>',hl:'<svg onload=pwned()>',st:-5,inv:['<img src=x onerror=pwned()>','__proto__','constructor','krystall'],f:{}};
await p.evaluate(e=>localStorage.setItem('siren',JSON.stringify(e)),evil);await p.reload();await p.waitForTimeout(1600);
out.forsideEvil=await p.textContent('#some');
// 2) søppel-lagring
for(const junk of ['null','"x"','[]','{"room":5}','{{{']){await p.evaluate(j=>localStorage.setItem('siren',j),junk);await p.reload();await p.waitForTimeout(200)}
// 3) spillet med CSP: last, vent på lyd, start nytt spill
const g=await c.newPage();g.on('pageerror',e=>out.errs.push('spill:'+e.message));
await g.goto('http://localhost:8765/spill/');await g.evaluate(()=>localStorage.removeItem('siren'));await g.reload();
await g.waitForFunction(()=>window.VO&&window.MU,null,{timeout:30000});out.audio=await g.evaluate(()=>Object.keys(MU));
await g.click('#bNew');await g.waitForTimeout(2500);out.gameRoom=await g.evaluate(()=>GAME.S.room);
// 4) ondsinnet lagring i spillet
await g.evaluate(e=>localStorage.setItem('siren',JSON.stringify(e)),{room:'port',inv:['<img src=x onerror=pwned()>','dagbok'],f:{}});await g.reload();await g.waitForTimeout(500);
await g.click('#bCont').catch(()=>{});await g.waitForTimeout(1000);
// 5) gyldig lagringskode-format fra forsiden
await p.evaluate(()=>localStorage.setItem('siren',JSON.stringify({room:'c12',ch:12,inv:['dagbok'],f:{},hl:2,st:20})));await p.reload();await p.waitForTimeout(300);
out.code=await p.textContent('#code');
out.codeOK=(()=>{const m=out.code.replace(/-/g,'').match(/^KAP(\d+)J(\d)S(\d+)([A-Z])$/);return !!m&&String.fromCharCode(65+(m[1]*7+m[2]*13+m[3]*31+11)%26)===m[4]})();
console.log(JSON.stringify(out,null,1));await b.close()})()
