/* ============================================================
 * 13-counter.js — 计数核心(整个 App 最重要的功能)
 * 流程:点卡片 → 存一条记录 → 播放动效 → 刷新数字 → 弹提示(可撤销)。
 * ============================================================ */

let lastAdded = null;    // 最近一次新增的记录,「撤销」时要把它删掉
let lastDeleted = null;  // 最近一次被删掉的单条记录,「撤销」时要把它放回来

/* 计一次。id:念头 id;x/y:点击坐标(给涟漪定位用,可缺省) */
function doCount(id, x, y){
  const th = thoughts.find(t => t.id === id);
  if(!th || th.paused) return;                     // 暂停中的念头不计数

  /* 1) 数据先行:把这次记录存进 records,并立刻自动保存到本机 */
  const rec = {t: id, ts: Date.now()};
  records.push(rec);
  lastAdded = rec;
  lastDeleted = null;                              // 新计数让"删记录"的撤销过期,避免串
  saveData();

  /* 2) 画面原地更新:涟漪 + 数字弹跳,不整页重渲染(整页重渲染会抹掉动画) */
  const card = document.querySelector(`.tcard[data-thought="${id}"]`);
  if(card){
    spawnRipple(card, x, y);
    const num = card.querySelector(`[data-cnt="${id}"]`);
    if(num){ num.textContent = countDay(today, id); popNumber(num); }
    const wk = card.querySelector(`[data-week="${id}"]`);          // "本周 N 次"也要跟着涨,否则和"今日"自相矛盾
    if(wk) wk.textContent = rangeCount(weekMonday(today), today, id);
    const tn = document.getElementById('todayNum');               // 顶部"今日觉察"总数
    if(tn) tn.innerHTML = `${countDay(today)}<small>次 · 今日觉察</small>`;
  }
  if(curScreen !== 'home') refreshAll();          // 理论上计数只发生在首页,兜底刷新其他页

  /* 3) 弹出提示,5 秒内可撤销(只有计数带撤销按钮) */
  showSnack(`已觉察 1 次 ·「${th.name}」`, true);
}

/* Snackbar 上的「撤销」按钮:计数撤销 = 删掉刚加的记录;
 * 删记录撤销 = 把刚删的记录放回来。两者共用这一个按钮。 */
document.getElementById('snackUndo').addEventListener('click', () => {
  if(lastAdded){
    const i = records.indexOf(lastAdded);
    if(i > -1) records.splice(i, 1);
    lastAdded = null;
    saveData();                                      // 撤销也是数据变化,同步写回本机
    hideSnack();
    refreshAll();
    if(curScreen !== 'home') showScreen('home');
  } else if(lastDeleted){
    records.push(lastDeleted);                       // 把删掉的记录原样放回
    lastDeleted = null;
    saveData();
    hideSnack();
    refreshAll();
  } else {
    hideSnack();
  }
});
