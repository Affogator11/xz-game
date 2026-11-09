/* Event registry. Keep existing IDs and branch keys readable by saved games. */
(function(){
  'use strict';
  const lib = window.CampusEventLibrary;
  const D = window.GAME_DATA;
  const {county,legacy,buildChoice} = window.CampusEventChoices;
  const {roots,branches} = window.CampusEventSeason;
  const round = value=>Math.round(value*100)/100;

  function normalizeEffect(effect,scale=1){
    const result = {};
    for (let [key,value] of Object.entries(effect||{})) {
      if (key==='safety') key='stabilityBonus';
      if (key==='morale') key='studentSatisfaction';
      if (key==='management') key='adminModifier';
      result[key] = (result[key]||0)+(typeof value==='number'?round(value*(key==='money'?1.1:key==='ap'?1:scale)):value);
    }
    return result;
  }

  const original = [...D.events,...lib.events,...Object.values(lib.followups)];
  for (const event of original) {
    for (const choice of event.choices) {
      choice.effect = normalizeEffect(choice.effect,1.7);
      choice.feedback ||= `“${choice.text}”的安排已经交给负责老师。办公室收到了落实回执，并记录了相关师生的反馈。`;
    }
  }
  for (const event of new Set(original)) {
    const extra = legacy[event.id];
    if (extra) event.choices.push(...extra.map(buildChoice));
    if (event.choices.length<3) {
      event.choices.push({
        text:'按现有条件维持，暂不追加安排',
        effect:{studentSatisfaction:-3,staffSatisfaction:-1.5,authority:-.5},
        feedback:'办公室先让负责人员按现有条件维持。师生知道了暂缓决定，也把尚未处理的问题留在了下一周的沟通清单上。'
      });
    }
  }

  function countyEligible(state,trigger,index){
    if (index===4) return true;
    if (trigger==='money') return state.money<260000||index===1;
    if (trigger==='studentAnger') {
      const students = state.students||[];
      const average = students.reduce((sum,student)=>sum+(student.anger||0),0)/Math.max(1,students.length);
      return average>25||index===3;
    }
    return (state[trigger]??60)<(index%2?85:72);
  }

  function addCountyFollowups(id,tag,title,impact){
    const relief = impact==='studentAnger'?-6:impact==='stabilityBonus'?4:4.5;
    const penalty = impact==='studentAnger'?7:-5;
    const review = {
      id:`${id}_review`,tag:`${tag}后续`,title:`${title}：一周回访`,
      text:`一周前，“${title}”的安排写进了责任表。负责老师把回执交到办公室，说明哪些工作已经完成、哪些需要继续做。回执最后留了一个空格，等校长决定是否安排复查。`,
      choices:[
        {text:'给复查留经费，把有效做法固定下来',effect:{money:-4500,[impact]:relief/2,prestige:1.5},feedback:'学校完成复查并明确长期责任。值班表里有了下一次检查时间，师生也知道该找谁反馈。'},
        {text:'结束专项安排，按原岗位交接',effect:{staffSatisfaction:-1.5,[impact]:impact==='studentAnger'?2:-1.5},feedback:'专项工作交回日常岗位。由于没有单独复查，负责人员只能在例行工作中发现回落。'},
        {text:'公布回执，先跟进一项最常被反馈的问题',effect:{ap:-1,authority:.8,studentSatisfaction:1.3,adminModifier:-.55},feedback:'办公室公开了处理进度，师生看见有一项问题被继续跟进。其他意见仍需等下一轮排期。'}
      ]
    };
    const escalation = {
      id:`${id}_escalation`,tag:`${tag}后续`,title:`${title}：再一次催办`,
      text:`关于“${title}”的反馈再次送到办公室，第一次安排没有覆盖所有人的困难。负责人把两份来文并排放下，指出这次的问题已经从“能否处理”变成了“由谁在什么时候办完”。`,
      choices:[
        {text:'追加资源，公开负责人与整改时间',effect:{money:-18000,[impact]:relief,authority:-1},feedback:'学校追加了资源并说明此前的延误。问题逐步缓解，但补救挤占了经费，办公室也要多做一次解释。'},
        {text:'维持原安排，由原负责人继续协调',effect:{[impact]:penalty*1.5,prestige:-3,staffSatisfaction:-3},feedback:'负责人员得到的答复仍是维持原状。反馈从现场问题扩大到了对学校兑现承诺的质疑。'},
        {text:'请相关方当面确认轻重缓急，先处理最紧急的部分',effect:{ap:-1,studentAnger:-2.4,authority:.55,teacherSatisfaction:-.9},feedback:'最紧急的部分先分配到了具体人，来催办的师生愿意再等一次。负责协调的老师为此腾出了新的时段。'}
      ]
    };
    lib.followups[id+':0'] = review;
    lib.followups[id+':1'] = escalation;
    lib.followups[id+':2'] = escalation;
    lib.followups[review.id+':1'] = escalation;
  }

  window.COUNTY_EVENT_THEMES.forEach(([tag,trigger,impact,rows],theme)=>{
    rows.forEach(([title,scene,detail],i)=>{
      const id = `county_${theme+1}_${i+1}`;
      const kind = i===4&&/分享|作品|志愿|交流|毕业|新教师|进步|职业/.test(title+scene)
        ? 'opportunity' : i%2 ? 'crisis' : 'state';
      lib.events.push({
        id,tag,title,text:scene+detail,kind,weight:i%2?4:3,cooldown:35,
        condition:state=>countyEligible(state,trigger,i),
        choices:county[theme][i].map(buildChoice)
      });
      if (i===0) addCountyFollowups(id,tag,title,impact);
    });
  });

  lib.events.push(...roots);
  for (const [source,event] of branches) lib.followups[source] = event;
  const registry = new Map([...D.events,...lib.events,...Object.values(lib.followups)].map(event=>[event.id,event]));
  window.CampusEventCatalog = {registry,count:registry.size,get:id=>registry.get(id),all:()=>[...registry.values()]};
})();
