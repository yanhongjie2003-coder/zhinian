/* ============================================================
 * 02-data.js — 数据
 * 管:两条核心数据(内存中):
 *   thoughts —— 「念头」列表(那些想放下的、想觉察的)
 *   records  —— 「觉察记录」(每一条 = 某时某刻记了一次)
 * 启动时由 09-storage.js 从本机自动载入上次的数据(没有就是全新空状态);
 * 内存数据的每次改动都会被自动写回本机,刷新/关闭页面不再丢失。
 * loadDemoData() 是「测试数据导入」用的演示数据生成器(固定随机种子,可复现)。
 * ============================================================ */

/* 固定种子的伪随机数发生器:输入同一个种子,输出同一串"随机"数 */
function mulberry32(a){
  return function(){
    a|=0; a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296;
  };
}

/* ---------- 时间工具 ---------- */
const DAY = 86400000;                                              // 一天的毫秒数
const dayStart = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; }; // 某天的 0 点整
const today = dayStart(new Date());
const dAgo = n => new Date(today.getTime() - n*DAY);               // n 天前
const key = d => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; // 日期的唯一标识,如 "2026-8-30"

/* ---------- 测试数据 ----------
 * 生成 4 条「念头」+ 过去 300 天的觉察记录(整体趋势缓缓变好,
 * 周末略有不同,偶尔某天爆发一次)。
 * 设置页的「测试数据导入」也会调用这个函数。 */
function loadDemoData(){
  rnd = mulberry32(20260830);                                      // 重置随机种子,保证每次生成一样的数据

  /* ci:颜色编号 1~4(取 01-tokens.css 里的 --t1 ~ --t4)
   * created:多少天前创建(早于创建日的天没有数据) */
  thoughts = [
    {id:'t1', name:'不要想过去的事', ci:1, created:290, paused:false},
    {id:'t2', name:'不要抱怨',       ci:2, created:290, paused:false},
    {id:'t3', name:'睡前刷手机',     ci:3, created:180, paused:false},
    {id:'t4', name:'不要自我否定',   ci:4, created:95,  paused:false},
  ];
  records = [];                                                    // 每条:{t: 念头id, ts: 时间戳}

  const base = {t1:3.4, t2:2.6, t3:2.3, t4:1.9};                   // 每条念头的"日均基础次数"
  for(let n=300; n>=1; n--){                                       // 从 300 天前走到昨天
    const d = dAgo(n), dow = d.getDay();
    thoughts.forEach(th => {
      if(n > th.created) return;                                   // 该念头还没创建,跳过
      let rate = base[th.id] * (0.5 + 0.5*(n/300));                // 整体缓降趋势:越接近今天次数越少(在变好)
      if(dow===0 || dow===6) rate *= (th.id==='t3' ? 0.8 : 1.3);   // 周末模式:刷手机变少,其他变多
      let c = Math.round(rate * (0.35 + rnd()*1.5) * (rnd()<.06 ? 2.2 : 1)); // 随机波动,偶尔爆一天
      c = Math.max(0, Math.min(9, c));                             // 一天 0~9 次
      for(let i=0;i<c;i++){                                        // 当天每次记录给一个随机时刻
        const h = 7 + Math.floor(rnd()*16), m = Math.floor(rnd()*60);
        const x = new Date(d); x.setHours(h, m, Math.floor(rnd()*60), 0);
        records.push({t:th.id, ts:x.getTime()});
      }
    });
  }
  // 再补上"今天"已有的几条,让首页一打开就有数字
  [['t1',8,12],['t1',10,47],['t1',14,30],['t2',12,20],['t4',9,3]].forEach(([t,h,m])=>{
    const x = new Date(today); x.setHours(h,m,30,0);
    records.push({t, ts:x.getTime()});
  });
}

/* 添加弹层里的预设建议 chips */
const SUGGEST = ['不要想过去的事','不要抱怨','不要想 TA','睡前不刷手机','不要自我否定','不要熬夜'];

/* 全局数据(别的文件都读写这两个变量)。
 * 开机默认是空:首次使用就是干净的空状态;
 * 有历史数据时,09-storage.js 会在页面渲染前把它装回来。 */
let thoughts = [];
let records = [];
let rnd = mulberry32(20260830);
/* 不自动生成演示数据——测试数据只从设置页「测试数据导入」手动载入 */

/* 念头查重:添加/重命名时用。同名(忽略大小写和首尾空格)就算重复;
 * exceptId 传念头 id 表示"查重时跳过它自己"——重命名场景下自己不算撞名。 */
function nameTaken(name, exceptId){
  const key = name.trim().toLowerCase();
  return thoughts.some(t => t.id !== exceptId && t.name.trim().toLowerCase() === key);
}
