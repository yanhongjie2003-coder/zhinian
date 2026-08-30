/* ============================================================
 * 09-storage.js — 数据的本机存取
 * 两层存储:
 *   1. 自动保存(zhinian.data)——内存数据每次变化都会自动写入,
 *      刷新 / 关闭页面后再打开,数据原样回来。用户无感知,是主存储。
 *   2. 手动备份(zhinian.snapshot)——设置页「备份到本机」存的快照,
 *      用于大胆操作前留后路(比如导入文件前),「从备份恢复」可以回滚。
 * 另有:导出/导入 .json 文件、载入测试数据、重置。
 * 危险操作(恢复/导入/测试数据/重置)的确认弹窗由 16-app.js 调 14-sheet.js 完成。
 * ============================================================ */

const DATA_KEY     = 'zhinian.data';      // 自动保存:App 的主数据
const SNAPSHOT_KEY = 'zhinian.snapshot';  // 手动备份:设置页的快照
const THEME_KEY    = 'zhinian.theme';     // 主题选择(15-theme.js 在用)

/* localStorage 在个别环境下可能被禁用,包一层防报错 */
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

/* ---------- 自动保存:内存数据 → 本机(每次变化后都要调一次) ---------- */
function saveData(){
  lsSet(DATA_KEY, JSON.stringify({
    app: 'zhinian', v: 1,
    savedAt: Date.now(),
    thoughts: thoughts,
    records: records,
  }));
}

/* ---------- 启动:从本机装回上次的数据(没有就是全新空状态) ----------
 * 在本文件加载到末尾时自动执行一次(页面渲染之前)。 */
function loadStoredData(){
  const raw = lsGet(DATA_KEY);
  if(!raw) return;                                   // 第一次使用 → 空状态
  try{
    const data = normalizeData(JSON.parse(raw), true);
    if(data){ thoughts = data.thoughts; records = data.records; }
  }catch(e){ /* 数据坏了就当没有,不挡启动 */ }
}

/* ---------- 手动备份:保存 / 恢复 / 查询 ---------- */

/* 把当前数据存一份手动快照(设置页「备份到本机」) */
function saveSnapshot(){
  lsSet(SNAPSHOT_KEY, JSON.stringify({
    app: 'zhinian', v: 1,
    savedAt: Date.now(),
    thoughts: thoughts,
    records: records,
  }));
}

/* 上次手动备份的时间;没备份过返回 null */
function lastSavedAt(){
  const raw = lsGet(SNAPSHOT_KEY);
  if(!raw) return null;
  try{ return JSON.parse(raw).savedAt || null; }catch(e){ return null; }
}

/* 把手动备份装回内存。成功返回 {thoughts, records},数据非法返回 null */
function restoreSnapshot(){
  const raw = lsGet(SNAPSHOT_KEY);
  if(!raw) return null;
  return applyImported(JSON.parse(raw));
}

/* ---------- 导出:下载 .json 备份文件 ---------- */
function exportFile(){
  const data = { app:'zhinian', v:1, exportedAt:Date.now(), thoughts, records };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const d = new Date(), p = n => String(n).padStart(2,'0');
  a.download = `zhinian-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);                       // 下载触发后释放临时链接
}

/* ---------- 导入:选文件 → 校验 → 装进内存 ---------- */
function importFile(){
  const inp = document.createElement('input');       // 临时造一个文件选择框
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const file = inp.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try{ data = JSON.parse(reader.result); }catch(e){}
      const res = applyImported(data);
      if(res) saveData();                            // 导入成功也自动保存
      refreshAll();
      showSnack(res ? `已导入 · ${res.thoughts.length} 条念头 · ${res.records.length} 条记录`
                    : '导入失败:文件格式不对');
    };
    reader.readAsText(file);
  };
  inp.click();
}

/* ---------- 数据校验(启动载入 / 恢复备份 / 导入文件 共用) ----------
 * 把任意来路的数据整理成安全形状。allowEmpty 为 true 时空数据也算合法
 * (启动载入时,「重置后的空数据」是正常情况)。
 * 合法 → 返回 {thoughts, records};非法 → 返回 null(不动现有数据)。 */
function normalizeData(data, allowEmpty){
  if(!data || !Array.isArray(data.thoughts) || !Array.isArray(data.records)) return null;

  /* 念头:逐条补齐字段,保证后续渲染不会崩 */
  const newThoughts = data.thoughts
    .filter(t => t && typeof t.name === 'string' && t.name.trim())
    .map((t, i) => ({
      id: String(t.id || ('t'+(Date.now()+i))),
      name: String(t.name).slice(0, 24),
      ci: Math.min(4, Math.max(1, Number(t.ci) || (i%4)+1)),
      created: Number(t.created) || 0,
      paused: !!t.paused,
      archived: !!t.archived,
    }));
  const ids = new Set(newThoughts.map(t => t.id));

  /* 记录:只留下"念头 id 存在 + 时间戳是数字"的行 */
  const newRecords = data.records
    .filter(r => r && ids.has(String(r.t)) && typeof r.ts === 'number' && isFinite(r.ts))
    .map(r => ({t: String(r.t), ts: r.ts}));

  if(!allowEmpty && !newThoughts.length && !newRecords.length) return null;

  return {thoughts: newThoughts, records: newRecords};
}

/* 导入/恢复共用:校验并替换当前内存数据(不落盘,落盘由调用方 saveData 决定) */
function applyImported(data){
  const res = normalizeData(data, false);
  if(!res) return null;
  thoughts = res.thoughts;
  records = res.records;
  return res;
}

/* ---------- 载入测试数据 / 重置 ---------- */
function loadTestData(){
  loadDemoData();
}
function resetAll(){
  thoughts = [];
  records = [];
}

/* ---------- 启动:把上次自动保存的数据装回来(页面渲染之前) ---------- */
loadStoredData();
