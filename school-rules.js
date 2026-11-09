/* Rules shared by the simulation, migrations, standings and regression checks. */
(function(){
  'use strict';
  const D=window.GAME_DATA,round=n=>Math.round((Number(n)||0)*100)/100,clamp=(n,a=0,b=100)=>round(D.clamp(n,a,b));
  const classes=[1,2,3,4,5],grades=[1,2,3],core=['语文','数学','英语'],sciences=['物理','化学','生物'],arts=['政治','历史','地理'];
  const subjects=c=>[...core,...(c===3||c===5?arts:sciences)];
  const classType=c=>c===4?'理科清北班':c===5?'文科清北班':c===3?'文科普通班':'理科普通班';
  const className=(g,c)=>`高${['','一','二','三'][g]}（${c}）班`;
  function softScore(raw){return clamp(raw<=600?raw:600+150*(1-Math.exp(-(raw-600)/150)),0,750)}
  function growth(academic,amount){return round(amount>0?amount*Math.max(.08,Math.pow(Math.max(0,1-academic/110),1.25)):amount)}
  const composite=s=>round(s.stats[0]*.55+s.stats[1]*.2+s.stats[2]*.15+s.stats[3]*.1);
  // Teaching, management, communication and growth, in the same order as staff stats.
  const traitModifiers = {
    因材施教:[4,-2,2,0], 题海专家:[6,0,0,-3], 课堂掌控:[3,3,-3,0],
    竞赛教练:[5,-3,0,1], 耐心细致:[0,-2,4,2], 数据敏锐:[2,3,-2,0],
    家校能手:[-2,0,6,0], 课程革新:[3,-3,0,4], 铁面无私:[0,6,-3,0],
    温和坚定:[0,2,3,-2], 资源整合:[-2,3,3,0], 青年先锋:[0,-3,1,6],
    稳定军心:[-2,2,4,0], 高考研究:[5,0,-2,1], 行政老练:[-3,6,0,0],
    招生伯乐:[-2,0,4,2]
  };
  function assignStaffStats(teacher, stats){
    teacher.stats = stats.map(value=>clamp(value));
    teacher.overall = round(teacher.stats.reduce((sum,value)=>sum+value,0)/4);
    teacher.stars = Math.ceil(teacher.overall/20);
    teacher.signing = Math.round(3000+teacher.overall*220);
    return teacher;
  }
  function withTrait(stats, modifiers){
    return stats.map((value,i)=>clamp(value+modifiers[i]));
  }
  function reduceStaffStats(stats){
    if (stats.length!==6) return stats;
    const [teaching,research,management,communication,growth,reliability] = stats;
    return [teaching*.75+research*.25,management*.75+reliability*.25,communication,growth].map(round);
  }
  function staff(raw){
    return raw.map(teacher=>{
      const traitModifiersForTeacher = traitModifiers[teacher.trait] || [0,0,0,0];
      const initialStats = withTrait(reduceStaffStats(teacher.stats),traitModifiersForTeacher);
      return assignStaffStats({...teacher,initialStats,traitModifiers:traitModifiersForTeacher},initialStats);
    });
  }
  function students(count=1200,seed=261001){const rng=D.mulberry32(seed),legacy=D.generateStudentsLegacy(count,seed);return legacy.map((s,i)=>{const grade=1+Math.floor(i/Math.ceil(count/3)),c=i%5+1,elite=c>=4,base=elite?76:54+(c===1?3:c===2?-2:0),academic=clamp(base+(rng()-.5)*(elite?25:38)),stats=[academic,clamp(45+rng()*40),clamp(45+rng()*40),clamp(Math.max(academic,65+rng()*30))];const result={...s,grade,classNo:c,className:className(grade,c),track:c===3||c===5?'文科':'理科',elite,stats,anger:round(8+rng()*22)};result.composite=composite(result);result.tier=D.tierOf(result.composite);result.score=softScore(210+academic*5.2+stats[1]*.55+stats[2]*.4);return result})}
  D.generateStudentsLegacy=D.generateStudents;D.generateStudents=students;
  // Redistribute removed research/reliability weights to teaching and management.
  D.roleDefinitions.forEach(def=>{const w=def.weights;def.weights=[round(w[0]+w[1]),round(w[2]+w[5]),w[3],w[4]];const sum=def.weights.reduce((a,b)=>a+b,0);def.weights=def.weights.map(v=>v/sum);if(def.effects.safety){def.effects.stabilityBonus=def.effects.safety;delete def.effects.safety}});
  D.facilities.forEach(f=>{if(f.effects.safety){f.effects.stabilityBonus=f.effects.safety;delete f.effects.safety}});
  D.schoolPolicyDefinitions.forEach(def=>def.options.forEach(o=>{if(o.effects.safety){o.effects.stability=o.effects.safety+(o.effects.stability||0);delete o.effects.safety}}));
  function allKeys(){return grades.flatMap(g=>classes.map(c=>`${g}-${c}`))}
  function assignments(s,id){const rows=[];Object.entries(s.classTeachers||{}).forEach(([key,a])=>{if(a.homeroomId===id)rows.push({key,subject:'班主任'});Object.entries(a.subjects||{}).forEach(([subject,t])=>{if(t===id)rows.push({key,subject})})});Object.entries(s.gradeSpecialists||{}).forEach(([g,a])=>Object.entries(a).forEach(([subject,t])=>{if(t===id)rows.push({key:`${g}-0`,subject})}));return rows}
  function canAssign(s,t,key,homeroom=false){if(!t)return'人员不存在';if((s.exchangeTrips||[]).some(x=>x.staffId===t.id&&x.status==='away'))return'正在外校交流';const own=assignments(s,t.id),home=own.find(a=>a.subject==='班主任'),teaching=[...new Set(own.filter(a=>a.subject!=='班主任').map(a=>a.key))];if(['体育','信息'].includes(t.subject))return'体育、信息教师请从年级专任区安排';if(homeroom){if(home&&home.key!==key)return'已担任其他班班主任';if(teaching.some(k=>k!==key))return'班主任只能在本班任课';if(!subjects(Number(key.split('-')[1])).includes(t.subject))return'任教学科与班级方向不符'}else{if(home&&home.key!==key)return'班主任只能在本班任课';if(!teaching.includes(key)&&teaching.length>=3)return'已达到三个班上限'}return''}
  function allocate(s,staffList,fresh=false){
    const byId=id=>staffList.find(t=>t.id===id),old=s.classTeachers||{},available=staffList.filter(t=>s.staffIds.includes(t.id)||s.candidateIds.includes(t.id));
    s.classTeachers=Object.fromEntries(allKeys().map(k=>[k,{homeroomId:null,subjects:{}}]));s.gradeSpecialists={1:{},2:{},3:{}};
    const usedHome=new Set();
    for(const key of allKeys()){const c=Number(key.split('-')[1]),prior=byId(old[key]?.homeroomId),pool=available.filter(t=>!usedHome.has(t.id)&&subjects(c).includes(t.subject)).sort((a,b)=>b.stats[1]-a.stats[1]);const t=prior&&pool.includes(prior)?prior:pool[0];if(t){usedHome.add(t.id);s.classTeachers[key].homeroomId=t.id;s.classTeachers[key].subjects[t.subject]=t.id}}
    for(const subject of [...core,...sciences,...arts])for(const key of allKeys()){const a=s.classTeachers[key];if(!subjects(Number(key.split('-')[1])).includes(subject)||a.subjects[subject])continue;const pool=available.filter(t=>t.subject===subject&&!canAssign(s,t,key)).sort((a,b)=>{const load=t=>assignments(s,t.id).filter(x=>x.subject!=='班主任').length;return load(a)-load(b)||b.stats[0]-a.stats[0]});a.subjects[subject]=pool[0]?.id||null}
    for(const g of grades)for(const subject of ['体育','信息']){const pool=available.filter(t=>t.subject===subject&&!assignments(s,t.id).length).sort((a,b)=>b.stats[0]-a.stats[0]);s.gradeSpecialists[g][subject]=pool[0]?.id||null}
    const employed=new Set(Object.values(s.roles||{}));staffList.forEach(t=>{if(assignments(s,t.id).length)employed.add(t.id)});s.staffIds=[...new Set([...s.staffIds,...[...employed].filter(id=>!Object.values(s.roles||{}).includes(id))])];s.candidateIds=s.candidateIds.filter(id=>!employed.has(id));
  }
  function migrate(s,staffList){
    s.staffDevelopment??={};s.stabilityBonus??=0;s.schoolMorale??=60;s.exchangeRequests??=[];s.exchangeTrips??=[];s.standardExamHistory??=[];
    if(s.overhaulVersion!==2){
      s.preOverhaulArchive??={students:[],classTeachers:JSON.parse(JSON.stringify(s.classTeachers||{})),map:s.map,claims:s.claims};
      const before=s.students;const result=[];
      for(const g of grades){const list=before.filter(x=>x.grade===g),old=list.some(x=>x.classNo===6)||list.some(x=>x.stats.length===6);if(old){const sci=list.filter(x=>x.classNo<=3),art=list.filter(x=>x.classNo===4),eliteSci=list.filter(x=>x.classNo===5),eliteArt=list.filter(x=>x.classNo===6);const pools=[sci.slice(0,30),sci.slice(30,60),[...art,...sci.slice(60,65)].slice(0,30),eliteSci.slice(0,20),eliteArt.slice(0,20)];pools.forEach((pool,i)=>pool.forEach(x=>{x.classNo=i+1;result.push(x)}));const keep=new Set(result.map(x=>x.id));s.preOverhaulArchive.students.push(...list.filter(x=>!keep.has(x.id)))}else result.push(...list)}
      s.students=result;for(const student of s.students){if(student.stats.length===6)student.stats=[student.stats[0],student.stats[1],round(student.stats[2]*.7+student.stats[3]*.15+student.stats[5]*.15),student.stats[4]];student.className=className(student.grade,student.classNo);student.track=[3,5].includes(student.classNo)?'文科':'理科';student.elite=student.classNo>=4;student.composite=composite(student);student.tier=D.tierOf(student.composite)}
      // Fill any exceptionally short legacy class from the deterministic library.
      const library=students();for(const key of allKeys()){const [g,c]=key.split('-').map(Number),limit=c>=4?20:30,group=s.students.filter(x=>x.grade===g&&x.classNo===c);for(let i=group.length;i<limit;i++){const source=library.find(x=>x.grade===g&&x.classNo===c&&!s.students.some(t=>t.id===x.id));if(source)s.students.push({...source,stats:[...source.stats],dailyChange:{academic:0,discipline:0,mindset:0,anger:0}})}}
      allocate(s,staffList);s.scheduledEvents.forEach(e=>{e.classKeys=[...new Set((e.classKeys||[]).map(k=>{let[g,c]=k.split('-').map(Number);if(c===6)c=5;else if(c===5)c=4;else if(c===4)c=3;else if(c===3)c=2;return`${g}-${c}`}))];});
      s.overhaulVersion=2;delete s.map;delete s.claims;delete s.safety;s.rosterVersion=2;s.curriculumVersion=2;
    }
    const home=s.schools.find(x=>x.id==='qiu');if(home&&s.power!==undefined)home.power=s.power;
    s.league??={version:1,points:Object.fromEntries(s.schools.map(x=>[x.id,round(x.power*10)])),played:{},history:[]};s.league.played??={};s.league.history??=[];
    s.schools.forEach(x=>{x.morale??=60;if(x.id==='qiu')x.students=s.students.length});
    for (const teacher of staffList) {
      const saved = s.staffDevelopment[teacher.id];
      if (saved && !s.staffTraitVersion) {
        s.staffDevelopment[teacher.id] = withTrait(reduceStaffStats(saved),teacher.traitModifiers);
      }
      assignStaffStats(teacher,s.staffDevelopment[teacher.id] || teacher.initialStats);
    }
    s.staffTraitVersion = 1;
    delete s.map;delete s.claims;delete s.safety;return s;
  }
  function ranking(s){return [...s.schools].sort((a,b)=>(s.league.points[b.id]||0)-(s.league.points[a.id]||0)||b.power-a.power||a.id.localeCompare(b.id))}
  const rank=(s,id='qiu')=>ranking(s).findIndex(x=>x.id===id)+1;
  function points(kind,score,position,margin=0){if(kind==='province')return round(120+clamp(score/750,0,1)*120);if(kind==='city')return position<=4?round(35+score/750*45):-round(10+(750-score)/750*30);return round(8+clamp(margin/15,0,12))}
  function morale(s,id,amount){const school=s.schools.find(x=>x.id===id);school.morale=clamp(school.morale+amount);if(id==='qiu'){s.schoolMorale=school.morale;for(const k of ['staffSatisfaction','teacherSatisfaction','studentSatisfaction'])s[k]=clamp(s[k]+amount*.5);s.students.forEach(t=>t.stats[2]=clamp(t.stats[2]+amount*.2))}}
  function settlePair(s,id,a,b,scoreA,scoreB,date){if(s.league.played[id])return s.league.played[id];const margin=round(scoreA-scoreB),winner=Math.abs(margin)<.01?null:margin>0?a:b,gain=winner?points('joint',Math.max(scoreA,scoreB),1,Math.abs(margin)):0;if(winner){s.league.points[winner]=round(s.league.points[winner]+gain);morale(s,winner,3);morale(s,winner===a?b:a,-3)}const row={id,kind:'joint',date,a,b,scoreA,scoreB,winner,gain};s.league.played[id]=row;s.league.history.unshift(row);s.league.history=s.league.history.slice(0,80);return row}
  function scoreStudent(s,state,rng=Math.random,boost=false){const raw=(210+s.stats[0]*5.2+s.stats[1]*.55+s.stats[2]*.4+(state.teaching-50)*.2+((state.academics??50)-50)*.2+(state.schoolMorale-50)*.12-s.anger*.38+(rng()-.5)*24+(state.examBonus||0))*(boost?1.1:1);return softScore(raw)}
  function standardExam(s,kind,date,rng=Math.random){const key=`${kind}-${date}`;if(s.league.played[key])return null;const boost=s.principalSkills.examBoost,performance=window.SchoolOperations?.examPerformance(s,s.students,rng);let actualGain=0;s.students.forEach(t=>{const roll=rng(),base=scoreStudent(t,s,()=>roll,boost);t.score=scoreStudent(t,{...s,examBonus:performance?.bonuses[t.id]||0},()=>roll,boost);actualGain+=t.score-base;t.stats[0]=clamp(t.stats[0]+growth(t.stats[0],.18));});if(performance){performance.averageGain=round(actualGain/s.students.length);delete performance.bonuses;}if(boost)s.principalSkills.examBoost=false;const average=round(s.students.reduce((n,t)=>n+t.score,0)/s.students.length),rows=s.schools.map(school=>({id:school.id,name:school.name,score:school.id==='qiu'?average:softScore(school.exam+35+(school.power-50)*.35+(school.morale-50)*.1+(rng()-.5)*18)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));rows.forEach((row,i)=>{row.position=i+1;row.delta=points(kind,row.score,i+1);s.league.points[row.id]=round(s.league.points[row.id]+row.delta);morale(s,row.id,i<4?2:-2)});const report={id:key,kind,date,rows,boosted:boost,performance};s.league.played[key]=report;s.league.history.unshift(report);s.league.history=s.league.history.slice(0,80);s.standardExamHistory.unshift(report);s.standardExamHistory=s.standardExamHistory.slice(0,24);return report}
  function exchangeDay(s,staffList,rng=Math.random){const updates=[];for(const request of s.exchangeRequests){if(request.status==='pending'&&s.day>=request.replyDay){const target=s.schools.find(x=>x.id===request.targetId);request.status=rng()<request.chance?'accepted':'rejected';request.replyDate=s.date;updates.push(`${target.short}回复：${request.status==='accepted'?'同意学习交流，请选择行政人员。':'本次暂无法接待。'}`)}}for(const trip of s.exchangeTrips){if(trip.status==='away'&&s.day>=trip.returnDay){const t=staffList.find(x=>x.id===trip.staffId),target=s.schools.find(x=>x.id===trip.targetId);const gain=round((1+target.power*.035)*(.75+t.stats[3]/200));t.stats=t.stats.map(v=>clamp(v+gain));t.overall=round(t.stats.reduce((a,b)=>a+b,0)/4);s.staffDevelopment[t.id]=[...t.stats];trip.status='returned';trip.gain=gain;s.roles[trip.role]=trip.staffId;updates.push(`${t.name}交流归校，四项能力各 +${gain.toFixed(2)}，恢复${trip.role}。`)}}return updates}
  function locked(s,role){return(s.exchangeTrips||[]).some(x=>x.role===role&&x.status==='away')}
  function roundState(value){if(typeof value==='number')return round(value);if(Array.isArray(value))return value.map(roundState);if(value&&typeof value==='object'){Object.keys(value).forEach(k=>{if(k==='effects')return;if(typeof value[k]==='number')value[k]=round(value[k]);else if(typeof value[k]==='object')value[k]=roundState(value[k])});}return value}
  window.SchoolRules={round,clamp,classes,grades,subjects,classType,className,staff,students,allKeys,assignments,canAssign,allocate,migrate,composite,softScore,growth,ranking,rank,points,settlePair,scoreStudent,standardExam,exchangeDay,locked,roundState};
})();
