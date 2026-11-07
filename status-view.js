/* Player-facing ratings derived from the current save. */
(function () {
  'use strict';

  const schoolMetrics = [
    ['stability', '稳定度', 'actions', 'safety', '检查校舍、食堂和门禁，优先改善校园秩序。'],
    ['power', '综合实力', 'actions', 'teach', '集体教研可以提升教学质量和学校实力。'],
    ['teaching', '教学质量', 'actions', 'teach', '安排集体教研，改善课堂效率和日常学业成长。'],
    ['academics', '学业积累', 'actions', 'materials', '采购资料可以改善学业成长，留意同时带来的压力。'],
    ['staffSatisfaction', '职工满意', 'actions', 'safety', '安全排查也能改善职工满意。'],
    ['teacherSatisfaction', '教师满意', 'actions', 'teach', '安排集体教研，为教师提供教学支持。'],
    ['studentSatisfaction', '学生满意', 'actions', 'visit', '从家校走访入手，改善学生满意和心态。'],
    ['authority', '校长权威', 'actions', 'visit', '完成家校走访可以积累权威。'],
    ['adminEfficiency', '行政效率', 'people', null, '检查管理岗位空缺与人岗匹配，改善整个班子的工作效率。'],
    ['schoolMorale', '全校士气', 'map', null, '到学校联赛挑选实力接近的对手。校际联考胜利会提振士气。'],
    ['prestige', '学校声望', 'actions', 'public', '通过开放日和招生宣讲提高学校声望。'],
    ['studentAnger', '学生愤怒', 'students', null, '先查看状态承压的学生，考虑谈心。宿舍和食堂升到新档也能降低全校愤怒。']
  ];

  function school(state, averageAnger) {
    const metrics = schoolMetrics.map(([key, label, view, action, advice]) => {
      const anger = key === 'studentAnger';
      const value = anger ? averageAnger : state[key];
      const level = anger ? (value >= 45 ? 'low' : value >= 30 ? 'watch' : 'good')
        : (value < 50 ? 'low' : value < 70 ? 'watch' : 'good');
      const status = anger ? {low: '偏高', watch: '升高', good: '平稳'}[level]
        : {low: '偏低', watch: '可提升', good: '良好'}[level];
      const gap = anger ? Math.max(0, value - 29.99) : Math.max(0, 70 - value);
      return {key, label, value, level, status, gap, view, action, advice, anger};
    });
    // Address weak indicators first, then compare distance from the suggested target.
    const priority = metrics.filter(metric => metric.level !== 'good').sort((a, b) =>
      Number(b.level === 'low') - Number(a.level === 'low') || b.gap - a.gap
    )[0];
    return {metrics, priority};
  }

  function rating(value) {
    if (value >= 85) return {letter: 'S', label: '领先', style: 'top'};
    if (value >= 75) return {letter: 'A', label: '优秀', style: 'high'};
    if (value >= 60) return {letter: 'B', label: '扎实', style: 'steady'};
    if (value >= 45) return {letter: 'C', label: '发展中', style: 'growing'};
    return {letter: 'D', label: '需打基础', style: 'foundation'};
  }

  function student(s) {
    const [academic, discipline, mindset, potential] = s.stats;
    const stress = s.anger >= 45 || mindset < 50;
    let form = {label: '状态平稳', level: 'neutral', order: 0};
    if (s.anger > 70) form = {label: '白卷风险', level: 'low', order: 3};
    else if (stress) form = {label: '状态承压', level: 'watch', order: 2};
    else if (mindset >= 70 && s.anger < 30) form = {label: '状态在线', level: 'good', order: 0};

    let focus = {action: null, title: '保持学习节奏', reason: '当前状态和习惯稳定。观察日常成长，再决定是否投入个别辅导。'};
    if (stress) {
      focus = {action: 'talk', title: '先谈心减压', reason: s.anger >= 45
        ? '压力已经影响成长和临场发挥。谈心能提高心态并降低愤怒。'
        : '心态偏弱。谈心可以改善临场发挥，帮助学生回到学习节奏。'};
    } else if (discipline < 55) {
      focus = {action: 'parent', title: '先改善学习习惯', reason: '自律偏低。家校沟通能直接改善学习习惯，同时缓解一点压力。'};
    } else if (academic < 60 || (academic < 75 && potential >= academic + 8)) {
      focus = {action: 'scholarship', title: '支持学业成长', reason: '基础还有提升空间。成长奖学金能直接提升学业与自律。'};
    }
    return {rating: rating(academic), form, focus};
  }

  function meter(value, label, dangerFrom, goodFrom, reversed=false) {
    const bands = dangerFrom !== undefined
      ? `--band-start:${dangerFrom}%;--band-end:${goodFrom}%`
      : '--band-start:50%;--band-end:70%';
    return `<span class="status-meter ${reversed?' reversed':''}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}" style="--position:${Math.max(1, Math.min(99, value))}%;${bands}"><i></i></span>`;
  }

  window.StatusView = {school, student, rating, meter};
})();
