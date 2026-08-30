/* ============================================================
 * 04-charts.js — SVG 图表
 * 管:把一串数字画成图。全部是手拼的 SVG 字符串,不依赖任何图表库。
 *   sparkSVG     卡片里的 7 日迷你走势线
 *   barChartSVG  周条形图(可高亮"今天",可指定念头专属色)
 *   lineChartSVG 月折线图(带 20% 透明面积)
 *   heatSVG      年日历热力图(365 格,5 档紫色阶)
 *   distBars     「都是什么念头」横向分布条
 * ============================================================ */

/* --- 迷你走势:念头卡片右下角那条小折线 --- */
function sparkSVG(tid, color){
  const v = lastNDays(7).map(x => countDay(x.d, tid));          // 最近 7 天该念头的次数
  const max = Math.max(...v, 1), w = 64, h = 22, step = w / 6;  // 7 个点均分宽度
  const pts = v.map((c, i) => `${(i*step).toFixed(1)},${(h-3-(c/max)*(h-6)).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>`;
}

/* --- 周条形图:7 根柱,hlIdx 是要高亮的下标(今天),color 可传念头专属色 --- */
function barChartSVG(values, labels, hlIdx, color){
  const W=318, H=168, padT=20, padB=24, bw=Math.floor(W/7)-12;  // 画布尺寸与柱宽
  const max = Math.max(...values, 4);
  let bars = '';
  values.forEach((c, i) => {
    const bh = Math.max(c/max*(H-padT-padB), c>0?5:2);          // 柱高;0 次也给 2px 的小点
    const x = i*(W/7)+6, y = H-padB-bh;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="7"
      fill="${color||'var(--primary)'}" opacity="${i===hlIdx?1:.28}"></rect>
      <text x="${x+bw/2}" y="${y-6}" text-anchor="middle" font-size="11" font-weight="${i===hlIdx?700:500}"
        fill="${i===hlIdx?'var(--text)':'var(--muted)'}">${c}</text>
      <text x="${x+bw/2}" y="${H-7}" text-anchor="middle" font-size="10.5"
        fill="var(--muted)">${labels[i]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="每日次数条形图">${bars}</svg>`;
}

/* --- 月折线图:30 天走势 + 半透明面积 + 首尾点标注 --- */
function lineChartSVG(values, dateLabels){
  const W=318, H=172, padT=22, padB=26, max=Math.max(...values, 4);
  const step = W/(values.length-1);
  const pt = i => [i*step, H-padB-(values[i]/max)*(H-padT-padB)]; // 第 i 个数据点的坐标
  let line = '';
  values.forEach((c, i) => {
    const [x, y] = pt(i);
    line += (i ? ` L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`);
  });
  const area = line + ` L${W},${H-padB} L0,${H-padB} Z`;          // 折线 + 底边围成面积
  const [ex, ey] = pt(values.length-1), [sx] = pt(0);
  let grid = '';                                                  // 两条虚线网格,弱化存在感
  [0.33, 0.66].forEach(f => {
    const y = padT + (H-padT-padB)*f;
    grid += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 4"/>`;
  });
  let xl = '';                                                    // x 轴日期标签(只在指定的位置画)
  dateLabels.forEach((lb, i) => {
    if(!lb) return;
    xl += `<text x="${i*step}" y="${H-7}" text-anchor="${i===0?'start':(i===values.length-1?'end':'middle')}" font-size="10.5" fill="var(--muted)">${lb}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="每日次数折线图">
    ${grid}<path d="${area}" fill="var(--primary)" opacity=".16"/>
    <path d="${line}" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${sx}" cy="${pt(0)[1]}" r="3" fill="var(--primary)" opacity=".55"/>
    <circle cx="${ex}" cy="${ey}" r="4" fill="var(--primary)" stroke="var(--card)" stroke-width="2"/>
    <text x="${Math.min(ex-8, W-4)}" y="${Math.max(ey-10, 12)}" text-anchor="end" font-size="11.5" font-weight="700" fill="var(--text)">${values[values.length-1]}</text>
    ${xl}</svg>`;
}

/* --- 年热力图:GitHub 贡献图同款,53 周 × 7 行,颜色越深当天记的次数越多 --- */
function heatSVG(tid){
  const start = weekMonday(dAgo(364));                            // 从 364 天前所在周的周一开始
  const cw=6, ch=6, W=53*cw, H=16+7*ch;
  let cells = '', lastM = -1, lastLx = -99, months = '';
  for(let wk=0; wk<53; wk++){                                     // 一列 = 一周
    for(let dw=0; dw<7; dw++){                                    // 一格 = 一天
      const d = new Date(start.getTime()+(wk*7+dw)*DAY);
      if(d > today) continue;                                     // 未来的日子不画
      if(dw===0 && d.getMonth()!==lastM){                         // 每月初在图上方标月份
        lastM = d.getMonth();
        const lx = wk*cw;
        if(lx-lastLx >= 32 && lx < W-26){ lastLx = lx;
          months += `<text x="${lx}" y="10" font-size="9" fill="var(--muted)">${d.getMonth()+1}月</text>`; }
      }
      const c = countDay(d, tid);
      const lv = c===0?0 : c<=2?1 : c<=5?2 : c<=8?3 : 4;          // 次数 → 5 档色阶
      cells += `<rect x="${wk*cw}" y="${16+dw*ch}" width="5" height="5" rx="1.5" fill="var(--heat${lv})"><title>${d.getMonth()+1}月${d.getDate()}日 · ${c} 次</title></rect>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="一年每日次数热力图">${months}${cells}</svg>`;
}

/* --- 分布条:「都是什么念头」每条约一行的横向进度条 ---
 * counts 形如 [{name: 名称, count: 次数, ci: 颜色编号}] */
function distBars(counts){
  const max = Math.max(...counts.map(c => c.count), 1);
  return counts.map(c => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="flex:none;width:96px;font-size:12.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:text-ellipsis">${c.name}</span>
      <span style="flex:1;height:10px;border-radius:6px;background:var(--heat0);overflow:hidden">
        <span style="display:block;height:100%;width:${(c.count/max*100).toFixed(1)}%;border-radius:6px;background:${colVar(c.ci)}"></span>
      </span>
      <span style="flex:none;width:30px;text-align:right;font-size:12.5px;font-weight:600;color:var(--muted)">${c.count}</span>
    </div>`).join('');
}
