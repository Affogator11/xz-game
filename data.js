(function () {
  'use strict';

  const surnames = '王李张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文庞樊兰殷施陶洪翟安颜倪严牛温芦季俞章鲁葛伍韦申尤毕聂丛焦向柳邢路岳齐沿梅莫庄辛管祝左涂谷祁时舒耿牟卜肖詹关苗凌费纪靳盛童欧甄项曲成游阳裴席卫查屈鲍位覃霍翁隋植甘景薄单包司柏宁柯阮桂闵欧阳司马上官夏侯诸葛'.match(/欧阳|司马|上官|夏侯|诸葛|./g);
  const givenA = '子浩宇欣雨梓晨若思嘉文天明俊博雅诗一可泽昊铭钰涵梦雪佳怡语辰奕航书瑶安然芷晴景行怀远知夏清禾星野言蹊楚宁云舒沐阳昭月南乔锦书亦凡向晚闻溪慕白承泽乐川之恒念初昭华砚秋初尧令仪望舒知微怀瑾舒窈'.split('');
  const givenB = '然辰涵轩怡妍琪瑞豪杰宁悦航瑶彤霖桐峰睿颖璇瑜墨川清禾安冉晴阳雪竹澄洲野之行初晚微远岚夏秋书月星言予一'.split('');
  const subjects = ['语文','数学','英语','物理','化学','生物','政治','历史','地理','体育','信息'];
  const staffTraits = ['因材施教','题海专家','课堂掌控','竞赛教练','耐心细致','数据敏锐','家校能手','课程革新','铁面无私','温和坚定','资源整合','青年先锋','稳定军心','高考研究','行政老练','招生伯乐'];
  const studentTraits = ['专注','好奇','韧性','领袖气质','偏科','抗压','慢热','社交达人','竞赛苗子','体育健将','文艺骨干','情绪敏感','自我驱动','后程发力'];
  const principalData = [
    {id:'lin',name:'林守正',age:52,title:'实干派校长',trait:'稳扎稳打',desc:'从教三十年，熟悉县中每一个齿轮。行政成本降低 12%，每周多 1 点行动力。',bonus:{admin:12,ap:1},stats:[82,68,76,88,65,72]},
    {id:'xu',name:'许知微',age:41,title:'改革派校长',trait:'课程革新',desc:'省级教研名师，擅长用课程改革撬动成绩。教研行动效果提高 25%，教师成长加快。',bonus:{teaching:25,growth:15},stats:[71,92,66,74,83,78]},
    {id:'gao',name:'高景行',age:46,title:'资源型校长',trait:'八面玲珑',desc:'曾在教育局工作，善于争取资源。政府拨款提高 15%，校际交流关系收益翻倍。',bonus:{grant:15,relation:100},stats:[86,72,91,65,75,84]},
    {id:'hou',name:'侯鸿杰',age:44,title:'激励型校长',trait:'振奋人心',desc:'擅长在关键时刻凝聚学生。可消耗 5 点权威使下一场考试全体原始成绩提高 10%（高分受边际衰减）；平时可消耗 10 点权威，使全校学生愤怒降低 5 点。',bonus:{inspire:true},stats:[78,80,90,83,76,88]}
  ];

  const schools = [
    {id:'xiang',name:'香香一中',short:'香一',color:'#7f2f2b',power:91,students:1152,teachers:126,exam:665,relation:35,motto:'全市标杆，竞赛与强基双线领跑。'},
    {id:'normal',name:'师大附中',short:'附中',color:'#405d84',power:86,students:1056,teachers:116,exam:657,relation:48,motto:'教研传统深厚，教师梯队堪称豪华。'},
    {id:'chang',name:'长长一中',short:'长一',color:'#78547d',power:78,students:1008,teachers:108,exam:642,relation:42,motto:'规模较大，管理严密，县域生源稳定。'},
    {id:'jia',name:'嘉嘉一中',short:'嘉一',color:'#b06b36',power:71,students:912,teachers:101,exam:628,relation:52,motto:'特色课程见长，校园文化活跃。'},
    {id:'yan',name:'延延一中',short:'延一',color:'#4e7a69',power:65,students:816,teachers:94,exam:615,relation:55,motto:'作风稳健，近年在持续追赶。'},
    {id:'yuan',name:'原原一中',short:'原一',color:'#8b7650',power:59,students:720,teachers:88,exam:602,relation:50,motto:'扎根乡镇，拥有稳定的本地口碑。'},
    {id:'qiu',name:'秋秋一中',short:'秋一',color:'#1f5948',power:52,students:420,teachers:86,exam:586,relation:100,motto:'你的学校。底子尚可，百废待兴。'},
    {id:'jin',name:'金金高中',short:'金高',color:'#9b5250',power:49,students:576,teachers:72,exam:578,relation:20,motto:'同县宿敌，正大力争夺优质生源。'}
  ];

  const roleDefinitions = [
    {name:'副校长',tier:'校级领导',rank:3,authorityCost:8,focus:'统筹行政与跨部门协同',weights:[.05,.05,.42,.22,.08,.18],effects:{adminEfficiency:1.05,staffSatisfaction:.24}},
    {name:'教导处主任',tier:'职能处室',rank:2,authorityCost:5,focus:'课程质量与考试诊断',weights:[.32,.28,.18,.08,.1,.04],effects:{teaching:.72,academics:.5}},
    {name:'政教处主任',tier:'职能处室',rank:2,authorityCost:5,focus:'德育纪律与学生行为',weights:[.08,.05,.25,.3,.08,.24],effects:{studentDiscipline:.3,studentMindset:.22}},
    {name:'后勤处主任',tier:'职能处室',rank:2,authorityCost:5,focus:'生活保障与运营节支',weights:[.03,.04,.34,.2,.08,.31],effects:{expenseReduction:.5,studentSatisfaction:.26}},
    {name:'保卫处主任',tier:'职能处室',rank:2,authorityCost:5,focus:'门禁巡查与应急安全',weights:[.02,.02,.27,.12,.06,.51],effects:{safety:.95,authority:.12}},
    {name:'办公室主任',tier:'职能处室',rank:2,authorityCost:5,focus:'公文协调与外部形象',weights:[.03,.04,.37,.35,.06,.15],effects:{adminEfficiency:.56,prestige:.2}},
    {name:'高一年级主任甲',tier:'年级管理',grade:1,rank:1,authorityCost:3,focus:'初高中衔接与学习习惯',weights:[.25,.12,.25,.18,.08,.12],effects:{studentAcademic:.18,studentDiscipline:.11}},
    {name:'高一年级主任乙',tier:'年级管理',grade:1,rank:1,authorityCost:3,focus:'入学适应与学生关系',weights:[.12,.06,.25,.28,.1,.19],effects:{studentMindset:.24,studentSatisfaction:.16}},
    {name:'高二年级主任甲',tier:'年级管理',grade:2,rank:1,authorityCost:3,focus:'分科教学与质量提升',weights:[.25,.12,.25,.18,.08,.12],effects:{studentAcademic:.21,teaching:.14}},
    {name:'高二年级主任乙',tier:'年级管理',grade:2,rank:1,authorityCost:3,focus:'分科适应与班级纪律',weights:[.12,.06,.25,.28,.1,.19],effects:{studentDiscipline:.2,safety:.1}},
    {name:'高三年级主任甲',tier:'年级管理',grade:3,rank:1,authorityCost:3,focus:'高考备考与成绩诊断',weights:[.3,.18,.24,.12,.06,.1],effects:{studentAcademic:.29,academics:.18}},
    {name:'高三年级主任乙',tier:'年级管理',grade:3,rank:1,authorityCost:3,focus:'备考压力与教师协同',weights:[.16,.08,.25,.24,.08,.19],effects:{studentMindset:.23,teacherSatisfaction:.1}}
  ];
  const roles = roleDefinitions.map(r=>r.name);
  const facilities = [
    {id:'sports',name:'操场与篮球场',area:'北区',level:1,max:10,effect:'体能与学生心态',baseCost:68000,desc:'跑道、球场、照明与体育器材。',effects:{studentSatisfaction:.22,safety:.08}},
    {id:'dorm',name:'男女生宿舍',area:'生活区',level:1,max:10,effect:'住宿满意与稳定',baseCost:86000,desc:'床铺、卫浴、热水、空调与宿管系统。',effects:{studentSatisfaction:.28,safety:.08}},
    {id:'canteen',name:'食堂与营养中心',area:'生活区',level:1,max:10,effect:'营养、健康与满意度',baseCost:76000,desc:'后厨、餐位、消毒设备与营养餐标准。',effects:{studentSatisfaction:.3,safety:.1}},
    {id:'classroom',name:'三栋教学楼',area:'教学区',level:1,max:10,effect:'全学科课堂效率',baseCost:82000,desc:'门窗、照明、桌椅、空调和智慧黑板。',effects:{teaching:.25,studentAcademic:.0012}},
    {id:'lab',name:'实验楼',area:'教学区',level:1,max:10,effect:'物化生实验与竞赛',baseCost:105000,desc:'理化生实验室、危化品柜与探究器材。',effects:{teaching:.2,academics:.16}},
    {id:'library',name:'信息楼与图书馆',area:'教学区',level:1,max:10,effect:'自习、资料与信息化',baseCost:72000,desc:'图书、自习座位、机房和校本资源平台。',effects:{academics:.2,studentAcademic:.0008}},
    {id:'office',name:'办公楼',area:'行政区',level:1,max:10,effect:'行政与教师协作',baseCost:64000,desc:'办公室、会议室、档案与教研协作设备。',effects:{adminEfficiency:.2,staffSatisfaction:.12}},
    {id:'activity',name:'活动楼与花坛',area:'公共区',level:1,max:10,effect:'社团与校园文化',baseCost:58000,desc:'礼堂、社团教室、广播站与景观空间。',effects:{studentSatisfaction:.2,prestige:.12}},
    {id:'clinic',name:'医务室与卫生站',area:'保障区',level:1,max:10,effect:'卫生与应急保障',baseCost:52000,desc:'医务室、隔离观察、急救和日常消杀设施。',effects:{safety:.22,studentSatisfaction:.08}},
    {id:'security',name:'保安亭与校门',area:'保障区',level:1,max:10,effect:'门禁与校园安全',baseCost:60000,desc:'门禁、监控、消防、访客和应急广播。',effects:{safety:.3,adminEfficiency:.08}}
  ];

  const schoolPolicyDefinitions = [
    {id:'hair',group:'仪表管理',name:'发型规范',desc:'决定学校对学生发型的统一要求。越严格越便于快速检查，也越容易积累抵触。',options:[
      {id:'forced',name:'强制剃发',desc:'男生前不过眉、侧不遮耳，女生只允许短发。',effects:{stability:3,authority:2,studentDiscipline:.018,studentAnger:.16,studentSatisfaction:-.08}},
      {id:'limited',name:'有限剃发',desc:'男生不遮耳，女生可以留短辫，年级部定期检查。',effects:{stability:1,authority:1,studentDiscipline:.009,studentAnger:.02}},
      {id:'free',name:'不做要求',desc:'只要求整洁卫生，不限制具体发型。',effects:{stability:-1,studentMindset:.008,studentAnger:-.07,studentSatisfaction:.05}}
    ]},
    {id:'uniform',group:'仪表管理',name:'着装规范',desc:'校服政策影响身份认同、纪律检查和学生自主感。',options:[
      {id:'full',name:'要求全套校服',desc:'在校期间必须穿着整套校服，鞋袜颜色也纳入检查。',effects:{stability:2,safety:1,studentDiscipline:.014,studentAnger:.11,studentSatisfaction:-.05}},
      {id:'top',name:'只要求校服上衣',desc:'上衣统一，下装保持得体即可。',effects:{stability:1,studentDiscipline:.007,studentAnger:.01}},
      {id:'free',name:'不做要求',desc:'允许便装，只在大型活动统一着装。',effects:{stability:-1,studentMindset:.006,studentAnger:-.055,studentSatisfaction:.04}}
    ]},
    {id:'break',group:'学习秩序',name:'课间管理',desc:'决定课间走动、交流和提前进班的尺度。',options:[
      {id:'strict',name:'严格管制',desc:'除饮水和如厕外不得离开楼层，上课前五分钟必须入座。',effects:{stability:2,safety:1,studentDiscipline:.016,studentAnger:.12,studentMindset:-.006}},
      {id:'relaxed',name:'宽松管制',desc:'允许到操场和公共区活动，上课铃响前到班即可。',effects:{studentMindset:.012,studentAnger:-.055,studentSatisfaction:.04}}
    ]},
    {id:'phone',group:'学习秩序',name:'手机管理',desc:'县中最敏感的治理议题之一，直接影响自律、家校矛盾与学生情绪。',options:[
      {id:'ban',name:'一律禁带',desc:'发现即暂扣至学期末，并通知家长。',effects:{stability:2,authority:2,studentDiscipline:.02,studentAcademic:.006,studentAnger:.17,studentSatisfaction:-.08}},
      {id:'storage',name:'入校集中保管',desc:'班级手机袋集中保管，周末或请假时取回。',effects:{stability:2,studentDiscipline:.013,studentAcademic:.004,studentAnger:.03}},
      {id:'controlled',name:'限定时段使用',desc:'午休和周末开放，违规使用按班规处理。',effects:{stability:-1,studentMindset:.006,studentAnger:-.035,studentSatisfaction:.03}}
    ]},
    {id:'schedule',group:'作息与备考',name:'每日作息',desc:'决定早操、早读、晚自习与就寝时间，影响学业、体能和怒气恢复。',options:[
      {id:'extreme',name:'超长学习日',desc:'5:40 起床，22:40 下晚自习，压缩自由活动。',effects:{stability:1,studentAcademic:.012,studentAnger:.15,studentMindset:-.012,teacherSatisfaction:-.08}},
      {id:'balanced',name:'标准县中作息',desc:'6:10 起床，22:00 下晚自习，午休 50 分钟。',effects:{stability:1,studentAcademic:.006,studentAnger:.01}},
      {id:'health',name:'健康优先作息',desc:'6:40 起床，21:30 下晚自习，保证睡眠和运动。',effects:{stability:-1,studentAcademic:-.003,studentMindset:.014,studentAnger:-.09,studentSatisfaction:.05}}
    ]},
    {id:'weekend',group:'作息与备考',name:'周末安排',desc:'决定周末留校、补课与休息节奏。',options:[
      {id:'monthly',name:'四周休一天',desc:'连续学习四周后集中休息一天，以极高强度换取更多课时。',effects:{stability:1,studentAcademic:.013,studentAnger:.21,teacherSatisfaction:-.12}},
      {id:'single',name:'两周休一天',desc:'连续学习两周后集中休息一天。',effects:{studentAcademic:.009,studentAnger:.08,teacherSatisfaction:-.07}},
      {id:'county',name:'大小周',desc:'大周休一天，小周休半天，是县中常见方案。',effects:{stability:1,studentAcademic:.005,studentAnger:.02}},
      {id:'weekly',name:'每周休一天',desc:'每周完整休息一天，降低师生耗竭。',effects:{studentAcademic:-.002,studentMindset:.01,studentAnger:-.075,teacherSatisfaction:.06}}
    ]},
    {id:'homework',group:'教学制度',name:'作业制度',desc:'决定是否按学生层次分配作业与订正任务。',options:[
      {id:'uniform',name:'统一题海',desc:'全年级统一作业量和进度，检查最方便。',effects:{stability:1,studentAcademic:.008,studentAnger:.085,teacherSatisfaction:.03}},
      {id:'layered',name:'分层作业',desc:'基础、提高、拔尖三档，学生按诊断结果领取。',effects:{studentAcademic:.011,studentAnger:.006,teacherSatisfaction:-.035,adminEfficiency:-1}},
      {id:'choice',name:'基础必做＋自主选做',desc:'保留底线任务，把提高部分交给学生选择。',effects:{stability:-1,studentAcademic:.004,studentMindset:.006,studentAnger:-.045}}
    ]},
    {id:'exam',group:'教学制度',name:'考试频率',desc:'考试越密集，诊断反馈越快，但焦虑和教师阅卷负担也越高。',options:[
      {id:'weekly',name:'每周周测',desc:'每周统一命题、排名并张贴进退步名单。',effects:{stability:1,studentAcademic:.01,studentAnger:.12,studentMindset:-.009,teacherSatisfaction:-.09}},
      {id:'biweekly',name:'双周检测',desc:'每两周一次年级检测，兼顾反馈与恢复。',effects:{studentAcademic:.006,studentAnger:.012,teacherSatisfaction:-.025}},
      {id:'monthly',name:'每月统考',desc:'平时以课堂反馈为主，每月组织一次正式考试。',effects:{stability:-1,studentAcademic:.002,studentAnger:-.045,teacherSatisfaction:.035}}
    ]},
    {id:'evening',group:'教学制度',name:'晚自习模式',desc:'决定晚自习由谁组织以及是否允许答疑讨论。',options:[
      {id:'silent',name:'全程静默自习',desc:'值班教师巡查，禁止讨论与走动。',effects:{stability:2,studentDiscipline:.012,studentAnger:.07}},
      {id:'tutoring',name:'教师驻班答疑',desc:'前两节答疑、最后一节静默整理。',effects:{studentAcademic:.009,studentAnger:.006,teacherSatisfaction:-.075}},
      {id:'self',name:'班级自主安排',desc:'班委与课代表协调答疑和自习内容。',effects:{stability:-1,studentMindset:.008,studentAnger:-.04,studentSatisfaction:.03}}
    ]},
    {id:'discipline',group:'德育与生活',name:'违纪处置',desc:'影响规则威慑、申诉渠道和学生对公平的感受。',options:[
      {id:'punitive',name:'量化扣分',desc:'迟到、睡觉、讲话均扣分，月底与班主任绩效挂钩。',effects:{stability:3,authority:2,studentDiscipline:.018,studentAnger:.14,studentSatisfaction:-.07}},
      {id:'progressive',name:'分级处分',desc:'提醒、约谈、家校协同、处分逐级升级，保留申诉。',effects:{stability:2,authority:1,studentDiscipline:.011,studentAnger:.01}},
      {id:'restorative',name:'修复式教育',desc:'通过谈话、服务和同伴调解修复关系。',effects:{stability:-1,studentMindset:.01,studentAnger:-.065,studentSatisfaction:.045,teacherSatisfaction:-.025}}
    ]},
    {id:'dorm',group:'德育与生活',name:'宿舍管理',desc:'宿舍制度影响夜间安全、睡眠与学生自治。',options:[
      {id:'military',name:'军事化内务',desc:'被褥、物品、熄灯和就寝均按统一标准检查。',effects:{stability:2,safety:2,studentDiscipline:.012,studentAnger:.11}},
      {id:'graded',name:'分级宿舍制',desc:'以卫生、安全和作息积分评定星级宿舍。',effects:{stability:2,safety:1,studentDiscipline:.007,studentAnger:.008}},
      {id:'autonomy',name:'宿舍自治',desc:'宿舍长制定公约，宿管只处理安全底线。',effects:{stability:-1,safety:-1,studentMindset:.008,studentAnger:-.055,studentSatisfaction:.03}}
    ]}
  ];

  const actions = [
    {id:'teach',mark:'研',title:'集体教研周',desc:'组织跨年级磨课与试题分析，持续改善课堂与学业成长。',money:25000,ap:2,effects:{teaching:2,power:1,teacherGrowth:1,teacherSatisfaction:2,staffSatisfaction:1},policy:{days:21,studentAcademic:.018,teacherSatisfaction:.04}},
    {id:'materials',mark:'卷',title:'采购精品资料',desc:'引入分层题库与校本作业系统，提升效率但略增压力。',money:43000,ap:1,effects:{academics:2,power:1},policy:{days:30,studentAcademic:.022,studentMindset:-.008}},
    {id:'visit',mark:'访',title:'家校共育走访',desc:'入户走访，持续改善学生自律、心态与社会口碑。',money:10000,ap:2,effects:{morale:3,prestige:3,authority:1},policy:{days:21,studentDiscipline:.018,studentMindset:.02}},
    {id:'club',mark:'艺',title:'校园文化节',desc:'让分数之外的天赋被看见，改善心态与校园认同。',money:58000,ap:2,effects:{morale:6,prestige:5,staffSatisfaction:1},policy:{days:14,studentMindset:.045,studentSocial:.025}},
    {id:'recruit',mark:'才',title:'发布人才招聘',desc:'刷新一批可签约的教师与管理人才，需要预留签约金。',money:7000,ap:1,effects:{recruit:true}},
    {id:'sponsor',mark:'助',title:'拜访校友企业',desc:'争取社会资助，但结果受校长沟通能力和学校声望影响。',money:2500,ap:2,effects:{sponsor:true}},
    {id:'safety',mark:'安',title:'校园安全排查',desc:'检查校舍、食堂和门禁，稳定秩序并降低风险。',money:16000,ap:1,effects:{safety:6,staffSatisfaction:1},policy:{days:30,studentDiscipline:.012,studentMindset:.008}},
    {id:'public',mark:'宣',title:'开放日与招生宣讲',desc:'向全县展示课堂和社团，争夺下一届优质生源。',money:32000,ap:2,effects:{prestige:4,power:1,authority:1}},
    {id:'care',mark:'心',title:'学生心理关怀月',desc:'筛查压力风险并开展团辅，持续改善学生心态。',money:38000,ap:2,effects:{morale:7,teacherSatisfaction:1},policy:{days:30,studentMindset:.052,studentDiscipline:.006}},
    {id:'austerity',mark:'节',title:'开源节流',desc:'压缩全校奖金和非必要支出，立即降低工资，但会严重伤害队伍稳定与校长威信。',money:0,ap:2,effects:{austerity:true,staffSatisfaction:-8,teacherSatisfaction:-12,authority:-4,prestige:-1,teaching:-1}}
  ];

  const events = [];

  function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function makeName(rng){const sur=surnames[Math.floor(rng()*surnames.length)];const a=givenA[Math.floor(rng()*givenA.length)];return sur+a+(rng()>.34?givenB[Math.floor(rng()*givenB.length)]:'')}
  function bell(rng,min,max,center=.58){const v=(rng()+rng()+rng())/3;return Math.round(min+(max-min)*clamp(v*.72+center*.28,0,1))}
  function tierOf(score){if(score>=75)return'尖子生';if(score>=68)return'优等生';if(score>=60)return'中等生';return'差生'}

  function generateStaff(count=260,seed=260901){const rng=mulberry32(seed);const result=[];for(let i=0;i<count;i++){const stats=[bell(rng,38,96),bell(rng,38,96),bell(rng,35,94),bell(rng,36,95),bell(rng,34,92),bell(rng,38,96)];const overall=Math.round(stats.reduce((a,b)=>a+b,0)/6);const subject=subjects[Math.floor(rng()*subjects.length)];result.push({id:`T${String(i+1).padStart(4,'0')}`,name:makeName(rng),age:23+Math.floor(rng()*36),gender:rng()>.5?'女':'男',subject,years:Math.floor(rng()*32),education:rng()>.8?'硕士':'本科',stats,overall,stars:clamp(Math.ceil(overall/20),1,5),trait:staffTraits[Math.floor(rng()*staffTraits.length)],salary:Math.round((4300+overall*34+rng()*1300)/100)*100,signing:Math.round((15000+overall*850+rng()*25000)/1000)*1000,bio:`${subject}教师，重视${rng()>.5?'课堂结构与反馈':'学生差异与长期成长'}。在上一所学校承担过${rng()>.5?'备课组':'班主任'}工作。`,employed:false,role:null});}return result}
  function generateStudents(count=1200,seed=261001){const rng=mulberry32(seed);const result=[];for(let i=0;i<count;i++){const grade=1+Math.floor(i/400);const classNo=1+(i%6);const elite=classNo===5||classNo===6;const base=elite?70:([49,46,43,47][classNo-1]);const academic=clamp(bell(rng,base-18,elite?98:91,elite?.7:.53),25,99);const stats=[academic,bell(rng,30,96),bell(rng,28,96),bell(rng,30,97),bell(rng,34,98),bell(rng,28,96)];const composite=Math.round(stats[0]*.42+stats[1]*.14+stats[2]*.14+stats[3]*.1+stats[4]*.12+stats[5]*.08);const score=Math.round(320+academic*3.9+stats[1]*.55+stats[2]*.35+rng()*36);result.push({id:`S${String(i+1).padStart(5,'0')}`,name:makeName(rng),gender:rng()>.5?'女':'男',grade,classNo,className:`高${['','一','二','三'][grade]}（${classNo}）班`,track:classNo===4||classNo===6?'文科':'理科',elite,stats,composite,tier:tierOf(composite),trait:studentTraits[Math.floor(rng()*studentTraits.length)],score:clamp(score,300,735),bio:`来自秋丘县${rng()>.5?'城区':'乡镇'}，${studentTraits[Math.floor(rng()*studentTraits.length)]}。`});}return result}
  window.GAME_DATA={principalData,schools,roles,roleDefinitions,facilities,schoolPolicyDefinitions,actions,events,subjects,generateStaff,generateStudents,clamp,tierOf,mulberry32};
})();
