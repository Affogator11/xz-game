/* Result executor. No scheduling or UI; invoked inside game.js's saved transaction. */
(function(){
  'use strict';
  function apply(state,e,{ledger,label}){
    Object.entries(e).forEach(([key,value])=>{
      if(key==='money'){state.money+=value;ledger(label,value)}
      else if(key==='chanceTeaching'){if(Math.random()<.5)state.teaching+=value}
      else if(key==='relation')state.schools.filter(s=>s.id!=='qiu').forEach(s=>s.relation=SchoolRules.clamp(s.relation+value));
      else if(key==='ap')state.actionPoints+=value;
      else if(key==='teacherGrowth')state.teaching+=value*.4;
      else if(key==='studentAnger')state.students.forEach(s=>s.anger=SchoolRules.clamp(s.anger+value));
      else if(key==='studentMindset')state.students.forEach(s=>s.stats[2]=SchoolRules.clamp(s.stats[2]+value));
      else if(key==='schoolMorale'){state.schoolMorale=SchoolRules.clamp(state.schoolMorale+value);state.schools.find(s=>s.id==='qiu').morale=state.schoolMorale}
      else if(key==='safety'){state.stabilityBonus+=value*.6;state.staffSatisfaction+=value*.2;state.studentSatisfaction+=value*.2}
      else if(key==='morale')state.studentSatisfaction+=value;
      else if(key==='management')state.adminModifier+=value;
      else state[key]=(state[key]||0)+value;
    });
  }
  window.CampusEventResults={apply};
})();
