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
  for(const file of ['index.html','game.js','data.js']) legacy[file]=await fs.readFile(path.join(root,'tools','legacy',file),'utf8').catch(async()=>{const r=await fetch('https://raw.githubusercontent.com/Affogator11/xz-game/48a56feeb31a25fc9d2da1d1b4d47978d96f5834/'+file);assert.ok(r.ok);return r.text();});
  server=http.createServer(async(req,res)=>{try{let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const old=url.startsWith('/legacy/');if(old)url=url.slice(7);if(url.endsWith('/'))url+='index.html';const file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=old&&legacy[path.basename(file)]?legacy[path.basename(file)]:await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(404).end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'qiu-ui-qa-'));
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=19336','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let target;for(let n=0;n<60;n++){try{target=await fetch('http://127.0.0.1:19336/json/new?'+encodeURIComponent(origin+'/'),{method:'PUT'}).then(r=>r.json());break;}catch{await pause(200);}}
  if(!target?.webSocketDebuggerUrl)target=await fetch('http://127.0.0.1:19336/json/new?'+encodeURIComponent(origin+'/'),{method:'PUT'}).then(r=>r.json());
  socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.onopen=r);socket.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const task=pending.get(data.id);pending.delete(data.id);if(data.error)task.reject(new Error(JSON.stringify(data.error)));else task.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails);};
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});

  await send('Page.enable');
  const previousHandler=socket.onmessage;
  socket.onmessage=event=>{previousHandler(event);if(JSON.parse(event.data).method==='Page.javascriptDialogOpening')send('Page.handleJavaScriptDialog',{accept:true});};
  const saved=()=>evaluate("JSON.parse(localStorage.getItem('qiu-principal-sim-v1'))");
  const restore=async value=>{await evaluate(`localStorage.setItem('qiu-principal-sim-v1',${JSON.stringify(JSON.stringify(value))})`);await navigate(origin+'/');await click('#continue-btn');};
  const advance=async days=>{await click(`.speed-btn[data-days="${days}"]`);await pause(180);};
  const drain=async()=>{for(let i=0;i<90;i++){await pause(35);if(await evaluate("!document.querySelector('#battle-modal').hidden")){if(await evaluate("!document.querySelector('#battle-close').hidden"))await click('#battle-close');continue;}if(await evaluate("!document.querySelector('#exchange-modal').hidden")){await click('#exchange-later');continue;}if(await evaluate("!document.querySelector('#event-modal').hidden")){if(await evaluate("!!document.querySelector('#event-choices .btn-primary')")){await click('#event-choices .btn-primary');continue;}const brief=await evaluate("document.querySelector('[data-brief]:not(:disabled)')?.dataset.brief");if(brief!==undefined){await click(`[data-brief="${brief}"]`);continue;}if(await evaluate("!!document.querySelector('[data-choice]:not(:disabled)')")){await evaluate("[...document.querySelectorAll('[data-choice]:not(:disabled)')].at(-1).click()");continue;}}if(await evaluate("!document.querySelector('#time-transition').hidden"))continue;return;}throw new Error('flow did not drain');};
  await navigate(origin+'/index.html?preview=1');
  await check('new game creates 390 students',"JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).students.length===390");
  const fresh=await saved();
  if(process.argv.includes('--layout-only')){
    await send('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:true});await pause(150);
    await check('short phone shows all twelve states',"[...document.querySelectorAll('#metric-grid .metric-card')].every(x=>x.getBoundingClientRect().bottom<innerHeight-54)");
    await check('weekly action button fits its card on short phone',"document.querySelector('#ui-brief-button').getBoundingClientRect().bottom<=document.querySelector('.week-mission').getBoundingClientRect().bottom");
    await screenshot('overhaul-short-phone',375,667);
    await send('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});await pause(100);await click('[data-view="students"]');
    await check('grade summary text stays inside cards',"[...document.querySelectorAll('#grade-summary .metric-card')].slice(0,3).every(card=>card.querySelector('.delta').getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom+1)");
    await check('all five classes fit phone view',"[...document.querySelectorAll('#class-grid .class-card')].filter(c=>!c.hidden).at(-1).getBoundingClientRect().bottom<=document.querySelector('#main').getBoundingClientRect().bottom-60");
    await screenshot('overhaul-mobile-students',375,812);await click('[data-view="people"]');await click('[data-people-tab="teachers"]');
    await check('all five teaching rows fit the roster panel',"[...document.querySelectorAll('[data-teaching-row]')].at(-1).getBoundingClientRect().bottom<=document.querySelector('#people-content').getBoundingClientRect().bottom+1");
    await screenshot('overhaul-mobile-teachers',375,812);assert.equal(errors.length,0,JSON.stringify(errors));console.log('Layout checks passed.');return;
  }
  await check('all 12 school statuses visible, no safety stat',"[...document.querySelectorAll('#metric-grid .metric-card')].filter(x=>x.getClientRects().length).length===12 && !document.querySelector('#metric-grid').textContent.includes('安全')");
  // Zhou's pressure talent uses the normal character selection and school actions.
  await navigate(origin+'/');await click('#new-game-btn');await click('input[name="principal"][value="zhou"]');await click('#start-game-btn');
  const zhou=await saved();
  assert.equal(zhou.principalId,'zhou');
  assert.deepEqual(zhou.principalStats,[88,94,82,85,90,84]);
  assert.equal(zhou.leaderboard,undefined);
  assert.equal(zhou.learningEfficiency,150);
  await check('Zhou starts at 150% learning efficiency and shows it on the dashboard',"document.querySelector('#school-status-heading').textContent.includes('150.00%')");
  await restore({...zhou,actionPoints:0});await click('[data-view="actions"]');
  await check('Zhou can afford a two-point action with zero action points',"!document.querySelector('[data-action=teach]').disabled&&document.querySelector('[data-action=teach]').closest('article').textContent.includes('−2.00 个百分点')");
  await click('[data-action=teach]');
  const zhouSpent=await saved();
  assert.equal(zhouSpent.learningEfficiency,148);
  assert.equal(zhouSpent.actionPoints,0);
  assert.equal(zhouSpent.authority,zhou.authority);
  assert.equal(zhouSpent.money,zhou.money-25000);
  await restore(zhouSpent);
  await check('Zhou saves spent efficiency and restores the receipt without charging again',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.learningEfficiency===148&&s.actionFeedback.rows.some(row=>row.key==='learningEfficiency'&&row.delta===-2)}");
  await click('#action-result-close');await click('[data-view="policies"]');await click('.policy-group:not([hidden]) summary');
  await check('policy preview combines action point cost and lost authority',"document.querySelector('[data-policy=hair][data-option=free] em').textContent.includes('−2.00 个百分点')");
  await click('[data-policy=hair][data-option=free]');await click('#policy-confirm');
  const zhouPolicy=await saved();
  assert.equal(zhouPolicy.learningEfficiency,146);
  assert.equal(zhouPolicy.actionPoints,0);
  assert.equal(zhouPolicy.authority,zhou.authority);
  assert.equal(zhouPolicy.schoolPolicies.hair,'free');
  await check('policy result reports the converted charge', "document.querySelector('#action-result-body').textContent.includes('−2.00 个百分点')");
  await restore({...zhou,learningEfficiency:0});await click('[data-view="actions"]');
  await check('depleted efficiency stays at zero and blocks paid school actions',"JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).learningEfficiency===0&&document.querySelector('[data-action=teach]').disabled");
  await restore({...zhou,learningEfficiency:100});await advance(1);const baseGrowth=await saved();
  await restore(zhou);await advance(1);const boostedGrowth=await saved();
  const positive=baseGrowth.students.filter(s=>s.dailyChange.academic>.03);
  assert.ok(positive.length>100);
  assert.ok(positive.every(s=>Math.abs(boostedGrowth.students.find(t=>t.id===s.id).dailyChange.academic-s.dailyChange.academic*1.5)<=.015));
  console.log('PASS Zhou multiplies positive daily academic growth by 1.5');checks.push('Zhou daily growth boost');
  const zhouWeek={...zhou,day:6,date:'2022-07-06T00:00:00+08:00'};
  await restore(zhouWeek);await evaluate("GAME_DATA.principalData.find(p=>p.id==='zhou').bonus.pressure.weeklyAnger=0");await advance(1);const ordinaryWeek=await saved();
  await restore(zhouWeek);await advance(1);const pressureWeek=await saved();
  assert.equal(pressureWeek.day,7);
  assert.ok(pressureWeek.students.every((s,i)=>Math.abs(s.anger-ordinaryWeek.students[i].anger-.1)<.005));
  await restore(pressureWeek);
  await check('Zhou adds 0.10 anger on the weekly boundary, with no repeat on reload',`JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).students[0].anger===${pressureWeek.students[0].anger}`);
  await restore(fresh);
  await navigate(origin+'/');await click('#new-game-btn');await click('input[name="principal"][value="zhou"]');
  await click('input[name="ranked"][value="yes"]');
  await click('#start-game-btn');
  await check('ranked terms require a visible, nonempty nickname',"!document.querySelector('#setup-modal').hidden&&!document.querySelector('#ranked-nickname-field').hidden&&!document.querySelector('#ranked-nickname').validity.valid");
  await evaluate("(()=>{const input=document.querySelector('#ranked-nickname');input.value='  <校友>  ';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await click('#start-game-btn');
  const rankedRun=await saved();
  assert.equal(rankedRun.leaderboard.nickname,'<校友>');
  assert.equal(rankedRun.leaderboard.best,null);
  assert.match(rankedRun.leaderboard.token,/^[a-f0-9]{48}$/);
  await restore(fresh);
  // Status guidance uses the same stored values and student actions as ordinary play.
  await check('home gauges label all twelve school positions and highlight one priority',"[...document.querySelectorAll('#metric-grid .status-meter')].length===12&&document.querySelectorAll('.school-status-card.status-priority').length===1&&document.querySelector('#school-status-priority').getClientRects().length>0");
  await click('[data-school-metric="teaching"]');
  await check('school metric explains thresholds and names a concrete action',"document.querySelector('#drawer-body').textContent.includes('70–100 良好')&&document.querySelector('[data-metric-destination]').textContent==='集体教研周'");
  await click('[data-metric-destination]');
  await check('metric action jump reveals the right action category',"document.querySelector('[data-action=teach]').getClientRects().length>0&&document.querySelector('#view-actions').classList.contains('active')");
  const stressed=structuredClone(fresh),student=stressed.students[0];
  stressed.students.forEach(s=>s.anger=72);
  student.anger=75;
  student.stats=[80,65,62,85];
  await restore(stressed);
  await check('high average anger is shown as a reversed scale and priority',"document.querySelector('.school-status-card.status-priority').dataset.schoolMetric==='studentAnger'&&document.querySelector('[data-school-metric=studentAnger] .status-meter.reversed')&&document.querySelector('[data-school-metric=studentAnger] .status-tag').textContent==='偏高'");
  await click('#school-status-priority');await click('[data-metric-destination]');
  await check('anger advice opens the pressure roster, ordered by severity',`document.querySelector('#tier-filter').value==='stress'&&document.querySelector('#student-table [data-student]').dataset.student===${JSON.stringify(student.id)}`);
  await screenshot('student-status-roster-mobile',375,812);
  await click('#student-table [data-student]');
  await check('student skill and form are separate and attributes start collapsed',"document.querySelector('.student-hero .student-rating').textContent==='A'&&document.querySelector('.student-form-line .status-tag').textContent==='白卷风险'&&document.querySelector('[data-student-action=talk]').classList.contains('recommended')&&!document.querySelector('.student-raw-stats').open");
  await screenshot('student-status-card-mobile',375,812);
  await click('[data-student-action="talk"]');
  await check('talk spends one point and updates risk without changing academic grade',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.actionPoints===${stressed.actionPoints-1}&&s.students[0].anger===69&&document.querySelector('.student-form-line .status-tag').textContent==='状态承压'&&document.querySelector('.student-hero .student-rating').textContent==='A'&&document.querySelector('.student-action-feedback').textContent.includes('6.00')}`);
  await click('#drawer [data-close-drawer]');await click('[data-student-tab="classes"]');await click('[data-class="1-1"]');
  await click('.class-student-list [data-student-open]');await click('[data-back-student-class]');
  await check('student dossier returns to the class with teaching controls still available',"document.querySelector('.class-student-list [data-student-open]')&&document.querySelector('.teacher-assignment-list [data-change-subject]')");
  await restore(fresh);
  await check('event library has exactly 282 independent identifiers',"CampusEventCatalog.all().length===282");
  await screenshot('overhaul-home',1440,900);
  await click('[data-view="map"]');await click('#strategy-map [data-school="jin"]');await click('[data-school-action="exam"]');
  await check('exam planner lists five correctly typed classes and 130 participants',"document.querySelectorAll('[data-exam-class]').length===5 && document.querySelector('[data-exam-class="+'"1-3"'+"]').parentElement.textContent.includes('文科普通班') && document.querySelector('[data-exam-class="+'"1-4"'+"]').parentElement.textContent.includes('理科清北班') && document.querySelector('#exam-plan-summary').textContent.includes('130')");
  await click('#confirm-joint-exam');await check('booking persists selected teams and pays exactly once',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.money===645000&&s.actionPoints===3&&s.scheduledEvents.length===1&&s.scheduledEvents[0].classKeys.length===5}");await restore(fresh);
  for(const view of ['map','people','students','policies','finance','actions']){await click(`[data-view="${view}"]`);await screenshot('overhaul-'+view,1440,900);}
  await click('[data-view="people"]');await click('[data-people-tab="teachers"]');
  await check('teacher roster is five class rows plus two grade specialists',"document.querySelectorAll('[data-teaching-row]').length===5 && document.querySelectorAll('.grade-specialists [data-person]').length===2");
  await screenshot('overhaul-teachers',1440,900);
  await click('#people-content .class-teacher-chips [data-person]');
  await check('teacher profile has four skills and affordable recruitment formula',"document.querySelectorAll('.teacher-stat-grid>span').length===4 && ![...document.querySelectorAll('.teacher-stat-grid small')].some(x=>['教研','稳定'].includes(x.textContent))");
  await check('teacher dossier labels positive and negative ability changes', "document.querySelector('.trait-stat-grid .positive .trait-modifier').textContent.startsWith('+')&&document.querySelector('.trait-stat-grid .negative .trait-modifier').textContent.startsWith('−')");
  const teacherId=await evaluate("document.querySelector('#people-content .class-teacher-chips [data-person]').dataset.person");
  await click('[data-hire="promote"]');
  await check('promotion retains class teaching, executive role is filled',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));Object.values(s.roles).includes(${JSON.stringify(teacherId)}) && Object.values(s.classTeachers).some(a=>Object.values(a.subjects).includes(${JSON.stringify(teacherId)}))}`);
  const promoted=await saved();
  await click('[data-view="students"]');await click('[data-class="1-1"]');
  const assignedSubject=Object.entries(fresh.classTeachers['1-1'].subjects).find(([,id])=>id===teacherId)?.[0];
  await check('admin assignment clearly shows 50 percent teaching',"document.querySelector('#drawer-body').textContent.includes('兼任50%')");
  const efficiency=await evaluate(`parseFloat([...document.querySelectorAll('.teacher-assignment-list b')].find(x=>x.textContent.startsWith(${JSON.stringify(assignedSubject)})).textContent.split('·')[1])`);
  await click('#drawer [data-close-drawer]');
  await restore(fresh);await click('[data-view="students"]');await click('[data-class="1-1"]');
  const originalEfficiency=await evaluate(`parseFloat([...document.querySelectorAll('.teacher-assignment-list b')].find(x=>x.textContent.startsWith(${JSON.stringify(assignedSubject)})).textContent.split('·')[1])`);
  assert.ok(Math.abs(efficiency-originalEfficiency*.5)<=.011);console.log('PASS executive teaching efficiency is exactly half');checks.push('executive teaching efficiency is exactly half');
  await restore(promoted);await click('[data-view="people"]');await click('[data-people-tab="management"]');
  const highFactor=await evaluate("Number(document.querySelectorAll('.governance-strip strong')[1].textContent.replace('×',''))");
  const inefficient=JSON.parse(JSON.stringify(promoted));inefficient.adminModifier=-40;await restore(inefficient);await click('[data-view="people"]');
  await check('low administrative efficiency reduces office effect multiplier',`Number(document.querySelectorAll('.governance-strip strong')[1].textContent.replace('×',''))<${highFactor}`);
  await restore(promoted);await click('[data-view="people"]');await click(`#people-content [data-person="${teacherId}"]`);await click('[data-hire="dismiss"]');
  await check('administrative dismissal costs money and authority and clears teaching',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.money<${promoted.money} && s.authority<${promoted.authority} && !Object.values(s.roles).includes(${JSON.stringify(teacherId)}) && !Object.values(s.classTeachers).some(a=>Object.values(a.subjects).includes(${JSON.stringify(teacherId)}))}`);
  // Invitation -> reply after seven days -> actual personnel trip -> lock -> return.
  await restore(promoted);await evaluate('Math.random=()=>0');await click('[data-view="map"]');await click('#strategy-map [data-school="xiang"]');await click('[data-school-action="exchange"]');
  await check('exchange invitation is pending and its chance depends on relation',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1')),r=s.exchangeRequests.at(-1);r.status==='pending' && r.replyDay===s.day+7 && r.chance===SchoolRules.round(.15+s.schools.find(x=>x.id==='xiang').relation*.0075)}");
  await advance(7);await drain();await advance(1);
  await check('exchange reply arrives after seven days',"JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).exchangeRequests.at(-1).status==='accepted'");
  await click('[data-view="map"]');await click('#strategy-map [data-school="xiang"]');await click('[data-school-action="exchange"]');await click('[data-trip-role]');
  const away=await saved(),trip=away.exchangeTrips.at(-1),skillsBefore=away.staffDevelopment[trip.staffId];
  await check('exchange office is vacant and locked for a week',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));!s.roles[${JSON.stringify(trip.role)}] && SchoolRules.locked(s,${JSON.stringify(trip.role)}) && s.exchangeTrips.at(-1).returnDay===s.day+7}`);
  await click('[data-view="people"]');await check('locked office cannot be appointed',`![...document.querySelectorAll('[data-role-choose]')].some(x=>x.dataset.roleChoose===${JSON.stringify(trip.role)}) && document.querySelector('.role-card.away').textContent.includes('锁定')`);
  await advance(7);await drain();await advance(1);
  const returned=await saved();
  assert.equal(returned.roles[trip.role],trip.staffId);assert.ok(returned.staffDevelopment[trip.staffId].every((v,i)=>v>skillsBefore[i]));checks.push('exchange returns to office and gains all four abilities');console.log('PASS exchange returns to office and gains all four abilities');
  await restore(returned);await check('returned skills persist without duplicate gain',`JSON.stringify(JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).staffDevelopment[${JSON.stringify(trip.staffId)}])===${JSON.stringify(JSON.stringify(returned.staffDevelopment[trip.staffId]))}`);
  // Actual monthly and quarterly scheduling with persisted result popups.
  const city=JSON.parse(JSON.stringify(fresh));city.date='2022-07-19T00:00:00+08:00';city.day=19;await restore(city);await advance(1);await pause(100);
  await check('monthly city exam has eight results with four gains and four losses',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1')),r=s.pendingExamReports[0];r.kind==='city'&&r.rows.length===8&&r.rows.filter(x=>x.delta>0).length===4&&r.rows.filter(x=>x.delta<0).length===4&&!document.querySelector('#battle-modal').hidden}");
  await screenshot('overhaul-city-exam',1280,800);
  const cityResult=await saved();await restore(cityResult);await check('city exam reload preserves settled points and result',`JSON.stringify(JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).league.points)===${JSON.stringify(JSON.stringify(cityResult.league.points))} && !document.querySelector('#battle-modal').hidden`);await click('#battle-close');
  const province=JSON.parse(JSON.stringify(fresh));province.date='2022-09-24T00:00:00+08:00';province.day=86;await restore(province);await advance(1);await pause(100);
  await check('quarterly province exam awards every school a higher points band',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.pendingExamReports[0].kind==='province'&&s.pendingExamReports[0].rows.every(x=>x.delta>=120)}");await screenshot('overhaul-province-exam',1280,800);await click('#battle-close');
  // The seeded bilateral test verifies average scores, morale and high-anger blank papers.
  for(const anger of [70,100]){const pair=JSON.parse(JSON.stringify(fresh));pair.date='2022-07-09T00:00:00+08:00';pair.day=9;pair.students.forEach(s=>{s.anger=anger;if(s.grade===1)s.stats[0]=95;});pair.scheduledEvents=[{id:'integration-joint-'+anger,type:'jointExam',targetId:'jin',date:'2022-07-10',classKeys:['1-1','1-2','1-3','1-4','1-5'],teacherId:teacherId,status:'scheduled'}];await restore(pair);await advance(1);await pause(100);const result=await saved(),r=result.examHistory[0].result;if(r.result==='win'){assert.equal(result.league.points.jin,fresh.league.points.jin);assert.ok(result.league.points.qiu>fresh.league.points.qiu)}else{assert.equal(result.league.points.qiu,fresh.league.points.qiu);assert.ok(result.league.points.jin>fresh.league.points.jin)}if(anger===70)assert.equal(r.blankPapers,0);else assert.ok(r.blankPapers>0);const points=JSON.stringify(result.league.points);await restore(result);assert.equal(JSON.stringify((await saved()).league.points),points);checks.push('joint points and blank-paper threshold '+anger);console.log('PASS joint points and blank-paper threshold '+anger);}
  // Financially unavailable options remain disabled; feedback and followup survive reload.
  const event=JSON.parse(JSON.stringify(fresh));event.money=100;event.actionPoints=0;event.weeklyBrief={day:1,items:[{id:'county_1_1',done:false},{id:'county_2_2',done:false},{id:'county_3_3',done:false}]};await restore(event);await click('[data-brief="0"]');
  await check('unaffordable options disabled, choices reveal only funding cost',"document.querySelector('[data-choice="+'"0"'+"]').disabled && document.querySelector('[data-choice="+'"1"'+"]').disabled && !document.querySelector('#event-choices').textContent.includes('愤怒 +')");await check('the new fourth option shows action-point cost and is unavailable at zero points',
    "document.querySelector('[data-choice=\"3\"]').disabled&&document.querySelector('[data-choice=\"3\"]').textContent.includes('需 1 行动点')");await click('[data-choice="2"]');
  const feedback=await saved();assert.equal(feedback.money,100);assert.ok(feedback.students[0].anger>event.students[0].anger);assert.equal(feedback.campusEventPending.length,1);await restore(feedback);await check('event feedback, followup queue and balance survive reload',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.money===100 && s.campusEventLog.length===1 && s.campusEventPending.length===1 && !!s.eventFeedback}`);
  // Upgrade a real pre-overhaul save and keep its previously selected story state.
  await navigate(origin+'/legacy/index.html?preview=1');const oldSave=await saved();oldSave.money=345678.9;oldSave.campusEventPending=[{source:'teacher_workshop',day:50}];oldSave.weeklyBrief={day:1,items:[{id:'rain',done:true},{id:'donation',done:false},{id:'phone',done:false}]};await restore(oldSave);
  await check('real old save migrates to new classes with archive and story intact',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.students.length===390&&s.preOverhaulArchive.students.length===30&&s.money===345678.9&&s.weeklyBrief.items[0].done&&s.campusEventPending[0].source==='teacher_workshop'}");
  // All-school AI matches still run inside the weekly cycle and invitations use a brief slot.
  const ai=JSON.parse(JSON.stringify(fresh));ai.day=6;ai.date='2022-07-06T00:00:00+08:00';ai.inviteWaitWeeks=5;await restore(ai);await advance(1);
  await check('AI schools play each other and invitations occupy one of three items',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.rivalExamHistory.length===3&&s.weeklyBrief.items.length===3&&s.weeklyBrief.items.filter(x=>x.event?.kind==='aiInvite').length===1}");
  // The office leads into the policy preview and mobile controls remain hittable.
  await restore(fresh);await send('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:true});await pause(150);
  await check('all six office destinations are accessible above the mobile time controls',
    "document.querySelector('#overview-title').textContent==='校长办公室'&&document.querySelectorAll('.office-links button').length===6&&[...document.querySelectorAll('.office-links button')].every(b=>b.getBoundingClientRect().bottom<=document.querySelector('.time-controls').getBoundingClientRect().top+1)");
  await click('.office-links [data-view-jump="policies"]');
  await click('.policy-group:not([hidden]) summary');await click('[data-policy="hair"][data-option="forced"]');
  await check('selecting a policy previews the tradeoffs without spending resources',
    "{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.actionPoints===4&&s.schoolPolicies.hair==='limited'&&document.querySelector('[data-policy-metric=anger]').classList.contains('negative')&&document.querySelector('[data-policy-metric=studentDiscipline]').classList.contains('positive')}");
  await check('the policy confirmation buttons can be tapped on a short phone',
    "['#policy-confirm','#policy-cancel'].every(q=>{const b=document.querySelector(q),r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})");
  await check('short phone keeps a scrollable policy option area below the preview',
    "document.querySelector('#policy-groups').getBoundingClientRect().height>=90");
  await screenshot('office-policy-preview-mobile',375,667);
  await click('[data-policy-period=ongoing]');
  await check('ongoing policy effects remain visible in their own pane',
    "!document.querySelector('#policy-recurring').hidden&&document.querySelector('#policy-recurring [data-policy-metric=studentDiscipline]').classList.contains('positive')");
  await click('[data-policy-period=instant]');
  await click('#policy-cancel');
  await check('cancel closes the preview without changing the policy',"!document.querySelector('#policy-confirm')&&JSON.parse(localStorage.getItem('qiu-principal-sim-v1')).schoolPolicies.hair==='limited'");
  await click('[data-policy="hair"][data-option="forced"]');
  const stabilityPreview=await evaluate("Number(document.querySelector('[data-policy-metric=stability] small').textContent.match(/→ ([0-9.]+)/)[1])");
  await check('a scrolled policy option remains tappable and its cost stays inside the card',
    "(()=>{const b=document.querySelector('[data-policy=hair][data-option=forced]');b.scrollIntoView({block:'start'});const r=b.getBoundingClientRect(),c=b.querySelector('em').getBoundingClientRect(),panel=document.querySelector('#policy-groups').getBoundingClientRect();const y=Math.min(r.bottom,panel.bottom)-4;return r.top>=panel.top-1&&c.bottom<=r.bottom&&b.contains(document.elementFromPoint(r.x+r.width/2,y));})()");
  await click('#policy-confirm');
  await check('policy confirmation applies the previewed stability, authority and cost',
    `{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.actionPoints===3&&s.schoolPolicies.hair==='forced'&&s.authority===73&&s.stability===${stabilityPreview}}`);
  await click('#action-result-close');
  await restore(fresh);await click('[data-view="finance"]');await check('small facility growth rates survive save and remain visible per month',"document.querySelector('#facility-detail').textContent.includes('0.04')");
  // Global discipline offices must affect actual students, not only their office cards.
  const admin=JSON.parse(JSON.stringify(fresh));admin.roles['政教处主任']=teacherId;admin.roleOrigins['政教处主任']='teacher';await restore(fresh);await evaluate('Math.random=()=>.5');await advance(1);const withoutAdmin=await saved();await restore(admin);await evaluate('Math.random=()=>.5');await advance(1);const withAdmin=await saved();assert.ok(withAdmin.students[0].dailyChange.discipline>withoutAdmin.students[0].dailyChange.discipline);checks.push('discipline office benefits reach real student growth');console.log('PASS discipline office benefits reach real student growth');
  // A weekly brief on the first gaokao day must never trap the player again.
  const gaokao=JSON.parse(JSON.stringify(fresh));gaokao.date='2023-05-31T00:00:00+08:00';gaokao.day=335;gaokao.leaderboard=rankedRun.leaderboard;await restore(gaokao);
  await evaluate(`(()=>{
    const originalFetch=window.fetch;
    window.rankingTest={online:false,post:null};
    window.fetch=async (url,options={})=>{
      if(!String(url).includes('/api/leaderboard'))return originalFetch(url,options);
      if(!window.rankingTest.online)throw new Error('network unavailable');
      if(options.method==='POST'){
        window.rankingTest.post=JSON.parse(options.body);
        return Response.json({score:window.rankingTest.post.score});
      }
      return Response.json({rows:[window.rankingTest.post]});
    };
  })()`);
  await advance(1);
  await check('first gaokao day shows actionable weekly brief above the season',"!document.querySelector('#gaokao-season').hidden&&!document.querySelector('#event-modal').hidden&&+getComputedStyle(document.querySelector('#event-modal')).zIndex>+getComputedStyle(document.querySelector('#gaokao-season')).zIndex");
  await drain();for(let i=0;i<10;i++){await click('#gaokao-next');await pause(180);await drain();}
  await check('gaokao completes ten mocks and retains 390 pupils in five-class grades',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.gaokao.mocks.length===10&&s.gaokao.reports.length===1&&s.students.length===390&&Object.keys(s.classTeachers).length===15}");
  await check('the actual gaokao score survives offline as a pending entry',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.leaderboard.best===s.gaokao.reports[0].avg&&s.leaderboard.synced===null}");
  await evaluate("window.rankingTest.online=true");
  await click('#gaokao-leaderboard-btn');
  await check('reopening the leaderboard sends the pending score and safely renders the nickname',
    "{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1')),row=document.querySelector('#leaderboard-rows li b');s.leaderboard.synced===s.gaokao.reports[0].avg&&window.rankingTest.post.nickname==='<校友>'&&row.textContent==='<校友>'&&row.children.length===0}");
  await click('#leaderboard-dialog form button');
  await check('year rollover rotates each original teaching team without aliasing',`{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));JSON.stringify(s.classTeachers['1-1'])===${JSON.stringify(JSON.stringify(fresh.classTeachers['3-1']))}&&JSON.stringify(s.classTeachers['2-1'])===${JSON.stringify(JSON.stringify(fresh.classTeachers['1-1']))}&&JSON.stringify(s.classTeachers['3-1'])===${JSON.stringify(JSON.stringify(fresh.classTeachers['2-1']))}}`);
  const month=JSON.parse(JSON.stringify(fresh));month.date='2022-07-31T00:00:00+08:00';month.day=31;month.budgets.security=150;await restore(month);await evaluate('Math.random=()=>.5');await advance(1);await check('monthly security investment redistributes to stability and satisfaction',"{const s=JSON.parse(localStorage.getItem('qiu-principal-sim-v1'));s.stabilityBonus>0&&s.staffSatisfaction>64&&s.studentSatisfaction>62&&s.money>0}");
  // Default views fit the app viewport on desktop and phone, without page scrolling.
  await restore(fresh);
  for(const width of [375,768,1024,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:width===375?812:800,deviceScaleFactor:1,mobile:width<=780});await pause(150);for(const view of ['overview','map','people','students','policies','finance','actions']){await click(`[data-view="${view}"]`);await check(`viewport ${view} ${width}`,"document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1");}await click('[data-view="overview"]');await check('all statuses fit '+width,"[...document.querySelectorAll('#metric-grid .metric-card')].every(x=>{const r=x.getBoundingClientRect();return r.height>0&&r.bottom<innerHeight-45})");if(width===375){await screenshot('overhaul-mobile-home',375,812);await click('[data-view="map"]');await click('#strategy-map [data-school="xiang"]');await screenshot('overhaul-mobile-league',375,812);await click('[data-view="people"]');await click('[data-people-tab="teachers"]');await check('four people tabs fit on phone',"[...document.querySelectorAll('.people-tabs .seg')].every(x=>x.getBoundingClientRect().right<=innerWidth&&x.getBoundingClientRect().width>40)");await screenshot('overhaul-mobile-teachers',375,812);await click('[data-view="policies"]');await click('.policy-group:not([hidden]) summary');await screenshot('overhaul-mobile-policies',375,812);await click('[data-view="students"]');await screenshot('overhaul-mobile-students',375,812);}}
  await send('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:true});await pause(120);await click('[data-view="overview"]');await check('all school statuses fit a short 375x667 phone',"[...document.querySelectorAll('#metric-grid .metric-card')].every(x=>x.getBoundingClientRect().bottom<innerHeight-54)");await screenshot('overhaul-short-phone',375,667);
  assert.equal(errors.length,0,JSON.stringify(errors));await fs.writeFile(path.join(root,'docs/ui-review/overhaul-checks.json'),JSON.stringify({checks,errors},null,2));console.log(`Completed ${checks.length} integration checks without runtime errors.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{socket?.close();if(chrome)chrome.kill();if(server)server.close();});
