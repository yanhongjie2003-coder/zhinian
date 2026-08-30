/* ============================================================
 * 15-theme.js — 深色 / 浅色模式
 * 原理:改 <html> 上的 data-theme 属性,
 * css/01-tokens.css 里准备好的两套颜色变量就自动整套切换。
 * 三档模式(设置页可选,记住上次的选择):
 *   system —— 跟随系统,系统切换时实时跟着变(默认)
 *   light  —— 强制浅色
 *   dark   —— 强制深色
 * 网址参数 ?theme=dark / light / system 可临时强制,优先级最高。
 * ============================================================ */

let themeMode = 'system';                            // 当前的模式,设置页会读它

function applyTheme(t){
  document.documentElement.dataset.theme = t;
}

/* 按当前模式算出真正该用的主题 */
function resolveTheme(){
  if(themeMode === 'system'){
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeMode;
}

/* 设置页切换主题时调用:记住选择并立即生效 */
function setThemeMode(m){
  themeMode = m;
  lsSet(THEME_KEY, m);                               // lsSet / THEME_KEY 定义在 09-storage.js
  applyTheme(resolveTheme());
}

function currentThemeMode(){
  return themeMode;
}

/* ---------- 初始化:网址参数 > 上次保存的选择 > 跟随系统 ---------- */
const themeParam = new URLSearchParams(location.search).get('theme');
if(themeParam === 'dark' || themeParam === 'light' || themeParam === 'system'){
  themeMode = themeParam;                            // 网址强制指定,不写入存储(只本次有效)
}else{
  themeMode = lsGet(THEME_KEY) || 'system';
}
applyTheme(resolveTheme());

/* 跟随系统模式下,系统切换深浅色时实时跟着变 */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if(themeMode === 'system') applyTheme(resolveTheme());
});
