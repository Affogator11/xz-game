(function () {
  'use strict';
  const {events,followups}=window.CampusEventLibrary;
  const find=(id,legacy)=>[...legacy,...events,...Object.values(followups)].find(e=>e.id===id);
  function eventType(event){if(!event)return '事件';if(event.kind==='aiInvite')return '校际邀请';if(Object.values(followups).some(x=>x.id===event.id))return '后续事件';if(Object.keys(followups).some(k=>k===event.id||k.startsWith(event.id+':'))||['student_petition','teacher_project'].includes(event.id))return '关联事件';return '单次事件'}
  window.CampusEvents={find,eventType,briefing(state,legacy){
    const due=(state.campusEventPending||[]).find(x=>x.day<=state.day&&followups[x.source]);
    const selected=due?[followups[due.source]]:[];
    const history=state.campusEventHistory||{}, categories=state.campusEventCategories||{};
    const all=[...legacy,...events.filter(e=>e.condition(state))];
    const singles=all.filter(e=>!Object.keys(followups).some(k=>k===e.id||k.startsWith(e.id+':'))&&e.id!=='student_petition'&&e.id!=='teacher_project');
    function draw(source){let pool=source.filter(e=>!selected.some(x=>x.id===e.id)&&state.day-(history[e.id]??-999)>=28&&state.day-(categories[e.tag]??-999)>=14&&!selected.some(x=>x.tag===e.tag));if(!pool.length)pool=source.filter(e=>!selected.some(x=>x.id===e.id)&&state.day-(history[e.id]??-999)>=28);if(!pool.length)pool=source.filter(e=>!selected.some(x=>x.id===e.id));const weighted=pool.flatMap(e=>Array(events.includes(e)?3:1).fill(e));if(weighted.length)selected.push(weighted[Math.floor(Math.random()*weighted.length)])}
    draw(singles);while(selected.length<3)draw(all);
    return selected.map(e=>({id:e.id,done:false}));
  },pick(state,legacy){
    const history=state.campusEventHistory||(state.campusEventHistory={});
    const due=(state.campusEventPending||[]).find(x=>x.day<=state.day&&followups[x.source]);
    if(due)return followups[due.source];
    const categories=state.campusEventCategories||{};
    const candidates=[...legacy,...events.filter(e=>e.condition(state))].filter(e=>state.day-(history[e.id]??-999)>=28);
    const pool=candidates.filter(e=>state.day-(categories[e.tag]??-999)>=14);
    const eligible=pool.length?pool:candidates.length?candidates:legacy;
    const weighted=eligible.flatMap(e=>Array(events.includes(e)?(e.id==='budget_pressure'&&state.money<0?5:3):1).fill(e));
    const event=weighted[Math.floor(Math.random()*weighted.length)];
    return event;
  },record(state,event,index){(state.campusEventHistory||(state.campusEventHistory={}))[event.id]=state.day;(state.campusEventCategories||(state.campusEventCategories={}))[event.tag]=state.day;const pending=state.campusEventPending||(state.campusEventPending=[]);const done=pending.findIndex(x=>followups[x.source]?.id===event.id&&x.day<=state.day);if(done>=0)pending.splice(done,1);const branch=followups[event.id+':'+index]?event.id+':'+index:(index===0&&followups[event.id]?event.id:null);if(branch)pending.push({source:branch,day:state.day+7});const memory=state.campusEventMemory||(state.campusEventMemory={});if(event.id==='club_application')memory.studentIgnored=Math.max(0,(memory.studentIgnored||0)+(index===2?1:-1));if(event.id==='teacher_workshop'&&index===0)memory.teacherSupport=(memory.teacherSupport||0)+1;if(event.id==='student_petition'&&index===0)memory.studentIgnored=0;if(event.id==='teacher_project')memory.teacherSupport=0;const log=state.campusEventLog||(state.campusEventLog=[]);log.unshift({id:event.id,title:event.title,choice:event.choices[index].text,day:state.day});if(log.length>100)log.length=100}};
})();
