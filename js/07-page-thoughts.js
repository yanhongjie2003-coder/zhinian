/* ============================================================
 * 07-page-thoughts.js — 念头管理页 + 归档列表页
 * 管:两个页面
 *   renderThoughts 念头页:未归档的念头列表(暂停开关)
 *                  + 页头右上角的归档入口(带数量角标)
 *   renderArchive  归档页:已归档念头列表,点圆钮恢复
 * 点行进详情、点开关暂停,事件在 16-app.js。
 * ============================================================ */

function renderThoughts(){
  const el = document.getElementById('scr-thoughts');
  const n = thoughts.filter(t => t.archived).length;      // 归档数量,给页头角标

  /* 页头:标题 + 归档入口(次级样式)。添加念头在右下角悬浮钮,页头不再重复放 */
  let html = `
    <div class="pagehead"><span class="t">我的念头</span>
      <button class="iconbtn ghost" data-action="open-archive" aria-label="查看归档">${ic('archive',20)}
        <span class="mini-badge">${n || ''}</span></button>
    </div>`;

  /* 每条念头一行;暂停中的行整体变淡(.paused);已归档的不出现在这里 */
  thoughts.filter(th => !th.archived).forEach(th => {
    const total = records.filter(r => r.t === th.id).length;                        // 累计次数
    const days  = new Set(records.filter(r => r.t === th.id).map(r => key(new Date(r.ts)))).size; // 有记录的天数
    html += `
    <div class="trow ${th.paused?'paused':''}" data-action="open-detail" data-thought="${th.id}"
      role="button" tabindex="0" aria-label="打开 ${th.name} 详情">
      <span class="avatar" style="background:${colSoft(th.ci)};color:${colVar(th.ci)}">${th.name.slice(2,3)}</span>
      <div class="mid"><div class="name">${th.name}</div>
        <div class="meta">累计 ${total} 次 · ${days} 天有记录</div></div>
      <label class="switch" title="${th.paused?'恢复记录':'暂停记录'}">
        <input type="checkbox" data-action="pause" data-thought="${th.id}" ${th.paused?'':'checked'}
          aria-label="${th.paused?'恢复':'暂停'} ${th.name}">
        <span class="knob"></span>
      </label>
      <span style="color:var(--faint)">${ic('chevR',20)}</span>
    </div>`;
  });

  html += `<p class="calm-note" style="margin-top:8px">关开关即「暂停」,数据保留 · 右上角 ↗ 看归档</p>`;
  el.innerHTML = html;
}

/* ---------- 归档列表页(从念头页右上角圆钮进入) ---------- */
function renderArchive(){
  const el = document.getElementById('scr-archive');
  const list = thoughts.filter(t => t.archived);

  let html = `
    <div class="navbar">
      <button class="backbtn" data-action="back-thoughts" aria-label="返回">${ic('chevL',22)}</button>
      <div><div style="font-size:16.5px;font-weight:700;color:var(--text)">归档</div>
      <div style="font-size:12px;color:var(--muted)">${list.length} 条念头 · 数据都还在</div></div>
    </div>`;

  if(!list.length){
    html += `<div class="empty">
      <div class="cloudwrap">${ic('archive')}</div>
      <h3>还没有归档的念头</h3>
      <p>在念头详情页点「归档此念头」,<br>它就会搬到这里,记录一直保留。</p>
    </div>`;
  } else {
    list.forEach(th => {
      const total = records.filter(r => r.t === th.id).length;
      html += `
      <div class="trow" data-action="open-detail" data-thought="${th.id}"
        role="button" tabindex="0" aria-label="打开 ${th.name} 详情">
        <span class="avatar" style="background:${colSoft(th.ci)};color:${colVar(th.ci)}">${th.name.slice(2,3)}</span>
        <div class="mid"><div class="name">${th.name}</div>
          <div class="meta">累计 ${total} 次 · 已归档</div></div>
        <button class="unbtn" data-action="unarchive" data-thought="${th.id}"
          role="button" aria-label="恢复 ${th.name}" title="恢复到念头列表">${ic('rotate',18)}</button>
      </div>`;
    });
    html += `<p class="calm-note" style="margin-top:8px">点右侧圆钮恢复 · 点行看详情</p>`;
  }

  el.innerHTML = html;
}
