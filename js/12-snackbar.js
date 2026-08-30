/* ============================================================
 * 12-snackbar.js — 底部提示条
 * 管:显示/隐藏底部提示,5 秒后自动消失。
 * showSnack(文字)          → 只显示文字(暂停/添加/归档这类没有可撤销的操作)
 * showSnack(文字, true)    → 带撤销按钮(只有"计数"用,撤销逻辑在 11-counter.js)
 * ============================================================ */

let snackTimer = null;   // 5 秒自动消失的定时器

function showSnack(text, canUndo = false){
  const s = document.getElementById('snack');
  document.getElementById('snackText').textContent = text;
  document.getElementById('snackUndo').style.display = canUndo ? 'flex' : 'none';
  s.classList.add('show');                         // .show 让它从下方浮入(css/09-snackbar.css)
  clearTimeout(snackTimer);                        // 连续提示时,重新计 5 秒
  snackTimer = setTimeout(hideSnack, 5000);
}

function hideSnack(){
  clearTimeout(snackTimer);
  document.getElementById('snack').classList.remove('show');
}
