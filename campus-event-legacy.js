(function(){
'use strict';
  const events = [
    {id:'rain',tag:'校园突发',title:'一场秋雨漏进了老教学楼',text:'连续暴雨后，高二楼顶出现渗水。后勤主任说可以先做应急修补，也可以借机彻底翻修。',choices:[
      {text:'彻底翻修防水层',hint:'支出 ¥80,000；安全 +8，声望 +2',effect:{money:-80000,safety:8,prestige:2}},
      {text:'先做应急修补',hint:'支出 ¥18,000；安全 +2，可能留下隐患',effect:{money:-18000,safety:2}},
      {text:'封闭一层教室',hint:'无支出；教学 -2，心态 -2',effect:{teaching:-2,morale:-2}}
    ]},
    {id:'donation',tag:'社会关注',title:'一位老校友回来了',text:'毕业二十年的校友提出捐建一间阅读室，但希望以家族名义冠名。',choices:[
      {text:'接受捐赠并公开致谢',hint:'获得 ¥160,000；声望 +3',effect:{money:160000,prestige:3}},
      {text:'接受捐赠，不做商业冠名',hint:'获得 ¥90,000；声望 +6',effect:{money:90000,prestige:6}},
      {text:'婉拒并发起公众募捐',hint:'获得 ¥35,000；社会关系 +5',effect:{money:35000,relation:5}}
    ]},
    {id:'phone',tag:'德育现场',title:'晚自习里的手机风波',text:'值班教师一次没收了十七部手机，家长群里争论激烈。政教处等待你的定调。',choices:[
      {text:'召开学生听证会，重订规则',hint:'行动点 -1；心态 +5，教学 +1',effect:{ap:-1,morale:5,teaching:1}},
      {text:'严格执行一刀切禁令',hint:'教学 +3；心态 -4',effect:{teaching:3,morale:-4}},
      {text:'交由各班自行协商',hint:'心态 +2；管理 -2',effect:{morale:2,management:-2}}
    ]},
    {id:'teacher',tag:'人才流动',title:'金金高中递来了一份高薪合同',text:'你的数学骨干教师被同县对手挖角。对方给出的工资比现在高出三成。',choices:[
      {text:'匹配待遇并授予教研职责',hint:'支出 ¥65,000；师资 +3',effect:{money:-65000,teaching:3}},
      {text:'谈长期成长与住房补贴',hint:'支出 ¥28,000；50% 成功，成功则师资 +2',effect:{money:-28000,chanceTeaching:2}},
      {text:'尊重选择，启用青年教师',hint:'师资 -2；青年成长 +3',effect:{teaching:-2,teacherGrowth:3}}
    ]},
    {id:'competition',tag:'学业荣誉',title:'物理竞赛传来捷报',text:'两名高二学生进入省队候选名单。带队教师建议追加集训预算。',choices:[
      {text:'全力支持省城集训',hint:'支出 ¥70,000；学业 +4，声望 +4',effect:{money:-70000,academics:4,prestige:4}},
      {text:'校内集训，控制成本',hint:'支出 ¥22,000；学业 +2',effect:{money:-22000,academics:2}},
      {text:'以常规高考教学为先',hint:'资金不变；心态 -2',effect:{morale:-2}}
    ]},
    {id:'canteen',tag:'后勤民生',title:'食堂菜单引发了投票',text:'学生会收集了许多条菜单建议，后勤处希望在营养、价格和满意度之间找到平衡。',choices:[
      {text:'升级营养餐并公示成本',hint:'支出 ¥36,000；学生满意 +4，安全 +1',effect:{money:-36000,morale:4,safety:1}},
      {text:'邀请学生代表参与监督',hint:'行政效率 -1；学生满意 +5，权威 +1',effect:{management:-1,morale:5,authority:1}},
      {text:'维持原方案',hint:'无支出；学生满意 -2',effect:{morale:-2}}
    ]},
    {id:'openclass',tag:'教学现场',title:'一节公开课在全市走红',text:'青年教师的课堂录像被教研员转发，外校提出联合教研邀请。',choices:[
      {text:'组织全校观摩与复盘',hint:'行动点 -1；教学 +3，教师满意 +2',effect:{ap:-1,teaching:3,teacherSatisfaction:2}},
      {text:'与外校联合教研',hint:'支出 ¥18,000；教学 +2，校际关系 +4',effect:{money:-18000,teaching:2,relation:4}},
      {text:'保持低调，奖励教师',hint:'支出 ¥8,000；教师满意 +3',effect:{money:-8000,teacherSatisfaction:3}}
    ]},
    {id:'examstress',tag:'学生状态',title:'月考前的走廊格外安静',text:'心理教师发现部分学生压力明显上升，年级组对是否调整晚自习意见不一。',choices:[
      {text:'减少一节晚自习并开放操场',hint:'学业 -1；学生满意 +4',effect:{academics:-1,morale:4}},
      {text:'增加心理教师值班',hint:'支出 ¥16,000；学生满意 +3，安全 +1',effect:{money:-16000,morale:3,safety:1}},
      {text:'维持备考强度',hint:'学业 +2；学生满意 -3',effect:{academics:2,morale:-3}}
    ]},
    {id:'bus',tag:'校园安全',title:'校门口接送拥堵升级',text:'放学时段车辆排成长龙，附近居民投诉，保卫处提交了三套疏导方案。',choices:[
      {text:'开辟临时接送区',hint:'支出 ¥45,000；安全 +5，声望 +1',effect:{money:-45000,safety:5,prestige:1}},
      {text:'错峰放学',hint:'行政效率 -1；安全 +4',effect:{management:-1,safety:4}},
      {text:'增派值班教师',hint:'教师满意 -2；安全 +3',effect:{teacherSatisfaction:-2,safety:3}}
    ]},
    {id:'alumni',tag:'校友来信',title:'一封来自重点大学的长信',text:'往届毕业生分享了县中学习经历，希望学校更重视自主学习和生涯规划。',choices:[
      {text:'开设生涯规划讲堂',hint:'支出 ¥20,000；学业 +1，学生满意 +3',effect:{money:-20000,academics:1,morale:3}},
      {text:'建立校友导师库',hint:'声望 +3，学生满意 +2',effect:{prestige:3,morale:2}},
      {text:'整理为校史材料',hint:'声望 +2',effect:{prestige:2}}
    ]}
  ];

window.GAME_DATA.events=events;
})();
