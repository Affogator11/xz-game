/* Registry: 244 unique events, backward-compatible identifiers and branch keys. */
(function(){
  'use strict';
  const lib=window.CampusEventLibrary,D=window.GAME_DATA;
  const round=n=>Math.round(n*100)/100;
  function normalizeEffect(effect,scale=1){const output={};for(let[k,v]of Object.entries(effect||{})){if(k==='safety')k='stabilityBonus';if(k==='morale')k='studentSatisfaction';if(k==='management')k='adminModifier';output[k]=(output[k]||0)+(typeof v==='number'?round(v*(k==='money'?1.1:k==='ap'?1:scale)):v)}return output}
  const original=[...D.events,...lib.events,...Object.values(lib.followups)];
  original.forEach(e=>{e.choices.forEach(c=>{c.effect=normalizeEffect(c.effect,1.7);c.feedback=c.feedback||`“${c.text}”的批示送到了负责老师手中。工作人员据此调整安排，并将落实情况记入回执；师生感受到的变化也一并交回办公室。`});if(e.choices.length<3)e.choices.push({text:'暂缓办理，按现有条件维持',effect:{studentSatisfaction:-3,staffSatisfaction:-1.5,authority:-.5},feedback:'办公室把事项排到了后面，负责人员先用现有条件维持运转。眼前没有增加支出，但师生认为问题仍未得到正式解决，后续沟通的压力留在了学校。'});});
  const labels={studentAnger:'愤怒',studentMindset:'心态',schoolMorale:'士气',stabilityBonus:'稳定',studentSatisfaction:'学生满意',teacherSatisfaction:'教师满意',staffSatisfaction:'职工满意',teaching:'教学',academics:'学业'};
  window.COUNTY_EVENT_THEMES.forEach(([tag,trigger,impact,rows],theme)=>{
    rows.forEach(([title,scene,detail],i)=>{
      const id=`county_${theme+1}_${i+1}`,support=impact==='studentAnger'?-6:impact==='stabilityBonus'?4:4.5,damage=impact==='studentAnger'?7:-5;
      const effect0={money:-(5000+(theme%6)*1800+i*1100),[impact]:support,authority:.7};
      const effect1={money:-(1800+i*500),[impact]:impact==='studentAnger'?-1.5:1.5,teacherSatisfaction:-2.5,adminModifier:-1};
      const effect2={[impact]:damage,studentSatisfaction:-2.5,authority:-1.2};if(impact==='studentSatisfaction')effect2[impact]=-5;
      const root={id,tag,title,text:`${scene}${detail}负责人员递交了完整记录，请学校决定本周如何处理。`,kind:i===4&&/分享|作品|志愿|交流|毕业|新教师|进步|职业/.test(title+scene)?'opportunity':i%2?'crisis':'state',weight:i%2?4:3,cooldown:35,condition:s=>{if(i===4)return true;if(trigger==='money')return s.money<260000||i===1;if(trigger==='studentAnger')return(s.students||[]).reduce((a,x)=>a+(x.anger||0),0)/Math.max(1,s.students.length)>25||i===3;return(s[trigger]??60)<(i%2?85:72);},choices:[{text:'落实专项方案，安排经费与负责人',effect:effect0,feedback:`学校拨出专项经费，负责人员逐项落实“${title}”的处理要求。师生知道了明确的负责人和完成节点，问题得到实质改善；经费也按实际安排从学校账上支出。`},{text:'先做临时调整，由现有人员分担',effect:effect1,feedback:`负责老师用现有条件处理了“${title}”的眼前问题，学生暂时能正常学习生活。方案控制了花费，但额外工作压在现有人员身上，教师与办公室的协调压力有所增加。`},{text:'暂不处理，要求相关人员自行克服',effect:effect2,feedback:`办公室没有为“${title}”追加资源，相关人员只能继续自行应对。问题没有消失，师生对学校回应的信任下降；短期省下的经费伴随着更明显的情绪和秩序代价。`}]};
      lib.events.push(root);
      if(i===0){const success={id:`${id}_review`,tag:`${tag}后续`,title:`${title}：一周回访`,text:`上周关于“${title}”的批示已有回执，负责人员把处理前后的记录带到办公室。大部分问题得到改善，师生也提出了几个需要继续维护的细节。值班老师笑称，工作不能只在拍照那天完成，请校长决定如何保住这次改进。`,choices:[{text:'安排复核，形成长期做法',effect:{money:-4500,[impact]:support/2,prestige:1.5},feedback:'学校完成复核并明确长期责任，改进得以保留。负责老师把后续检查写进值班安排，师生得到稳定的回应。'},{text:'阶段结束，转入日常管理',effect:{staffSatisfaction:-1.5,[impact]:impact==='studentAnger'?2:-1.5},feedback:'专项工作告一段落，后续交给日常值班处理。人员负担没有完全减轻，部分改进开始回落。'}]},escalation={id:`${id}_escalation`,tag:`${tag}后续`,title:`${title}：新的催办`,text:`关于“${title}”的反馈再次送到办公室，临时措施未能覆盖所有人的实际困难。负责人员说，相关师生现在更想知道谁来负责、何时完成。便签已经从提醒写成了催办，校长需要给出更明确的答复。`,choices:[{text:'补充资源并公开整改节点',effect:{money:-18000,[impact]:support,authority:-1},feedback:'学校追加资源补救，并公开说明此前延误。问题开始缓解，但额外支出和沟通代价已经无法避免。'},{text:'继续维持原安排',effect:{[impact]:damage*1.5,prestige:-3,staffSatisfaction:-3},feedback:'学校继续维持原安排，催办没有换来明确处理节点。相关人员失去耐心，负面影响从具体问题扩展到对学校管理的评价。'}]};
        lib.followups[id+':0']=success;lib.followups[id+':1']=escalation;lib.followups[id+':2']=escalation;lib.followups[success.id+':1']=escalation;
      }
    });
  });
  const registry=new Map([...D.events,...lib.events,...Object.values(lib.followups)].map(e=>[e.id,e]));
  if(registry.size!==244)throw new Error(`事件库应为244项，实际${registry.size}`);
  window.CampusEventCatalog={registry,count:244,get:id=>registry.get(id),all:()=>[...registry.values()]};
})();
