(function(){
  'use strict';
  const {events,followups}=window.CampusEventLibrary;
  // 每一行依次为编号、分类、标题、背景、两种处理方案及其数值效果。
  const rows=[
    ['rain_roof','校舍维修','雨季来临前的屋顶排查','后勤发现教学楼屋面排水不畅，雨季将至。','安排专业清理',{money:-7000,safety:1},'组织日常检查',{staffSatisfaction:-.5,safety:.3}],
    ['canteen_price','食堂民生','食堂菜价调整申请','食材价格上涨，食堂提出调整部分菜价。','学校补贴部分成本',{money:-8000,studentSatisfaction:1},'调整菜单并公开成本',{studentSatisfaction:-.5,authority:.5}],
    ['dorm_sleep','宿舍生活','宿舍熄灯后的争议','部分住校生反映熄灯后仍有噪声，宿管建议调整巡查。','安排宿管和值班教师巡查',{money:-4000,safety:1},'组织宿舍自治协商',{studentSatisfaction:.5,authority:.3}],
    ['parent_meeting','家校合作','家长会的时间安排','乡镇家长往返不便，班主任希望调整家长会形式。','安排分时段接待',{money:-3000,prestige:.7},'提供电话沟通时段',{teacherSatisfaction:-.3,studentSatisfaction:.5}],
    ['teacher_mentor','教师发展','青年教师结对申请','新入职教师希望有经验的老师提供课堂指导。','安排导师并提供教研支持',{money:-6000,teaching:.8},'安排组内互助',{teacherSatisfaction:.5,teaching:.3}],
    ['lab_safety','实验教学','实验室药品清点','实验教师发现部分药品临近有效期，需要分类处理。','委托合规处置并补充耗材',{money:-7000,safety:1},'暂停相关实验并重新盘点',{teaching:-.3,safety:.5}],
    ['bus_route','交通安全','校门口班车停靠问题','放学时段班车停靠影响通行，交警建议调整。','设置临时等候区',{money:-5000,safety:1},'调整放学疏导时段',{teacherSatisfaction:-.3,safety:.5}],
    ['student_club','学生活动','学生社团借用活动室','学生社团希望固定使用活动室开展训练。','添置基础器材',{money:-5000,studentSatisfaction:1},'安排轮流使用',{studentSatisfaction:.4,authority:.2}],
    ['exam_review','考试教务','月考后的试卷讲评','年级组建议统一分析薄弱知识点，但教师备课时间有限。','安排集中教研',{money:-4000,teaching:.7},'各备课组自行复盘',{teacherSatisfaction:-.3,academics:.4}],
    ['canteen_waste','食堂民生','食堂剩餐增加','食堂发现晚餐剩余较多，学生对菜品也有意见。','开展菜品调研',{money:-3000,studentSatisfaction:.8},'调整备餐数量',{money:2000,studentSatisfaction:-.3}],
    ['aid_visit','困难帮扶','班主任提出家访计划','班主任希望了解一名困难学生的返校和学习情况。','安排交通与家访',{money:-3000,studentSatisfaction:.8},'先与监护人电话沟通',{teacherSatisfaction:-.2,studentSatisfaction:.3}],
    ['internet_access','信息教学','机房网络频繁中断','信息课上网络不稳定，教师提出检查线路。','联系运营商检修',{money:-5000,teaching:.5},'调整为离线课程',{teaching:.2,staffSatisfaction:-.2}],
    ['morning_read','教学秩序','早读安排出现分歧','教师对早读领读和学生自主阅读的时间分配意见不同。','试行分段安排',{teaching:.4,studentSatisfaction:.4},'由各班自行安排',{authority:-.3,teacherSatisfaction:.5}],
    ['library_return','校园文化','图书归还率下降','图书角的借阅登记不完整，志愿者建议改进。','补充登记材料',{money:-2000,academics:.3},'组织志愿者清点',{studentSatisfaction:.3,staffSatisfaction:-.2}],
    ['school_doctor','校园卫生','医务室药品清点','医务室发现常用急救用品不足。','补充应急用品',{money:-4000,safety:.8},'优先调配库存',{safety:.3,staffSatisfaction:-.2}],
    ['toilet_repair','设施维护','教学楼洗手间维修','部分水龙头漏水，保洁人员反映影响日常使用。','安排维修',{money:-4000,safety:.5,staffSatisfaction:.5},'先关闭故障水龙头',{studentSatisfaction:-.4,safety:.3}],
    ['class_blackboard','设施维护','教室黑板反光','任课教师发现部分座位看不清黑板。','更换或处理板面',{money:-5000,teaching:.6},'调整座位和照明',{studentSatisfaction:.3}],
    ['teacher_leave','教师发展','教师临时请假','一位教师因家庭事务请假，课程需要协调。','安排代课支持',{money:-3000,teacherSatisfaction:.6},'由备课组内部调课',{teacherSatisfaction:-.3,teaching:.2}],
    ['homework_load','学生诉求','作业量反馈','学生反映几门课的作业集中在同一天。','协调各科布置时间',{studentSatisfaction:.8,teacherSatisfaction:-.3},'由班主任收集情况',{studentSatisfaction:.3}],
    ['canteen_queue','食堂民生','午餐排队时间过长','学生反映午休前排队较久。','增加临时窗口',{money:-5000,studentSatisfaction:.8},'实行年级错峰',{studentSatisfaction:.4,staffSatisfaction:-.3}],
    ['water_check','校园卫生','饮水设备例行检查','后勤计划检查饮水设备及滤芯。','更换老旧滤芯',{money:-4000,safety:.8},'先检查设备运行记录',{safety:.2,staffSatisfaction:-.2}],
    ['fire_drill','校园安全','消防疏散演练','保卫处建议组织一次疏散路线演练。','邀请专业人员指导',{money:-5000,safety:1},'由保卫处组织演练',{safety:.5,staffSatisfaction:-.2}],
    ['boarding_visit','家校合作','住校生周末留校安排','一些路途较远的学生周末留校，家长希望加强照看。','增加值班保障',{money:-5000,safety:.6,studentSatisfaction:.5},'公布值班联系方式',{authority:.3,staffSatisfaction:-.2}],
    ['teacher_books','教师发展','备课组申请教学资料','备课组提出购买一批参考资料。','采购共享资料',{money:-4000,teaching:.7},'整理现有资料共享',{teacherSatisfaction:.3,teaching:.2}],
    ['sports_equipment','体育活动','体育器材出现磨损','体育教师反映部分球类和跳绳需要补充。','采购常用器材',{money:-4000,studentSatisfaction:.7},'先修理现有器材',{studentSatisfaction:.3,staffSatisfaction:-.2}],
    ['campus_broadcast','校园文化','校园广播站征集节目','广播站希望在午间播出学生制作的节目。','组织教师指导',{teacherSatisfaction:-.2,studentSatisfaction:.6},'先安排试播',{studentSatisfaction:.3}],
    ['lost_property','学生事务','失物招领积压','学生会收集了不少无人认领的物品。','设立固定招领点',{money:-1000,studentSatisfaction:.4},'通过班主任发布清单',{authority:.3}],
    ['gate_register','校园安全','来访登记流程调整','门卫反映家长集中来访时登记容易拥堵。','补充登记设备',{money:-3000,safety:.6},'分时段预约登记',{safety:.3,staffSatisfaction:-.2}],
    ['counseling_hours','心理关怀','心理咨询预约增加','临近期末，心理教师的预约时间较紧。','增加咨询值班',{money:-5000,studentSatisfaction:.8},'安排班级团体辅导',{studentSatisfaction:.4,teacherSatisfaction:-.2}],
    ['art_show','校园文化','美术作品展示申请','美术组希望展示学生的乡土题材作品。','布置校内展览',{money:-3000,studentSatisfaction:.6,prestige:.4},'在班级展示',{studentSatisfaction:.3}],
    ['scholarship_rules','困难帮扶','助学金评审意见','班主任希望助学金评审标准更公开。','召开评审说明会',{authority:.6,teacherSatisfaction:-.2},'公布评审流程',{authority:.3,studentSatisfaction:.3}],
    ['reading_morning','阅读活动','晨读材料选择','语文组希望增加适合不同年级的阅读材料。','印制共享材料',{money:-3000,academics:.6},'利用现有藏书',{academics:.3}],
    ['staff_meal','教职工关怀','值班人员用餐安排','晚间值班的教职工反映就餐时间不便。','提供值班餐补',{money:-4000,staffSatisfaction:.8},'调整供餐时间',{staffSatisfaction:.4,studentSatisfaction:-.2}],
    ['garden_rain','校园环境','雨后操场积水','雨后操场一角积水，体育课受到影响。','清理排水沟',{money:-4000,safety:.6},'临时调整活动区域',{studentSatisfaction:-.2,safety:.3}],
    ['lesson_observation','教学交流','校内听课安排','教师希望听课反馈更具体，也担心占用备课时间。','安排小范围互听',{teaching:.5,teacherSatisfaction:.2},'共享课堂笔记',{teaching:.2}],
    ['volunteer_clean','校园环境','校园卫生志愿活动','学生会提出组织自愿参加的校园清洁活动。','提供工具与指导',{money:-2000,studentSatisfaction:.5},'开放志愿报名',{studentSatisfaction:.3,staffSatisfaction:-.1}],
    ['local_history','乡土课程','地方史课程邀请','县博物馆工作人员愿意来校介绍地方历史。','安排讲座',{money:-3000,academics:.4,prestige:.4},'共享馆藏资料',{academics:.2}],
    ['class_conflict','学生关系','班级座位调整争议','几位学生对座位安排有不同意见，班主任希望获得支持。','组织沟通协商',{studentSatisfaction:.5,authority:.2},'由班主任解释安排',{teacherSatisfaction:-.2,authority:.3}],
    ['power_inspection','设施维护','配电设施巡检','后勤建议在用电高峰前检查配电设备。','请专业人员检查',{money:-6000,safety:.9},'安排日常巡视',{safety:.3,staffSatisfaction:-.2}],
    ['exam_supplies','考试教务','考试用品清点','教务处发现备用答题卡和文具数量不足。','补充备用物资',{money:-3000,teaching:.4},'从各年级调剂',{staffSatisfaction:-.2,teaching:.2}]
  ];
  const labels={money:'资金',safety:'安全',studentSatisfaction:'学生满意',teacherSatisfaction:'教师满意',staffSatisfaction:'职工满意',teaching:'教学',academics:'学业',prestige:'声望',authority:'权威'};
  function hint(effect){return Object.entries(effect).map(([k,v])=>`${labels[k]} ${v>0?'+':''}${v}`).join('，')}
  const conditions={
    rain_roof:s=>s.stability<85,canteen_price:s=>s.studentSatisfaction<80,
    dorm_sleep:s=>s.studentSatisfaction<80,teacher_mentor:s=>s.teacherSatisfaction<85,
    lab_safety:s=>s.stability<85,exam_review:s=>s.examCount>0,
    teacher_leave:s=>s.teacherSatisfaction<75,homework_load:s=>s.studentSatisfaction<75,
    counseling_hours:s=>s.studentSatisfaction<75,staff_meal:s=>s.staffSatisfaction<75,
    scholarship_rules:s=>s.studentSatisfaction<80
  };
  rows.forEach(([id,tag,title,text,a,ae,b,be],i)=>events.push({id,tag,title,text,condition:conditions[id]||(()=>true),choices:[{text:a,hint:hint(ae)+(i<12?'；最早一周后跟进':''),effect:ae},{text:b,hint:hint(be)+(i<12?'；最早一周后跟进':''),effect:be}]}));
  // 同一事件的不同批示会进入各自的后续；旧存档仍使用原来的 source 键。
  const branches=[
    ['排水清理后的复查','屋顶排水恢复，后勤建议建立巡查记录。','屋面仍需观察','日常检查发现局部积水，后勤建议继续观察。'],
    ['食堂补贴后的反馈','学生代表反映价格较稳定，食堂提交了成本记录。','调整菜单后的反馈','部分学生认可公开成本，也希望菜单继续改进。'],
    ['夜间巡查反馈','宿舍秩序有所改善，值班人员建议定期回访。','宿舍协商反馈','宿舍代表讨论了作息约定，仍需持续沟通。'],
    ['分时接待结束','家长与教师完成分时沟通，班主任整理了意见。','电话家访反馈','教师汇总了电话交流中提出的问题。'],
    ['导师听课反馈','结对教师完成第一次听课，准备交流改进建议。','组内互助反馈','备课组分享了经验，希望保留交流时间。'],
    ['实验室处置回执','过期药品已处理，实验教师提交了清单。','实验室复盘','药品完成盘点，实验教师提出后续使用安排。'],
    ['候车区运行反馈','接送区域运行一周后，保卫处收到一些建议。','错峰疏导反馈','调整放学时段后，值班教师整理了交通情况。'],
    ['社团器材使用情况','社团开始使用新器材，学生建议制定保管规则。','活动室轮用反馈','社团按轮值表开展活动，仍需协调时间。'],
    ['集中教研形成建议','教师梳理了月考薄弱知识点，准备调整课堂。','分组复盘形成建议','备课组提交了各科讲评安排。'],
    ['菜品调研结果','学生反馈已经汇总，食堂准备优化下周菜单。','备餐调整结果','剩餐减少，食堂继续收集学生对饭菜的意见。'],
    ['家访后的沟通','班主任完成家访，准备继续关注学生返校情况。','电话沟通后的反馈','监护人说明了实际困难，班主任将持续联系。'],
    ['网络检修完成','线路完成检查，信息教师准备复测课堂网络。','离线课程试行反馈','教师完成离线课程，建议整理可复用资料。']
  ];
  branches.forEach((parts,i)=>{for(let n=0;n<2;n++){const root=rows[i][0];followups[root+':'+n]={id:root+'_follow_'+n,tag:'校务跟进',title:parts[n*2],text:parts[n*2+1],choices:[{text:'安排持续跟进',hint:'权威 +0.3，职工满意 +0.3',effect:{authority:.3,staffSatisfaction:.3}},{text:'记录意见并纳入日常工作',hint:'学生满意 +0.3',effect:{studentSatisfaction:.3}}]}}});
  const followChoices=[
    ['建立屋面巡查记录','纳入后勤日常检查',{safety:.3}],
    ['复核采购账目并公示','收集学生对菜品的意见',{studentSatisfaction:.3}],
    ['完善宿舍夜间巡查','请宿舍代表继续沟通',{studentSatisfaction:.3}],
    ['整理家长意见并交班主任','向家长说明后续沟通方式',{prestige:.3}],
    ['安排教师交流听课记录','由备课组共享教学经验',{teaching:.3}],
    ['检查药品清单和保管记录','安排实验教师复核',{safety:.3}],
    ['复核校门口疏导安排','收集班车与家长的反馈',{safety:.3}],
    ['明确活动室使用和保管规则','由社团代表协调时段',{studentSatisfaction:.3}],
    ['安排备课组交流讲评重点','由任课教师整理复盘资料',{academics:.3}],
    ['与食堂核对菜单和用量','继续收集学生用餐意见',{studentSatisfaction:.3}],
    ['请班主任持续联系监护人','保护隐私并记录帮扶需求',{studentSatisfaction:.3}],
    ['安排信息教师复核设备','整理课堂备用资料',{teaching:.3}]
  ];
  followChoices.forEach(([first,second,effect],i)=>{for(let n=0;n<2;n++){const ev=followups[rows[i][0]+':'+n];ev.choices=[{text:first,hint:'权威 +0.3，职工满意 +0.3',effect:{authority:.3,staffSatisfaction:.3}},{text:second,hint:hint(effect),effect}];}});
})();
