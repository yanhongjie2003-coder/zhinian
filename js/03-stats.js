/* ============================================================
 * 03-stats.js — 统计计算
 * 页面上出现的每一个数字(今天几次、连续几天、本周合计……)
 * 都由这里的函数从 records 算出来。只负责"算",不管"画"。
 * ============================================================ */

/* 当前启用中的念头(没暂停、没归档的) */
const actives = () => thoughts.filter(t => !t.paused && !t.archived);

/* 某一天的记录条数;传 tid 只统计该念头,不传统计全部 */
const countDay = (d, tid) => {
  const k = key(d); let n = 0;
  for(const r of records){
    if(tid && r.t !== tid) continue;
    if(key(new Date(r.ts)) === k) n++;
  }
  return n;
};

/* 某个日期区间(闭区间)内的记录条数 */
const rangeCount = (a, b, tid) => {
  const s = dayStart(a).getTime(), e = dayStart(b).getTime(); let n = 0;
  for(const r of records){
    if(tid && r.t !== tid) continue;
    if(r.ts >= s && r.ts < e + DAY - 1) n++;
  }
  return n;
};

/* 连续觉察天数:从今天往前数,一天不落的天数;今天还没记则从昨天开始算 */
function streak(){
  let s = 0, d = new Date(today);
  if(countDay(d) === 0) d = dAgo(1);
  while(countDay(d) > 0){ s++; d = new Date(d.getTime() - DAY); }
  return s;
}

/* 最近 n 天的数组:[{d: 日期, c: 当天次数}],按时间正序(旧→新) */
const lastNDays = n => Array.from({length:n}, (_, i) => {
  const d = dAgo(n - 1 - i);
  return {d, c: countDay(d)};
});

/* 某天所在周的周一(中国习惯:周一起始) */
const weekMonday = d => { const x = dayStart(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

/* 念头颜色工具:ci 是 1~4,取 01-tokens.css 里对应的变量 */
const colVar  = ci => `var(--t${ci})`;        // 主色(用于文字、图标、柱子)
const colSoft = ci => `var(--t${ci}-soft)`;   // 浅底色(用于圆形符号的背景)
