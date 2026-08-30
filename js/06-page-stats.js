/* ============================================================
 * 06-page-stats.js — 统计页
 * 三件事:
 *   rangeMeta   根据当前范围(日/周/月/年)算出:总数、日均、较上期、图表类型
 *   rangeStart  当前范围的起始日期(给"分布条"统计用)
 *   renderStats 把分段控件 + 摘要三卡 + 主图 + 分布条拼进 #scr-stats
 * 当前选中的范围存在全局变量 curRange(定义在 14-app.js)。
 * ============================================================ */

/* 各时间范围的元信息:label 显示名 / total 总次数 / len 天数 / prev 上一期总数 / cap 主图标题 */
function rangeMeta(){
  const wkM = weekMonday(today);
  switch(curRange){
    case 'day':  return {label:'今天', total:countDay(today), len:1,
      prev:rangeCount(dAgo(1), dAgo(1)), cap:'今日各念头觉察次数', chart:'day'};
    case 'week': {
      const len = Math.round((today-wkM)/DAY)+1;
      return {label:'本周', total:rangeCount(wkM, today), len,
        prev:rangeCount(new Date(wkM.getTime()-7*DAY), new Date(wkM.getTime()-8*DAY+len*DAY)),
        cap:'本周每天次数(今日高亮)', chart:'week'};
    }
    case 'month': {
      const days = lastNDays(30);
      return {label:'近30天', total:days.reduce((s,x)=>s+x.c,0), len:30,
        prev:rangeCount(dAgo(60), dAgo(31)), cap:'近 30 天趋势', chart:'month'};
    }
    case 'year': {
      const days = lastNDays(365);
      return {label:'近一年', total:days.reduce((s,x)=>s+x.c,0), len:365,
        prev:rangeCount(dAgo(730), dAgo(366)), cap:'过去 12 个月的觉察足迹', chart:'year'};
    }
  }
}

/* 当前范围的起始日(统计"都是什么念头"分布时用) */
function rangeStart(){
  switch(curRange){
    case 'day':   return today;
    case 'week':  return weekMonday(today);
    case 'month': return dAgo(29);
    case 'year':  return dAgo(364);
  }
}

function renderStats(){
  const el = document.getElementById('scr-stats');
  const m = rangeMeta();
  const avg = (m.total/m.len).toFixed(1);                        // 日均

  /* 较上期的变化:文案保持中性,只有方向箭头,不加好坏色(设计原则:只看见不评判) */
  let delta = '—';
  if(m.prev > 0){
    const p = Math.round((m.total-m.prev)/m.prev*100);
    delta = (p>0?'+':'') + p + '%';
  } else if(m.total > 0){
    delta = '新增';
  }

  /* 各念头在当前范围内的次数分布(红点:暂停的也计入,只要没归档) */
  const dist = thoughts.filter(t => !t.archived)
    .map(t => ({name:t.name, ci:t.ci, count:rangeCount(rangeStart(), today, t.id)}));

  /* --- 主图:四种范围各画一种 --- */
  let chart = '';
  if(m.chart === 'day'){
    /* 日:今日大数字 + 各念头分布条 */
    chart = `<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:16px">
        <span style="font-family:'Lora',Georgia,serif;font-size:44px;font-weight:600;color:var(--text)">${m.total}</span>
        <span style="font-size:13px;color:var(--muted)">次 · 今天</span></div>` + distBars(dist);
  } else if(m.chart === 'week'){
    /* 周:7 天条形图,今天的柱高亮 */
    const monday = weekMonday(today);
    const vals = [], labs = [], WK = ['一','二','三','四','五','六','日']; let hl = 0;
    for(let i=0; i<7; i++){
      const d = new Date(monday.getTime()+i*DAY);
      vals.push(d <= today ? countDay(d) : 0);                   // 未来的天补 0
      labs.push(WK[i]);
      if(key(d) === key(today)) hl = i;
    }
    chart = barChartSVG(vals, labs, hl);
  } else if(m.chart === 'month'){
    /* 月:30 天折线,每 7 天标一个日期 */
    const days = lastNDays(30);
    const labels = days.map((x, i) => (i%7===0 || i===29) ? `${x.d.getMonth()+1}/${x.d.getDate()}` : null);
    chart = lineChartSVG(days.map(x => x.c), labels);
  } else {
    /* 年:365 格日历热力图 + 色阶图例 */
    chart = heatSVG() + `<div class="legend">少
      <i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i>
      多 <span style="margin-left:auto">每格 = 一天 · 悬停看数值</span></div>`;
  }

  /* --- 整页拼装 --- */
  el.innerHTML = `
    <div class="h-date">统计</div>
    <div class="h-title">看见,是改变的开始</div>
    <div class="seg" role="tablist" aria-label="时间范围">
      ${['day','week','month','year'].map(r =>
        `<button role="tab" aria-selected="${r===curRange}" class="${r===curRange?'on':''}"
          data-action="range" data-range="${r}">${{day:'日',week:'周',month:'月',year:'年'}[r]}</button>`).join('')}
    </div>
    <div class="sumrow">
      <div class="sum"><div class="v">${m.total}</div><div class="k">${m.label}总次数</div></div>
      <div class="sum"><div class="v">${avg}</div><div class="k">日均(近${m.len===1?'1':m.len}天)</div></div>
      <div class="sum"><div class="v">${delta}</div><div class="k">较上期</div></div>
    </div>
    <div class="panel"><h4>${m.cap}</h4><div class="cap">${m.label} · 全部念头合计</div>${chart}</div>
    ${m.chart==='day' ? '' : `<div class="panel"><h4>都是什么念头</h4><div class="cap">${m.label}分布</div>${distBars(dist)}</div>`}
    <p class="calm-note">${ic('eye')}每一次记录,都是一次觉察。</p>`;
}
