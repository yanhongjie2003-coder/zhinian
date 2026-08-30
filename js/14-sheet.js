/* ============================================================
 * 14-sheet.js — 底部弹层
 * 管:三个弹层 + Esc 关闭:
 *   1. 「添加念头」弹层:打开/关闭、建议 chips 点击填入
 *   2. 「重命名」弹层:详情页铅笔钮打开,保存回到 16-app.js
 *   3. 通用确认弹窗:设置页的恢复/测试数据/重置、删除念头在用
 * 「添加念头」按钮本身的逻辑在 16-app.js(它涉及改数据 + 跳页)。
 * ============================================================ */

/* ---------- 1) 添加念头弹层 ---------- */

/* open 传 true 打开、false 关闭;核心就是切换 .open 类(css/09-sheet.css 负责动画) */
function openSheet(open){
  document.getElementById('sheet').classList.toggle('open', open);
  if(open) setTimeout(() => document.getElementById('newName').focus(), 320); // 等滑入动画结束后聚焦输入框
}

/* 空名称提交的轻提醒:输入框抖两下并聚焦(样式 .field.nudge 在 css/09-sheet.css)。
 * 不用弹窗、不用红字——符合「无羞耻感」原则,只是温和地说"还没写名字哦"。 */
function nudgeEmpty(inp){
  inp.classList.remove('nudge');
  void inp.offsetWidth;                 // 强制回流:连续两次空提交也能重新播放动画
  inp.classList.add('nudge');
  inp.focus();
}

/* 建议 chips:SUGGEST 定义在 02-data.js;点一下把文字填进输入框 */
document.getElementById('chips').innerHTML =
  SUGGEST.map(s => `<button class="fchip" data-sug="${s}">${s}</button>`).join('');

document.getElementById('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-sug]');
  if(b) document.getElementById('newName').value = b.dataset.sug;
});

/* ---------- 2) 重命名弹层 ---------- */

function openRename(){
  document.getElementById('renameField').value = thoughts.find(t => t.id === detailId)?.name || '';
  document.getElementById('renameSheet').classList.add('open');
  setTimeout(() => document.getElementById('renameField').focus(), 320);
}

function closeRename(){
  document.getElementById('renameSheet').classList.remove('open');
}

/* ---------- 3) 通用确认弹窗 ----------
 * 用法:openConfirm({title, text, okText, danger, onOk})
 * danger 为 true 时确认按钮是红色(用于"删除/重置"这类不可逆操作)。 */

let confirmCb = null;                                // 点"确认"后要执行的回调

function openConfirm({title, text, okText = '确认', danger = false, onOk}){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  const ok = document.getElementById('confirmOk');
  ok.textContent = okText;
  ok.classList.toggle('danger', danger);             // .danger 样式在 css/03-components.css
  confirmCb = onOk;
  document.getElementById('confirm').classList.add('open');
}

function closeConfirm(){
  document.getElementById('confirm').classList.remove('open');
  confirmCb = null;
}

/* 确认按钮:先关弹窗再执行回调(回调里弹的提示条不会被遮罩盖住) */
document.getElementById('confirmOk').addEventListener('click', () => {
  const cb = confirmCb;
  closeConfirm();
  if(cb) cb();
});

/* ---------- 按 Esc 关闭所有弹层 ---------- */
document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){ openSheet(false); closeRename(); closeConfirm(); }
});
