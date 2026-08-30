/* ============================================================
 * 16-app.js — 总调度(整个 App 的"交通警察")
 * 管:全局状态、Tab 切页、把用户的点击分发给对应模块、初始渲染。
 * 必须最后一个加载(前面所有文件的函数它都要用)。
 * ============================================================ */

/* ---------- 全局状态 ---------- */
let curScreen = 'home';   // 当前显示的页面:home / stats / thoughts / detail / archive / settings
let curRange  = 'day';    // 统计页当前范围:day / week / month / year
let detailId  = 't1';     // 详情页正在看哪条念头

/* ---------- 页面切换 ----------
 * 把 .active 类移到目标 section,同步 Tab 高亮,再让页面文件重渲染一遍 */
function showScreen(s){
  curScreen = s;
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById('scr-' + s).classList.add('active');
  document.getElementById('scr-' + s).scrollTop = 0;                 // 回到页面顶部
  const noTab = (s === 'detail' || s === 'archive');                 // 二级页(详情/归档)没有 Tab 栏
  document.getElementById('tabbar').style.display = noTab ? 'none' : 'flex';
  document.getElementById('addFab').style.display = (s === 'thoughts') ? 'flex' : 'none'; // 添加钮只在念头页
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.go === s));
  if(s === 'home')     renderHome();
  if(s === 'stats')    renderStats();
  if(s === 'thoughts') renderThoughts();
  if(s === 'detail')   renderDetail();
  if(s === 'archive')  renderArchive();
  if(s === 'settings') renderSettings();
}

/* 数据变了(计数/撤销/添加/暂停/归档/恢复/导入/恢复快照/重置)之后,把当前页刷新一遍 */
function refreshAll(){
  if(curScreen === 'home')     renderHome();
  if(curScreen === 'stats')    renderStats();
  if(curScreen === 'detail')   renderDetail();
  if(curScreen === 'archive')  renderArchive();
  if(curScreen === 'settings') renderSettings();
}

/* ---------- 全局点击分发 ----------
 * 不给每个按钮单独绑事件,而是在 App 根节点上"听"所有点击:
 * 点到的元素(或它的祖先)带 data-go 就跳页;带 data-action 就做对应的事 */
