/* ============================================================
 * 05-page-home.js — 记录页(首页)
 * 只做一件事:把首页的 HTML 拼出来,塞进 #scr-home。
 * 内容:日期标题 → 今日总览条 → 念头卡片列表(或空状态)。
 * 注意:curScreen / appState 等全局状态定义在 14-app.js。
 * ============================================================ */

function renderHome(){
  const el = document.getElementById('scr-home');
  const list = actives();                       // 启用中的念头
  const tTotal = countDay(today);               // 今天全部念头合计次数

  /* --- 顶部:日期 + 主文案 + 今日总览 --- */
  let html = `
    <div class="h-date">${today.getMonth()+1}月${today.getDate()}日 · ${'周'+'日一二三四五六'[today.getDay()]}</div>
    <div class="h-title">此刻,浮起了什么念头<span class="dot">?</span></div>
    <div class="today-bar">
      <div><span class="num" id="todayNum">${tTotal}<small>次 · 今日觉察</small></span></div>
      <span class="chip">${ic('flame')} 连续 ${streak()} 天</span>
    </div>`;

  /* --- 主体:有念头 → 卡片列表;没有 → 空状态引导 --- */
  if(!list.length){
    html += `<div class="empty">
      <div class="cloudwrap">${ic('cloud')}</div>
      <h3>写下一个你想放下的念头</h3>
      <p>比如:不要想过去的事、不要抱怨。<br>当它再次浮现时,回到这里轻轻点一下。</p>
      <button class="btn" data-action="open-sheet">${ic('plus')} 添加第一个念头</button>
    </div>`;
  } else {
    list.forEach(th => {
      const c  = countDay(today, th.id);                       // 该念头今天几次
      const wk = rangeCount(weekMonday(today), today, th.id);  // 该念头本周几次
      html += `
      <div class="tcard" data-action="count" data-thought="${th.id}" role="button" aria-label="记录一次:${th.name}" tabindex="0">
        <span class="avatar" style="background:${colSoft(th.ci)};color:${colVar(th.ci)}">${th.name.slice(2,3)}</span>
        <div class="mid">
          <div class="name">${th.name}</div>
          <div class="meta" style="white-space:nowrap">今日 <b data-cnt="${th.id}" style="color:var(--text)">${c}</b> 次 · 本周 <b data-week="${th.id}" style="color:var(--text)">${wk}</b> 次</div>
          <div style="height:20px; margin-top:5px">${sparkSVG(th.id, colVar(th.ci))}</div>
        </div>
        <span class="plus">${ic('plus',22)}</span>
      </div>`;
    });
    html += `<p class="calm-note">${ic('eye')}点一下卡片,就是一次觉察 · 点错了可撤销</p>`;
  }

  el.innerHTML = html;
}
