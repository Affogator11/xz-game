const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));global.window=global;
for(const file of ['data.js','school-rules.js','campus-event-legacy.js','campus-event-library.js','campus-event-expansion.js','campus-event-stories.js','event-content-244.js','campus-event-choices.js','campus-event-season.js','campus-event-catalog.js','campus-event-conditions.js','campus-event-results.js','campus-events.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
const D=GAME_DATA,R=SchoolRules,staff=R.staff(D.generateStaff()),students=D.generateStudents(),checks=[];
function test(name,fn){fn();checks.push(name);console.log('PASS '+name)}
function base(){const s={version:1,day:1,date:'2022-07-01T00:00:00+08:00',principalId:'xu',money:680000,staffIds:staff.map(t=>t.id),candidateIds:[],roles:{},scheduledEvents:[],classTeachers:{},students:[1,2,3].flatMap(g=>[1,2,3,4,5].flatMap(c=>students.filter(x=>x.grade===g&&x.classNo===c).slice(0,c>=4?20:30).map(x=>({...x,stats:[...x.stats]})))),schools:D.schools.map(x=>({...x})),teaching:55,studentSatisfaction:62,teacherSatisfaction:61,staffSatisfaction:64,principalSkills:{examBoost:false}};return R.migrate(s,staff)}
test('282 unique story events, 78 unique followups',()=>{assert.equal(CampusEventCatalog.count,282);assert.equal(CampusEventCatalog.all().length,282);assert.equal(new Set(Object.values(CampusEventLibrary.followups).map(e=>e.id)).size,78);CampusEventCatalog.all().forEach(e=>{assert.ok(e.text.length>=40,e.id);assert.ok((e.text.match(/[。！？]/g)||[]).length>=2,e.id);assert.ok(e.choices.length>=2,e.id);assert.ok(e.choices.every(c=>c.feedback?.length>15),e.id)})});
test('all county scenes offer distinct decisions and every event can be resolved with no budget or AP',()=>{
  const catalog=CampusEventCatalog.all();
  const county=catalog.filter(e=>/^county_\d+_\d+$/.test(e.id));
  assert.equal(county.length,95);
  const signatures=new Set();
  for(const e of county){
    assert.equal(e.choices.length,4,e.id);
    assert.equal(new Set(e.choices.map(c=>c.text)).size,4,e.id);
    signatures.add(e.choices.map(c=>c.text).join('|'));
  }
  assert.equal(signatures.size,95);
  for(const e of catalog) assert.ok(e.choices.some(c=>CampusEventConditions.canChoose(c,{money:0,actionPoints:0})),e.id);
  assert.equal(CampusEventConditions.choiceBlock({effect:{ap:-1}},{money:0,actionPoints:0}),'行动点不足');
});
test('new decisions lead to different delayed branches and old branch keys remain valid',()=>{
  const root=CampusEventCatalog.get('county_bus_route_trial');
  for(const [index,id] of [[0,'county_bus_trial_report'],[1,'county_bus_makeup_report']]){
    const s=base();
    s.day=14;
    CampusEvents.record(s,root,index);
    assert.deepEqual(s.campusEventPending,[{source:root.id+':'+index,day:21}]);
    assert.ok(!CampusEvents.briefing(s,D.events).some(x=>x.id===id));
    s.day=21;
    const brief=CampusEvents.briefing(s,D.events);
    assert.ok(brief.some(x=>x.id===id));
    assert.equal(brief.filter(x=>CampusEvents.eventType(CampusEventCatalog.get(x.id))==='后续事件').length,1);
    CampusEvents.record(s,CampusEventCatalog.get(id),0);
    assert.equal(s.campusEventPending.length,0);
  }
  const s=base();
  s.day=21;
  s.campusEventPending=[{source:'county_1_1:1',day:21}];
  assert.ok(CampusEvents.briefing(s,D.events).some(x=>x.id==='county_1_1_escalation'));
  assert.ok(!CampusEventCatalog.get('county_payroll_gap').condition({...s,money:600000}));
  assert.ok(CampusEventCatalog.get('county_payroll_gap').condition({...s,money:100000}));
});
test('15 classes, 390 students and four meaningful student abilities',()=>{const s=base();assert.equal(s.students.length,390);for(const g of [1,2,3])for(const c of [1,2,3,4,5])assert.equal(s.students.filter(x=>x.grade===g&&x.classNo===c).length,c>=4?20:30);assert.ok(s.students.every(x=>x.stats.length===4));assert.ok(staff.every(t=>t.stats.length===4&&t.signing<=25000));});
test('homerooms teach one class, others at most three; six distinct specialists',()=>{const s=base();const specialists=Object.values(s.gradeSpecialists).flatMap(x=>Object.values(x));assert.equal(new Set(specialists).size,6);assert.ok(specialists.every(Boolean));for(const t of staff){const a=R.assignments(s,t.id),home=a.find(x=>x.subject==='班主任'),keys=new Set(a.filter(x=>x.subject!=='班主任').map(x=>x.key));assert.ok(keys.size<=3);if(home)assert.ok([...keys].every(k=>k===home.key));}assert.ok(Object.values(s.classTeachers).every(a=>a.homeroomId&&Object.values(a.subjects).every(Boolean)));});
test('legacy migration archives surplus, preserves money, story state and ids',()=>{const old=D.generateStudentsLegacy(),roster=[1,2,3].flatMap(g=>[1,2,3,4,5,6].flatMap(c=>old.filter(x=>x.grade===g&&x.classNo===c).slice(0,c<=4?25:20)));const s=base();delete s.overhaulVersion;delete s.league;s.students=roster;s.map=[{index:1,school:'qiu'}];s.claims={};s.campusEventPending=[{source:'teacher_workshop',day:50}];s.campusEventHistory={rain:12};s.eventFeedback={title:'旧结果',changes:'资金 -1000'};s.weeklyBrief={items:[{id:'rain',done:true}]};s.money=123456.78;R.migrate(s,staff);assert.equal(s.students.length,390);assert.equal(s.preOverhaulArchive.students.length,30);assert.equal(s.money,123456.78);assert.equal(s.campusEventPending[0].source,'teacher_workshop');assert.equal(s.weeklyBrief.items[0].done,true);assert.equal(s.eventFeedback.title,'旧结果');assert.equal(new Set([...s.students,...s.preOverhaulArchive.students].map(x=>x.id)).size,420);const points=JSON.stringify(s.league.points);s.schools[0].power=1;R.migrate(s,staff);assert.equal(JSON.stringify(s.league.points),points);assert.ok(!s.map&&!s.claims&&!s.safety);});
test('teacher trait modifiers change effective skills and are applied once to old saves',()=>{
  const s=base(), teacher=staff.find(t=>t.trait==='题海专家');
  delete s.staffTraitVersion;
  s.staffDevelopment[teacher.id]=[60,61,62,63];
  R.migrate(s,staff);
  assert.deepEqual(teacher.stats,[66,61,62,60]);
  assert.equal(teacher.overall,62.25);
  R.migrate(s,staff);
  assert.deepEqual(s.staffDevelopment[teacher.id],[66,61,62,60]);
  assert.deepEqual(teacher.stats,[66,61,62,60]);
});
test('starting standings follow school power; scoring bands strictly ordered',()=>{const s=base();assert.deepEqual(R.ranking(s).map(x=>x.id),[...s.schools].sort((a,b)=>b.power-a.power).map(x=>x.id));assert.ok(R.points('joint',750,1,999)<R.points('city',0,1));assert.ok(R.points('city',750,1)<R.points('province',0,1));});
test('joint winner gains, loser keeps points; everyone feels morale; replay is inert',()=>{const s=base(),old=s.league.points.jin,initial=s.league.points.qiu,mind=s.students[0].stats[2];const r=R.settlePair(s,'test','qiu','jin',650,600,'2022-07-10');assert.ok(r.gain>0);assert.equal(s.league.points.qiu,initial+r.gain);assert.equal(s.league.points.jin,old);assert.equal(s.schoolMorale,63);assert.equal(s.teacherSatisfaction,62.5);assert.ok(s.students[0].stats[2]>mind);const snapshot=JSON.stringify(s);R.settlePair(s,'test','qiu','jin',650,600,'2022-07-10');assert.equal(JSON.stringify(s),snapshot);});
test('city top four gain, bottom four lose; province everyone gains; duplicate dates inert',()=>{const s=base(),city=R.standardExam(s,'city','2022-07-20',()=>.5);assert.equal(city.rows.filter(x=>x.delta>0).length,4);assert.equal(city.rows.filter(x=>x.delta<0).length,4);const points=JSON.stringify(s.league.points);assert.equal(R.standardExam(s,'city','2022-07-20',()=>.5),null);assert.equal(JSON.stringify(s.league.points),points);const province=R.standardExam(s,'province','2022-09-25',()=>.5);assert.ok(province.rows.every(x=>x.delta>=120));});
test('exam and academic growth have diminishing returns above high scores',()=>{const s=base(),student={stats:[40,70,70,95],anger:10};const score=academic=>R.scoreStudent({...student,stats:[academic,70,70,95]},s,()=>.5);assert.ok(score(91)-score(90)<score(41)-score(40));assert.ok(R.growth(90,1)<R.growth(50,1));assert.ok(R.softScore(1200)<750);assert.ok(R.softScore(700)<700);});
test('exchange reply, seven-day vacancy lock, growth and return are exactly once',()=>{const s=base(),t=staff[0];s.roles['副校长']=t.id;s.exchangeRequests=[{targetId:'xiang',status:'pending',replyDay:8,chance:.8}];s.day=7;R.exchangeDay(s,staff,()=>0);assert.equal(s.exchangeRequests[0].status,'pending');s.day=8;R.exchangeDay(s,staff,()=>0);assert.equal(s.exchangeRequests[0].status,'accepted');delete s.roles['副校长'];s.exchangeTrips=[{staffId:t.id,role:'副校长',targetId:'xiang',status:'away',returnDay:15}];s.day=14;const before=[...t.stats];R.exchangeDay(s,staff);assert.ok(R.locked(s,'副校长'));assert.equal(s.roles['副校长'],undefined);s.day=15;R.exchangeDay(s,staff);assert.equal(s.roles['副校长'],t.id);assert.ok(t.stats.every((x,i)=>x>before[i]));const after=JSON.stringify(t.stats);R.exchangeDay(s,staff);assert.equal(JSON.stringify(t.stats),after);});
test('weekly scheduler: three events, max one followup, at least one standalone',()=>{const s=base();s.students.forEach(x=>x.anger=45);for(let n=1;n<=120;n++){s.day=n*7;const events=CampusEvents.briefing(s,D.events,n%3===0?{id:'invite-'+n,kind:'aiInvite',tag:'校际邀请',choices:[]}:null);assert.equal(events.length,3);const actual=events.map(x=>x.event||CampusEvents.find(x.id,D.events));assert.ok(actual.filter(x=>CampusEvents.eventType(x)==='后续事件').length<=1);assert.ok(actual.some(x=>CampusEvents.eventType(x)==='单次事件'));for(const e of actual)if(e.kind!=='aiInvite')CampusEvents.record(s,e,0);}});
test('event result executor changes real students, money, morale and stability reserve',()=>{const s=base(),anger=s.students[0].anger,money=s.money;let paid=0;CampusEventResults.apply(s,{money:-5000,studentAnger:5,schoolMorale:-4,stabilityBonus:-3},{ledger:(_,v)=>paid+=v,label:'test'});assert.equal(s.money,money-5000);assert.equal(paid,-5000);assert.equal(s.students[0].anger,R.round(anger+5));assert.equal(s.schoolMorale,56);assert.equal(s.stabilityBonus,-3);});
console.log(`${checks.length} rule suites passed`);
