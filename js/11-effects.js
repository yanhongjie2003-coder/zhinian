/* ============================================================
 * 11-effects.js — 点击动效(纯视觉,不含任何业务逻辑)
 * 被 11-counter.js 在计数时调用:
 *   spawnRipple  在卡片上从手指位置扩散一圈涟漪
 *   popNumber    让数字"弹"一下(先放大再回位)
 * ============================================================ */

/* 在 card 内、以点击坐标 (x,y) 为圆心播放涟漪;x/y 拿不到就用卡片中心 */
function spawnRipple(card, x, y){
  const rect = card.getBoundingClientRect();       // 卡片相对浏览器窗口的位置
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = '160px';
  r.style.left = ((x ?? (rect.left + rect.width/2)) - rect.left - 80) + 'px';
  r.style.top  = ((y ?? (rect.top  + rect.height/2)) - rect.top  - 80) + 'px';
  card.appendChild(r);
  setTimeout(() => r.remove(), 600);               // 动画放完把这个临时节点删掉
}

/* 数字弹跳动画。小技巧:先移除动画类 → 强制浏览器重算(void el.offsetWidth)
 * → 再加回类,动画才会从头重播;否则连点两次不会有第二次动画 */
function popNumber(el){
  if(!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}
