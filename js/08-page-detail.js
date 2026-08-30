/* ============================================================
 * 08-page-detail.js — 念头详情页
 * 只做一件事:把当前查看的念头(detailId,定义在 16-app.js)
 * 的全维度统计拼进 #scr-detail:
 * 返回栏(含改名铅笔) → 周条形图 → 年热力图 → 最近记录时间线
 * (每条可单独删) → 归档/恢复 → 删除。
 * ============================================================ */

function renderDetail(){
  const el = document.getElementById('scr-detail');
  const th = thoughts.find(t => t.id === detailId);
  if(!th) return;

  const total = records.filter(r => r.t === th.id).length;
  const days  = new Set(records.filter(r => r.t === th.id).map(r => key(new Date(r.ts)))).size;

  /* 本周 7 天的该念头次数(今天高亮) */
  const monday = weekMonday(today);
  const vals = [], labs = [], WK = ['一','二','三','四','五','六','日']; let hl = 0;
  for(let i=0; i<7; i++){
    const d = new Date(monday.getTime()+i*DAY);
    vals.push(d <= today ? countDay(d, th.id) : 0);
    labs.push(WK[i]);
    if(key(d) === key(today)) hl = i;
  }

  /* 最近 6 条记录,新的在前;每条带一个删除小钮(删了可撤销) */
  const recent = records.filter(r => r.t === th.id).sort((a,b) => b.ts - a.ts).slice(0, 6);
  const fmt = ts => {
    const d = new Date(ts);
    const t = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const diff = Math.round((dayStart(today) - dayStart(d)) / DAY);   // 距今天几天
    return diff===0 ? `今天 ${t}` : diff===1 ? `昨天 ${t}` : `${d.getMonth()+1}月${d.getDate()}日 ${t}`;
  };

  el.innerHTML = `
    <div class="navbar">
      <button class="backbtn" data-action="back" aria-label="返回">${ic('chevL',22)}</button>
      <span class="avatar" style="width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${colSoft(th.ci)};color:${colVar(th.ci)};font-weight:700">${th.name.slice(2,3)}</span>
      <div><div style="font-size:16.5px;font-weight:700;color:var(--text)">${th.name}</div>
      <div style="font-size:12px;color:var(--muted)">累计 ${total} 次 · ${days} 天有记录</div></div>
      <button class="editbtn" data-action="open-rename" aria-label="重命名">${ic('pencil',18)}</button>
    </div>
    <div class="panel"><h4>本周每天次数</h4><div class="cap">今天高亮</div>${barChartSVG(vals, labs, hl, colVar(th.ci))}</div>
    <div class="panel"><h4>过去 12 个月</h4><div class="cap">觉察足迹</div>${heatSVG(th.id)}
      <div class="legend">少<i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i>多</div></div>
    <div class="panel"><h4>最近觉察时刻</h4><div class="cap">点右侧 × 可删除单条</div>
    <ul class="timeline">${recent.map(r =>
      `<li><span class="d">${fmt(r.ts)}</span><span class="w">觉察一次</span>
        <button class="delrec" data-action="del-record" data-thought="${th.id}" data-ts="${r.ts}"
          aria-label="删除 ${fmt(r.ts)} 这条记录">${ic('x',14)}</button></li>`).join('')}</ul></div>
    ${th.archived
      ? `<button class="restorelink" data-action="unarchive" data-thought="${th.id}">恢复此念头(搬回念头列表)</button>`
      : `<button class="dangerlink" data-action="archive" data-thought="${th.id}">归档此念头(不再显示,数据保留)</button>`}
    <button class="dangerlink" data-action="delete-thought" data-thought="${th.id}">删除此念头(连同全部 ${total} 条记录)</button>`;
}
