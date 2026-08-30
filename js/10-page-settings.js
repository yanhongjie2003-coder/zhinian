/* ============================================================
 * 10-page-settings.js — 设置页
 * 只做一件事:把设置页的 HTML 拼出来,塞进 #scr-settings。
 * 内容:数据概览 → 外观(主题三选)→ 数据操作 → 测试数据 →
 *       危险区(重置)→ 关于。
 * 按钮点击后做什么:路由在 16-app.js,具体逻辑在 09-storage.js。
 * ============================================================ */

/* 相对时间:多久之前保存的(用于"恢复"一行的小字) */
function timeAgo(ts){
  const m = Math.round((Date.now() - ts) / 60000);
  if(m < 1)   return '刚刚';
  if(m < 60)  return m + ' 分钟前';
  const h = Math.round(m / 60);
  if(h < 24)  return h + ' 小时前';
  return Math.round(h / 24) + ' 天前';
}

function renderSettings(){
  const el = document.getElementById('scr-settings');
  const saved = lastSavedAt();
  const mode = currentThemeMode();                 // system / light /dark(15-theme.js)
  const THEMES = [['system','跟随系统'],['light','浅色'],['dark','深色']];

  /* 设置行:图标圆 + 标题 + 小字说明;整行可点(data-action 交给总调度) */
  const row = (ic2, act, title, sub) => `
    <div class="setrow" data-action="${act}" role="button" tabindex="0" aria-label="${title}">
      <span class="avatar">${ic(ic2, 20)}</span>
      <div class="mid"><div class="name">${title}</div><div class="sub">${sub}</div></div>
      <span class="go">${ic('chevR', 18)}</span>
    </div>`;

  el.innerHTML = `
    <div class="h-date">设置</div>
    <div class="h-title">数据只属于你<span class="dot">.</span></div>

    <!-- 数据概览:三张小卡,样式复用统计页的 .sum -->
    <div class="sumrow">
      <div class="sum"><div class="v">${thoughts.filter(t=>!t.archived).length}</div><div class="k">条念头</div></div>
      <div class="sum"><div class="v">${records.length}</div><div class="k">条觉察记录</div></div>
      <div class="sum"><div class="v" style="font-size:15px; padding-top:5px">${saved ? timeAgo(saved) : '未备份'}</div><div class="k">上次备份</div></div>
    </div>

    <!-- 外观:主题三选,样式复用统计页的 .seg 分段控件 -->
    <div class="panel"><h4>外观</h4><div class="cap">深色模式</div>
      <div class="seg" role="tablist" aria-label="主题">
        ${THEMES.map(([v, label]) =>
          `<button role="tab" aria-selected="${mode===v}" class="${mode===v?'on':''}"
            data-action="theme-set" data-mode="${v}">${label}</button>`).join('')}
      </div>
    </div>

    <!-- 数据操作(日常改动已自动保存,这里是备份与迁移) -->
    <div class="panel"><h4>数据</h4><div class="cap">改动已自动保存 · 数据只存在这台设备上</div>
      ${row('save',   'save-data',    '备份到本机',   '存一份手动快照,大胆操作前留后路')}
      ${row('rotate', 'restore-data', '从备份恢复',   saved ? '回到上次手动备份的状态(替换当前数据)' : '还没有备份过')}
      ${row('download','export-data', '导出备份文件', '下载一个 .json 文件,可存网盘或换机')}
      ${row('upload', 'import-data',  '从文件导入',   '选择之前导出的 .json 备份')}
    </div>

    <!-- 测试数据 -->
    <div class="panel"><h4>演示</h4><div class="cap">想看看图表长什么样?</div>
      ${row('beaker', 'demo-data', '测试数据导入', '生成过去 10 个月的演示数据(替换当前数据)')}
    </div>

    <!-- 危险区:红色只用在破坏性操作上 -->
    <button class="dangerlink" data-action="reset-data">重置数据(清空全部念头与记录)</button>

    <!-- 关于 -->
    <div class="about">
      <p>${ic('shield', 14)} 止念 · V1.0 原型</p>
      <p>无账号 · 无上传 · 离线可用 · 数据不出设备</p>
    </div>
    <p class="calm-note">${ic('eye')}每一次保存,都是一次安放。</p>`;
}
