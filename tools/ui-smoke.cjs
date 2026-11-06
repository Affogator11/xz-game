// Browser regression checks; uses an isolated Chrome profile and no player data.
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const pause = ms => new Promise(r=>setTimeout(r,ms));
let chrome, server, socket, id=0;
const pending = new Map(), errors=[], checks=[];
async function send(method,params={}) {return new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});}
async function evaluate(expression) {const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function click(selector) {assert.ok(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`),selector);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(80);}
async function check(name,expression) {assert.ok(await evaluate(expression),name);checks.push(name);console.log('PASS '+name);}
async function screenshot(name,width=1440,height=1050) {await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});await pause(100);const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(root,'docs','ui-review',name+'.png'),Buffer.from(image.data,'base64'));}
async function navigate(url) {await send('Page.navigate',{url});await pause(650);await evaluate('document.fonts.ready.then(()=>true)');}
async function main(){
  await fs.mkdir(path.join(root,'docs','ui-review'),{recursive:true});
  const legacy={};
  for(const file of ['index.html','game.js']) legacy[file]=await fs.readFile(path.join(root,'tools','legacy',file),'utf8').catch(async()=>{const r=await fetch('https://raw.githubusercontent.com/Affogator11/xz-game/48a56feeb31a25fc9d2da1d1b4d47978d96f5834/'+file);assert.ok(r.ok);return r.text();});
  server=http.createServer(async(req,res)=>{try{let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const old=url.startsWith('/legacy/');if(old)url=url.slice(7);if(url.endsWith('/'))url+='index.html';const file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=old&&legacy[path.basename(file)]?legacy[path.basename(file)]:await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'qiu-ui-qa-'));
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=19336','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let target;for(let n=0;n<60;n++){try{target=await fetch('http://127.0.0.1:19336/json/new?'+encodeURIComponent(origin+'/'),{method:'PUT'}).then(r=>r.json());break;}catch{await pause(200);}}
  if(!target?.webSocketDebuggerUrl)target=await fetch('http://127.0.0.1:19336/json/new?'+encodeURIComponent(origin+'/'),{method:'PUT'}).then(r=>r.json());
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);socket.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const task=pending.get(data.id);pending.delete(data.id);if(data.error)task.reject(new Error(JSON.stringify(data.error)));else task.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails);};
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  // Generate a save with the exact previous production build, then resume with the new UI.
  await navigate(origin+'/legacy/index.html?preview=1');
  const legacySave=await evaluate("localStorage.getItem('qiu-principal-sim-v1')");assert.ok(legacySave);
  await navigate(origin+'/');await click('#continue-btn');
  await check('previous release save loads without any data changes',`localStorage.getItem('qiu-principal-sim-v1')===${JSON.stringify(legacySave)}`);
  await check('campus home exposes four health cards',"[...document.querySelectorAll('#metric-grid .metric-card')].filter(x=>x.getClientRects().length).length===4");
  await check('three contextual work suggestions',"document.querySelectorAll('.quest-row').length===3");
  await screenshot('01-campus');
  await click('#ui-more-metrics');await check('all ten health details remain available',"[...document.querySelectorAll('#metric-grid .metric-card')].filter(x=>x.getClientRects().length).length===10");await click('#ui-more-metrics');
  await click('[data-view="people"]');await check('management starts with two core roles',"[...document.querySelectorAll('.role-card')].filter(x=>x.getClientRects().length).length===2");await screenshot('02-people');
  await click('#ui-people-focus [data-focus="department"]');await check('department appointments accessible',"document.querySelector('.department-level').getClientRects().length>0");
  await click('[data-people-tab="teachers"]');await check('teacher roster has pages and no more than twelve visible',"!document.querySelector('#ui-people-pager').hidden && [...document.querySelectorAll('.teacher-grid .person-row')].filter(x=>x.getClientRects().length).length===12");
  const firstTeacher=await evaluate("document.querySelector('.teacher-grid .person-row').textContent");await click('#ui-people-pager [data-next]');await check('teacher pagination changes visible people',`[...document.querySelectorAll('.teacher-grid .person-row')].find(x=>!x.hidden).textContent!==${JSON.stringify(firstTeacher)}`);
  await click('[data-view="students"]');await check('six classes initially, one grade at a time',"[...document.querySelectorAll('#class-grid .class-card')].filter(x=>x.getClientRects().length).length===6");await screenshot('03-students');
  await click('#ui-grade-tabs [data-focus="3"]');await check('grade switch reveals senior classes',"[...document.querySelectorAll('#class-grid .class-card')].filter(x=>!x.hidden).every(x=>x.dataset.class.startsWith('3-'))");
  await click('#class-grid [data-class="3-1"]');await check('class details and assignments open',"!document.querySelector('#drawer').hidden && document.querySelectorAll('.teacher-assignment-list button').length>0");await click('#drawer [data-close-drawer]');
  await click('[data-student-tab="roster"]');await check('all students reachable through paginated roster',"document.querySelectorAll('#student-table tr').length===420 && [...document.querySelectorAll('#student-table tr')].filter(x=>!x.hidden).length===12");
  await click('[data-view="policies"]');await check('only one policy family shown and choices collapsed',"[...document.querySelectorAll('.policy-group')].filter(x=>!x.hidden).length===1 && document.querySelectorAll('.policy-disclosure[open]').length===0");await click('.policy-group:not([hidden]) summary');await check('policy choices expand on demand',"document.querySelectorAll('.policy-disclosure[open]').length===1");await screenshot('04-policies');
  await click('[data-view="finance"]');await check('finance opens on campus, budget and ledger stay separate',"!document.querySelector('.campus-plan-card').hidden && document.querySelector('.budget-allocation-card').hidden && document.querySelector('.ledger-card').hidden");await screenshot('05-construction');
  const facilityBefore=await evaluate("JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).money");
  await click('[data-facility-action="upgrade"]');
  await check('facility upgrade still spends once and raises the selected level',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.money<${facilityBefore} && s.facilities.find(f=>f.id==='classroom').level===2}`);
  await click('#ui-finance-tabs [data-focus="budget"]');await check('budget controls retained',"!document.querySelector('.budget-allocation-card').hidden && document.querySelectorAll('[data-budget]').length===5");await screenshot('06-budget');
  await evaluate("{const input=document.querySelector('[data-budget=food]');input.value=110;input.dispatchEvent(new Event('change'));}");
  await check('budget adjustment persists without leaving budget page',"JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).budgets.food===110 && !document.querySelector('.budget-allocation-card').hidden");
  await click('#ui-finance-tabs [data-focus="ledger"]');await check('ledger can be viewed on its own',"!document.querySelector('.ledger-card').hidden && document.querySelector('.campus-plan-card').hidden");
  await click('[data-view="actions"]');await check('two teaching actions initially instead of all actions',"[...document.querySelectorAll('#action-grid .action-card')].filter(x=>!x.hidden).length===2");await screenshot('07-actions');
  const actionBefore=await evaluate("JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).money");
  await click('[data-action="materials"]');
  await check('action costs and campus guidance refresh once',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.money===${actionBefore}-43000 && s.actionPoints===3 && document.querySelector('#ui-ap-count').textContent==='3 / 4'}`);
  await click('#ui-action-tabs [data-focus="学生与校园"]');await check('student actions remain accessible',"[...document.querySelectorAll('#action-grid .action-card')].filter(x=>!x.hidden).length===4");
  await click('[data-view="map"]');await check('all one hundred map cells remain interactive',"document.querySelectorAll('.map-cell').length===100");await screenshot('08-map');
  for(const width of [375,768,1024,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
    await pause(120);
    await check(`seven labelled navigation buttons visible at ${width}px`,"[...document.querySelectorAll('#main-nav .nav-item')].every(b=>{const r=b.getBoundingClientRect(),label=b.lastElementChild;return r.width>40 && r.right<=innerWidth+1 && r.left>=0 && getComputedStyle(label).display!=='none' && r.bottom<=innerHeight})");
    for(const view of ['overview','people','students','policies','finance','actions','map']){await click(`[data-view="${view}"]`);await check(`no page overflow ${view} at ${width}px`,"document.documentElement.scrollWidth <= innerWidth+1");}
  }
  await click('[data-view="overview"]');await screenshot('09-campus-mobile',375,1000);
  await click('[data-view="students"]');await click('[data-student-tab="classes"]');await screenshot('10-students-mobile',375,1000);
  await click('[data-view="policies"]');await screenshot('11-policies-mobile',375,1000);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
  // Advancing still uses existing settlement; choices still hide effects until results.
  await click('[data-view="overview"]');await click('.speed-btn[data-days="7"]');await pause(700);
  await check('weekly three-event briefing still opens',"!document.querySelector('#event-modal').hidden && document.querySelectorAll('[data-brief]').length===3");
  await screenshot('12-weekly-brief');
  const queuedSave=await evaluate("localStorage.getItem('qiu-principal-sim-v1')");
  await navigate(origin+'/');await click('#continue-btn');await pause(100);
  await check('pending event briefing survives reload',`JSON.stringify(JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).weeklyBrief)===JSON.stringify(JSON.parse(${JSON.stringify(queuedSave)}).weeklyBrief) && !document.querySelector('#event-modal').hidden`);
  await click('[data-brief="0"]');await screenshot('13-event-story');await click('[data-choice]:not(:disabled)');await pause(100);
  await check('event result feedback still appears after decision',"document.querySelector('#event-title').textContent.includes('批示') || !!JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).eventFeedback");
  const feedbackSave=await evaluate("localStorage.getItem('qiu-principal-sim-v1')");
  await navigate(origin+'/');await click('#continue-btn');
  console.log('Reload-derived differences: '+await evaluate(`{const a=JSON.parse(${JSON.stringify(feedbackSave)}),b=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])).join(', ')}`));
  await check('event feedback, money, ledger and queues unchanged by reload',`{const a=JSON.parse(${JSON.stringify(feedbackSave)}),b=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));['money','day','date','ledger','eventFeedback','weeklyBrief','pendingCampusEvent','campusEvents','students','roles','classTeachers','gaokao'].every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]))}`);
  // A persisted gaokao + weekly brief must retain foreground access.
  await evaluate("{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.date='2023-06-01T00:00:00+08:00';s.gaokao={year:2023,mocks:[],actions:{},reports:[]};s.eventFeedback=null;localStorage.setItem('qiu-principal-sim-v1',JSON.stringify(s));}");
  await navigate(origin+'/');await click('#continue-btn');
  await check('briefing stays above gaokao and is clickable',"!document.querySelector('#gaokao-season').hidden && !document.querySelector('#event-modal').hidden && +getComputedStyle(document.querySelector('#event-modal')).zIndex > +getComputedStyle(document.querySelector('#gaokao-season')).zIndex");
  for(let i=0;i<3;i++){const item=await evaluate("document.querySelector('[data-brief]:not(:disabled)')?.getAttribute('data-brief')");if(item===undefined)break;await click(`[data-brief="${item}"]`);await click('[data-choice]:not(:disabled)');await click('#event-choices .btn-primary');}
  await check('home work button updates when the briefing is finished',"!JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).weeklyBrief && document.querySelector('#ui-brief-button').textContent==='安排本周工作 →'");
  const gaokaoDate=await evaluate("JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).date");await click('#gaokao-next');await pause(700);
  await check('gaokao day advances after briefing is resolved',`JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).date!==${JSON.stringify(gaokaoDate)}`);
  await screenshot('14-gaokao');
  assert.equal(errors.length,0,JSON.stringify(errors));
  await fs.writeFile(path.join(root,'docs','ui-review','checks.json'),JSON.stringify({checks,errors},null,2));
  console.log(`Completed ${checks.length} browser checks; no runtime errors.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{socket?.close();if(chrome)chrome.kill();if(server)server.close();});
