(function(){
  'use strict';

  const endpoint = 'https://xz-game-gaokao-board.wzy20060712.chatgpt.site/api/leaderboard';
  const $ = selector=>document.querySelector(selector);
  const inFlight = new Map();
  let latestView = 0;

  function nickname(value){
    const clean = value.trim().normalize('NFC');
    return clean && [...clean].length<=16 && !/[\p{Cc}\p{Cf}]/u.test(clean) ? clean : '';
  }

  function createEntry(name){
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), byte=>byte.toString(16).padStart(2,'0')).join('');
    return {nickname:name,token,best:null,synced:null};
  }

  function record(entry,score){
    if (!entry||!Number.isFinite(score)||score<0||score>750) return;
    entry.best = entry.best===null ? score : Math.max(entry.best,score);
  }

  async function request(options){
    const response = await fetch(endpoint,{...options,credentials:'omit',signal:AbortSignal.timeout(7000)});
    if (!response.ok) throw new Error('Leaderboard request failed');
    return response.json();
  }

  async function sync(entry,save){
    if (!entry||entry.best===null||(entry.synced!==null&&entry.synced>=entry.best)) return true;
    if (inFlight.has(entry.token)) return inFlight.get(entry.token);
    const score = entry.best;
    const send = request({
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nickname:entry.nickname,token:entry.token,score})
    }).then(result=>{
      if (!Number.isFinite(result.score)||result.score<score||result.score>750) return false;
      entry.synced = result.score;
      save();
      return true;
    }).catch(()=>false).finally(()=>inFlight.delete(entry.token));
    inFlight.set(entry.token,send);
    return send;
  }

  async function show(entry,upload){
    const requestId = ++latestView;
    const dialog = $('#leaderboard-dialog');
    if (!dialog.open) dialog.showModal();
    const status = $('#leaderboard-status');
    const list = $('#leaderboard-rows');
    const personal = $('#leaderboard-personal');
    const refresh = $('#leaderboard-refresh');
    refresh.disabled = true;
    list.replaceChildren();
    personal.textContent = '';
    status.textContent = '正在读取排行榜…';
    try {
      await upload();
      if (requestId!==latestView||!dialog.open) return;
      if (entry?.best!=null) {
        const pending = entry.synced===null||entry.synced<entry.best;
        personal.textContent = `本任期 · ${entry.nickname} · ${entry.best.toFixed(2)} 分${pending?'（待同步）':''}`;
      } else if (entry) personal.textContent = `本任期以「${entry.nickname}」参榜，高考放榜后上榜。`;
      const {rows} = await request({cache:'no-store'});
      if (requestId!==latestView||!dialog.open) return;
      status.textContent = rows.length ? '' : '还没有参榜成绩。完成一次高考后即可上榜。';
      rows.forEach((row,i)=>{
        const li = document.createElement('li');
        const rank = document.createElement('span');
        const name = document.createElement('b');
        const score = document.createElement('strong');
        rank.textContent = String(i+1);
        name.textContent = row.nickname;
        score.textContent = Number(row.score).toFixed(2);
        li.append(rank,name,score);
        list.append(li);
      });
    } catch {
      if (requestId===latestView&&dialog.open) status.textContent = '排行榜暂时无法读取，可点刷新重试。';
    } finally {
      if (requestId===latestView) refresh.disabled = false;
    }
  }

  window.GaokaoLeaderboard = {nickname,createEntry,record,sync,show};
})();
