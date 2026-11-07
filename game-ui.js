/* Presentation only: navigation, progressive disclosure and weekly guidance.
 * Game rules, costs, event settlement and saves remain owned by game.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => `¥ ${Math.round(n).toLocaleString('zh-CN')}`;
  const ui = { grade: '1', people: 'core', peoplePage: 0, rosterPage: 0, policy: null, policyOpen: null, action: '教学与成绩', finance: 'build' };
  let current, actions, lastPeopleSearch = '', lastRosterSearch = '';
  const paths = {
    overview:'M3 10l9-7 9 7v10H3zM9 20v-7h6v7',
    map:'M8 3h8v5a4 4 0 01-8 0zM8 5H4v2a4 4 0 004 4m8-6h4v2a4 4 0 01-4 4M12 12v6m-4 3h8m-6-3h4',
    people:'M16 21v-3a4 4 0 00-4-4H6a4 4 0 00-4 4v3m18 0v-3a4 4 0 00-3-4M9 10a4 4 0 100-8 4 4 0 000 8m7-7a4 4 0 010 7',
    students:'M3 4h7a3 3 0 013 3v14a4 4 0 00-4-2H3zm18 0h-5a3 3 0 00-3 3v14a4 4 0 014-2h4z',
    policies:'M5 3h14v18H5zM9 8h6m-6 4h6m-6 4h4',
    finance:'M3 7h18v13H3zM3 7l14-4v4m-1 5h5v4h-5z',
    actions:'M7 4h14v17H3V4h4m0-2v5m10-5v5M7 12l2 2 3-4m2 3h3'
  };
  function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`; }
  function tabs(id, choices, selected, change) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = choices.map(([key, text]) => `<button class="focus-tab ${String(key) === String(selected) ? 'active' : ''}" type="button" data-focus="${escape(key)}" aria-pressed="${String(key) === String(selected)}">${escape(text)}</button>`).join('');
    $$('button', el).forEach(b => b.addEventListener('click', () => change(b.dataset.focus)));
  }
  function pager(container, rows, page, change) {
    const size = 6, pages = Math.ceil(rows.length / size);
    page = Math.max(0, Math.min(page, pages - 1));
    rows.forEach((row, i) => row.hidden = i < page * size || i >= (page + 1) * size);
    container.hidden = pages <= 1;
    container.innerHTML = `<button class="btn btn-secondary" data-prev ${page === 0 ? 'disabled' : ''}>上一页</button><span>第 ${page + 1} / ${pages || 1} 页 · 共 ${rows.length} 人</span><button class="btn btn-secondary" data-next ${page + 1 >= pages ? 'disabled' : ''}>下一页</button>`;
    $('[data-prev]', container).onclick = () => change(page - 1);
    $('[data-next]', container).onclick = () => change(page + 1);
    return page;
  }
  function mount(api) {
    actions = api;
    $$('#main-nav [data-view]').forEach(b => {
      $('.nav-icon', b).innerHTML = icon(b.dataset.view);
      const labels={overview:['校园','校园'],map:['学校联赛','联赛'],people:['组织人事','人事'],students:['学生学业','学生'],policies:['学校政策','政策'],finance:['财务资产','财务'],actions:['校长行动','行动']},label=labels[b.dataset.view];b.lastElementChild.innerHTML=`<span class="nav-full">${label[0]}</span><span class="nav-short">${label[1]}</span>`;b.setAttribute('aria-label',label[0]);
    });
    $('#ui-brief-button').onclick = () => resume();
    $('#ui-help-button').onclick = () => $('#ui-help').showModal();
    $('#ui-mobile-help').onclick = () => $('#ui-help').showModal();
    $('#ui-help-close').onclick = () => $('#ui-help').close();
    $('#ui-archive').addEventListener('toggle', () => { if ($('#ui-archive').open) api.drawTrend(); });
    tabs('ui-finance-tabs', [['build','校园建设'],['budget','经费分配'],['ledger','收支账本']], ui.finance, value => { ui.finance = value; finance(); });
    // Keep focus inside foreground dialogs, including events above the gaokao screen.
    let previousFocus;
    const overlays = $$('.modal, .drawer, .gaokao-season');
    const visibleDialog = () => overlays.filter(el => !el.hidden).sort((a,b) => Number(getComputedStyle(b).zIndex) - Number(getComputedStyle(a).zIndex))[0];
    new MutationObserver(records => {
      for (const record of records) {
        const el = record.target;
        if (!overlays.includes(el)) continue;
        if (!el.hidden && el === visibleDialog()) {
          previousFocus = document.activeElement;
          const first = $('button:not(:disabled), input, select, [tabindex="0"]', el);
          first?.focus({preventScroll:true});
        } else if (el.hidden && !visibleDialog() && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
      }
    }).observe(document.body, {subtree:true, attributes:true, attributeFilter:['hidden']});
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || $('#ui-help').open) return;
      const dialog = visibleDialog();
      if (!dialog) return;
      const focusable = $$('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"], summary', dialog).filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (first && ((!dialog.contains(document.activeElement)) || (!e.shiftKey && document.activeElement === last) || (e.shiftKey && document.activeElement === first))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    });
    // Turn long dossiers into readable sections without removing any information.
    new MutationObserver(() => {
      const body = $('#drawer-body');
      $$('.student-ability-grid article p', body).forEach(p => {
        if (p.parentElement.tagName === 'DETAILS') return;
        const detail = document.createElement('details'); detail.className = 'ui-calculation';
        detail.innerHTML = '<summary>数值影响</summary>'; p.before(detail); detail.append(p);
      });
      const radar = $('.student-radar', body);
      if (radar && radar.parentElement.tagName !== 'DETAILS') {
        const detail = document.createElement('details'); detail.className = 'ui-calculation'; detail.innerHTML = '<summary>六维成长雷达图</summary>'; radar.before(detail); detail.append(radar);
      }
    }).observe($('#drawer-body'), {childList:true});
  }
  function resume() {
    if (!current) return;
    if (current.eventFeedback) actions.feedback();
    else if (current.weeklyBrief) actions.brief();
    else if (current.pendingCampusEvent) actions.event();
    else actions.view('actions');
  }
  function render(state, context) {
    if (!state) return;
    current = state;
    const exchangeNotice=state.exchangeRequests.some(x=>x.status==='accepted');$('#main-nav [data-view=map]').dataset.notice=String(exchangeNotice);

    const ranked = SchoolRules.ranking(state), rank = ranked.findIndex(s => s.id === 'qiu')+1;
    const rival = ranked[rank-2], gap = rival ? Math.max(0,state.league.points[rival.id]-state.league.points.qiu) : 0;
    $('#ui-week').textContent = `第 ${Math.floor((state.day-1)/7)+1} 周`;
    $('#ui-chapter').textContent = rank <= 3 ? '第三章 · 向地方强校迈进' : rank <= 5 ? '第二章 · 在全市站稳脚跟' : '第一章 · 从一所县中开始';
    $('#ui-goal-title').textContent = rival ? `下一站，超越${rival.short || rival.name}` : '守住全市第一的荣光';
    $('#ui-goal-copy').textContent = rival ? `全市第 ${rank} 名 · 距前一名还差 ${gap.toFixed(2)} 积分` : '教学、队伍与校园生活，都是守住领先的根基。';
    $('#ui-goal-progress').style.width = `${rival ? Math.min(100,state.league.points.qiu/Math.max(1,state.league.points[rival.id])*100) : 100}%`;
    $('#ui-goal-bar').setAttribute('aria-valuenow', String(Math.round(rival ? Math.min(100,state.league.points.qiu/Math.max(1,state.league.points[rival.id])*100) : 100)));
    $('#ui-ap-count').textContent = `${state.actionPoints} / ${state.maxActionPoints}`;
    $('#ui-ap-pips').innerHTML = Array.from({length:state.maxActionPoints}, (_,i) => `<i class="${i < state.actionPoints ? 'filled' : ''}"></i>`).join('');
    const remaining = state.weeklyBrief?.items.filter(x => !x.done).length || 0;
    $('#ui-brief-button').textContent = state.eventFeedback ? '查看批示结果 →' : remaining ? `处理工作简报 · ${remaining} 项 →` : state.pendingCampusEvent ? '处理校园来文 →' : '安排本周工作 →';
    $('#ui-week-note').textContent = remaining ? '校务等待你的批示，处理后即可继续推进。' : state.actionPoints ? '先花一点时间经营校园，再迎接新的一周。' : '行动点已用完。推进校历，周一恢复行动点。';
    $('#ui-priorities').innerHTML = context.advice.slice(0,3).map((item,i) => `<button class="quest-row" data-quest="${i}"><span class="quest-number">0${i+1}</span><span><b>${escape(item.title)}</b></span><span aria-hidden="true">↗</span></button>`).join('');
    $$('[data-quest]').forEach(b => b.onclick = () => {
      const item=context.advice[Number(b.dataset.quest)], id=item.id.replace('action-','');
      if(item.view==='actions')ui.action=['teach','materials'].includes(id)?'教学与成绩':['visit','club','care','safety'].includes(id)?'学生与校园':id==='austerity'?'财政管理':'人才与资源';
      actions.view(item.view);
    });
    $('#ui-people-note').textContent = `管理岗已任命 ${Object.keys(state.roles).length} / 12 · 待任人才 ${state.candidateIds.length} 人。先组建班子，再精调师资。`;
    $('#ui-student-note').textContent = `${state.students.length} 名学生的成长正在发生。先选年级，再走进班级安排教师、关心学生。`;
    const anger = state.students.reduce((sum,s) => sum+s.anger,0)/Math.max(1,state.students.length);
    $('#ui-policy-note').textContent = `当前平均愤怒 ${anger.toFixed(2)}。每次只调整一项制度，留出时间观察学生的反应。`;
    $('#ui-finance-note').textContent = `可用资金 ${money(state.money)}。先选校园区域，再决定升级；经费与账本可随时切换。`;
    $('#ui-action-note').textContent = `本周还可使用 ${state.actionPoints} 点行动力。选一个经营方向，把有限的时间花在最需要的地方。`;
    ['people','students','policies','finance','actions'].forEach(name => section(name,state));
    $$('#main-nav .nav-item').forEach(b => b.setAttribute('aria-current', b.classList.contains('active') ? 'page' : 'false'));
  }
  function people() {
    const active = $('.people-tabs .active')?.dataset.peopleTab;
    const search = ['#people-search','#people-subject','#people-min'].map(s => $(s).value).join('|') + active;
    if (search !== lastPeopleSearch) { ui.peoplePage = 0; lastPeopleSearch = search; }
    const management = active === 'management';
    $('#ui-people-focus').hidden = !management;
    $('#people-filters').hidden = management;
    if (management) {
      tabs('ui-people-focus', [['core','校级班子'],['department','职能处室'],['1','高一年级'],['2','高二年级'],['3','高三年级'],['all','全校组织']], ui.people, value => {ui.people=value;people();});
      const root = $('#people-content');
      $$('.principal-level,.vice-level',root).forEach(el => el.hidden = !['core','all'].includes(ui.people));
      $('.department-level',root).hidden = !['department','all'].includes(ui.people);
      $$('.grade-org',root).forEach((el,i) => el.hidden = !['all',String(i+1)].includes(ui.people));
      $('.grade-org-grid',root).hidden = ['core','department'].includes(ui.people);
      // Filters belong to the roster, never silently hide an empty appointment slot.
      $$('.role-card',root).forEach(row => row.hidden = false);
      $('#ui-people-pager').hidden = true;
    } else {
      const rows = $$('#people-content .person-row');
      rows.forEach(row => row.hidden = row.dataset.searchMatch === 'false');
      ui.peoplePage = pager($('#ui-people-pager'),rows.filter(row => !row.hidden),ui.peoplePage,value => {ui.peoplePage=value;people();});
    }
  }
  function students() {
    const classes = $('.student-tabs .active')?.dataset.studentTab === 'classes';
    $('#ui-grade-tabs').hidden = !classes;
    tabs('ui-grade-tabs', [['1','高一'],['2','高二'],['3','高三'],['all','全部']], ui.grade, value => {ui.grade=value;students();});
    $$('#class-grid [data-class]').forEach(card => card.hidden = ui.grade !== 'all' && card.dataset.class.split('-')[0] !== ui.grade);
    $$('#grade-summary .metric-card').slice(0,3).forEach((card,i)=>{
      card.setAttribute('role','button');card.setAttribute('aria-label',`查看高${['一','二','三'][i]}年级的班级`);card.setAttribute('aria-pressed',String(ui.grade===String(i+1)));card.classList.toggle('selected-grade',ui.grade===String(i+1));
      card.onclick=()=>{ui.grade=String(i+1);students();};card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}};
      if(!$('.grade-enter',card)){const label=document.createElement('span');label.className='grade-enter';label.textContent='' ;card.append(label);}
    });
    const search = ['#grade-filter','#tier-filter','#student-search'].map(s => $(s).value).join('|');
    if (search !== lastRosterSearch) { ui.rosterPage=0; lastRosterSearch=search; }
    $('#grade-summary').hidden = !classes;
    const rows = $$('#student-table [data-student]');
    ui.rosterPage = pager($('#ui-roster-pager'),rows,ui.rosterPage,value => {ui.rosterPage=value;students();});
    $('#ui-roster-pager').hidden ||= classes;
    $('#table-note').textContent = `筛选到 ${rows.length} / ${current.students.length} 名学生`;
  }
  function policies() {
    const groups = $$('#policy-groups .policy-group');
    const names = groups.map(g => $('h3',g).textContent);
    if (!names.includes(ui.policy)) ui.policy = names[0];
    tabs('ui-policy-tabs',names.map(name=>[name,name]),ui.policy,value=>{ui.policy=value;policies();});
    groups.forEach(group => {
      group.hidden = $('h3',group).textContent !== ui.policy;
      $$('.policy-card',group).forEach(card => {
        if ($('details',card)) return;
        const details = document.createElement('details'), summary = document.createElement('summary');
        details.className='policy-disclosure';
        const policyId=$('[data-policy]',card)?.dataset.policy;
        details.open=ui.policyOpen===policyId;
        summary.append($('.policy-card-head',card)); details.append(summary, $('.policy-options',card)); card.append(details);
        details.addEventListener('toggle',()=>{if(!details.isConnected)return;if(details.open){ui.policyOpen=policyId;$$('.policy-disclosure',group).filter(d=>d!==details).forEach(d=>d.open=false);}else if(ui.policyOpen===policyId)ui.policyOpen=null;});
      });
    });
    const formula = $('#policy-summary .stability-formula');
    if(formula && formula.parentElement.tagName !== 'DETAILS') {
      const details=document.createElement('details');details.className='ui-calculation stability-details';details.innerHTML='<summary>查看稳定度构成</summary>';formula.before(details);details.append(formula);
    }
  }
  function finance() {
    tabs('ui-finance-tabs', [['build','校园建设'],['budget','经费分配'],['ledger','收支账本']], ui.finance, value => { ui.finance=value;finance(); });
    const root = $('.campus-finance-layout');root.dataset.focus=ui.finance;
    $('.campus-plan-card').hidden = ui.finance !== 'build';$('#facility-detail').hidden = ui.finance !== 'build';
    $('.budget-allocation-card').hidden = ui.finance !== 'budget';$('.ledger-card').hidden = ui.finance !== 'ledger';
    const container=$('.facility-actions'), destructive=container && $$('.btn',container).slice(1);
    if(container && destructive.length && !$('.facility-risk-options',container)) {
      const detail=document.createElement('details');detail.className='facility-risk-options';detail.innerHTML='<summary>降标与变卖方案</summary>';container.append(detail);destructive.forEach(b=>detail.append(b));
    }
  }
  function actionPage() {
    const grid=$('#action-grid'), headings=$$('.action-group-title',grid), names=headings.map(h=>h.textContent);
    if(!names.includes(ui.action))ui.action=names[0];
    tabs('ui-action-tabs', names.map(name=>[name,name]),ui.action,value=>{ui.action=value;actionPage();});
    let group='';[...grid.children].forEach(el=>{if(el.classList.contains('action-group-title'))group=el.textContent;el.hidden=group!==ui.action;});
  }
  function section(name,state) {
    if(state)current=state;
    if(!current||!actions)return;
    if(name==='people')people();if(name==='students')students();if(name==='policies')policies();if(name==='finance')finance();if(name==='actions')actionPage();
  }
  function focusAction(id) {
    const button = $(`#action-grid [data-action="${id}"]`);
    const card = button?.closest('.action-card');
    if (!card) return;
    let heading = card.previousElementSibling;
    while (heading && !heading.classList.contains('action-group-title')) heading = heading.previousElementSibling;
    if (heading) ui.action = heading.textContent;
    actionPage();
    card.scrollIntoView({block:'nearest'});
    if (!button.disabled) button.focus({preventScroll:true});
  }
  window.CampusUI = {mount,render,section,focusAction};
})();