function dispatchClick(e){
  const t = e.target.closest('[data-action],[data-go]');
  if(!t) return;
  const act = t.dataset.action, go = t.dataset.go;

  if(go){ showScreen(go); return; }                                  // 底部 Tab 跳页

  if(act === 'count')       doCount(t.dataset.thought, e.clientX, e.clientY);
  if(act === 'range')     { curRange = t.dataset.range; renderStats(); }
  if(act === 'open-detail'){ detailId = t.dataset.thought; showScreen('detail'); }
  if(act === 'open-sheet')  openSheet(true);
  if(act === 'close-sheet') openSheet(false);
  if(act === 'close-confirm') closeConfirm();

  /* 返回:详情页里如果看的是已归档的念头,返回键回归档列表而不是念头页 */
  if(act === 'back'){
    const th = thoughts.find(x => x.id === detailId);
    showScreen(th && th.archived ? 'archive' : 'thoughts');
  }
  if(act === 'back-thoughts') showScreen('thoughts');                // 归档页的返回
  if(act === 'open-archive')  showScreen('archive');                 // 念头页右上角的归档圆钮

  /* 归档:移出念头页和首页,数据原样保留;可随时在归档里恢复 */
  if(act === 'archive'){
    const th = thoughts.find(x => x.id === t.dataset.thought);
    if(th){
      th.archived = true;
      saveData();
      showScreen('thoughts');
      showSnack(`已归档 ·「${th.name}」· 右上角 ↗ 可找回`);
    }
  }

  /* 恢复(撤销归档):搬回念头页;在归档列表点的,列表原地少一行 */
  if(act === 'unarchive'){
    const th = thoughts.find(x => x.id === t.dataset.thought);
    if(th){
      th.archived = false;
      saveData();
      refreshAll();
      renderThoughts();                                              // 刷新念头页,回来就是最新的
      if(curScreen === 'detail') showScreen('archive');              // 详情页里点的,回归档列表
      showSnack(`已恢复 ·「${th.name}」`);
    }
  }

  /* 添加念头:读输入框 → 查重 → 塞进 thoughts → 关弹层 → 提示 */
  if(act === 'add-thought'){
    const inp = document.getElementById('newName');
    const name = inp.value.trim();
    if(!name){ nudgeEmpty(inp); return; }                            // 名字为空就不添加:抖一下输入框提醒
    if(nameTaken(name)){                                             // 和已有念头重名:不添加,温和提醒
      nudgeEmpty(inp);
      showSnack('已经有这条念头了,不用重复添加');
      return;
    }
    thoughts.push({id:'t'+Date.now(), name, ci:(thoughts.length%4)+1, created:0, paused:false});
    saveData();
    inp.value = '';
    openSheet(false);
    renderThoughts();
    renderHome();                                                    // 从首页空状态添加时,首页要立刻换成卡片列表
    showSnack('已添加念头 ·「' + name + '」');
  }

  /* 重命名:详情页铅笔钮 → 弹层改名字(只动名字,记录原样) */
  if(act === 'open-rename')  openRename();
  if(act === 'close-rename') closeRename();
  if(act === 'save-rename'){
    const inp = document.getElementById('renameField');
    const name = inp.value.trim();
    const th = thoughts.find(x => x.id === detailId);
    if(!th) { closeRename(); return; }
    if(!name){ nudgeEmpty(inp); return; }                            // 名字为空就不保存:抖一下输入框提醒
    if(nameTaken(name, th.id)){                                      // 别的念头已经叫这个名:不改,温和提醒
      nudgeEmpty(inp);
      showSnack('已经有别的念头叫这个名字了');
      return;
    }
    th.name = name;
    saveData();
    closeRename();
    renderDetail();
    refreshAll();                                                    // 首页/念头页/归档页里的名字都刷新
    showSnack('已改名 ·「' + name + '」');
  }

  /* 删除念头:连全部记录一起清掉,不可恢复 → 红色确认按钮 */
  if(act === 'delete-thought'){
    const th = thoughts.find(x => x.id === t.dataset.thought);
    if(!th) return;
    const n = records.filter(r => r.t === th.id).length;
    openConfirm({
      title: '删除念头',
      text: `将彻底删除「${th.name}」和它的 ${n} 条记录,无法恢复。确定继续吗?`,
      okText: '删除',
      danger: true,
      onOk(){
        records = records.filter(r => r.t !== th.id);
        thoughts = thoughts.filter(x => x.id !== th.id);
        saveData();
        showScreen('thoughts');
        showSnack(`已删除 ·「${th.name}」`);
      },
    });
  }

  /* 删除单条记录:详情页时间线里的 ×;删错可撤销(js/13-counter.js) */
  if(act === 'del-record'){
    const id = t.dataset.thought, ts = Number(t.dataset.ts);
    const i = records.findIndex(r => r.t === id && r.ts === ts);
    if(i > -1){
      lastDeleted = records[i];                                      // 留给「撤销」放回去
      records.splice(i, 1);
      saveData();
      renderDetail();
      showSnack('已删除这条记录', true);
    }
  }

  /* 暂停/恢复开关:checkbox 的原生行为已经改了 checked,这里同步回数据 */
  if(act === 'pause'){
    const th = thoughts.find(x => x.id === t.dataset.thought);
    if(th){
      th.paused = !t.checked;
      saveData();
      renderThoughts();
      renderHome();                                                  // 首页卡片列表也要跟着增减
      showSnack(th.paused ? '已暂停记录 · 历史数据保留' : '已恢复记录');
    }
  }

  /* ---------- 设置页:数据操作(具体逻辑在 09-storage.js) ---------- */

  /* 手动备份:日常不靠它(有自动保存),用于大胆操作前留个后路 */
  if(act === 'save-data'){
    saveSnapshot();
    refreshAll();
    showSnack('已备份到本机');
  }

  /* 从备份恢复:会覆盖当前数据 → 先弹确认窗 */
  if(act === 'restore-data'){
    if(!lastSavedAt()){ showSnack('还没有备份,先「备份到本机」'); return; }
    openConfirm({
      title: '从备份恢复',
      text: '将回到上次手动备份的状态,备份之后的修改会丢失。',
      okText: '恢复',
      onOk(){
        const r = restoreSnapshot();
        if(r) saveData();                                            // 恢复出来的状态也要自动保存
        refreshAll();
        showSnack(r ? `已恢复 · ${r.thoughts.length} 条念头 · ${r.records.length} 条记录`
                    : '备份数据异常,恢复失败');
      },
    });
  }

  /* 导出:下载 .json 备份文件,无破坏性 */
  if(act === 'export-data'){
    exportFile();
    showSnack('已导出备份文件');
  }

  /* 导入:打开文件选择框;解析与结果提示在 09-storage.js 里完成 */
  if(act === 'import-data'){
    importFile();
  }

  /* 测试数据:会替换当前数据 → 先弹确认窗 */
  if(act === 'demo-data'){
    openConfirm({
      title: '测试数据导入',
      text: '将生成过去 10 个月的演示数据,替换当前数据。',
      okText: '导入',
      onOk(){
        loadTestData();
        saveData();                                                  // 测试数据也算正式数据,自动保存
        refreshAll();
        showSnack('已载入测试数据 · 4 条念头 · 约 10 个月记录');
      },
    });
  }

  /* 重置:清空全部,不可恢复 → 红色确认按钮 */
  if(act === 'reset-data'){
    openConfirm({
      title: '重置数据',
      text: '将清空全部念头与记录,且无法恢复。确定继续吗?',
      okText: '清空',
      danger: true,
      onOk(){
        resetAll();
        saveData();                                                  // 把"空"也写进本机,下次打开还是空的
        refreshAll();
        showSnack('已重置 · 从一条念头重新开始');
      },
    });
  }

  /* 主题三选:跟随系统 / 浅色 / 深色(逻辑在 15-theme.js) */
  if(act === 'theme-set'){
    setThemeMode(t.dataset.mode);
    renderSettings();
  }
}

/* App 根节点:Tab栏、卡片、开关、设置行……所有点击都从这里分发 */
document.getElementById('app').addEventListener('click', dispatchClick);

/* 键盘可达性:焦点在卡片/行上时,Enter 或空格等同点击 */
document.getElementById('app').addEventListener('keydown', e => {
  if((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')){
    e.preventDefault();
    e.target.click();
  }
});

/* ---------- 初始渲染:各页面先各画一遍,切 Tab 时不用现等 ----------
 * 最后 showScreen('home') 统一初始化一遍显隐状态(悬浮钮、Tab 高亮) */
renderStats(); renderThoughts(); renderDetail(); renderArchive(); renderSettings();
showScreen('home');

/* ---------- URL 参数直达(便于分享/截图;主题参数由 15-theme.js 处理) ----------
 * 例:index.html?screen=stats&range=week&sheet=1 */
const qp = new URLSearchParams(location.search);
if(qp.get('screen')) showScreen(qp.get('screen'));
if(qp.get('range')){ curRange = qp.get('range'); if(curScreen === 'stats') renderStats(); }
if(qp.get('sheet'))  openSheet(true);
