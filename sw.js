/* ============================================================
 * sw.js — Service Worker(让止念能离线打开、能"添加到主屏幕")
 * 策略:网络优先 —— 在线时总是拿最新文件(顺手更新缓存),
 *       断网时退回缓存里的版本。数据本体不在缓存里,
 *       它在 localStorage(由 js/09-storage.js 负责),与这里无关。
 * 改了代码想让手机上的缓存更新:把下面的版本号 v1 改成 v2 即可。
 * ============================================================ */

const CACHE = 'zhinian-v2';

/* App 外壳:安装时就缓存好这些,保证离线能打开 */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/01-tokens.css',
  './css/02-base.css',
  './css/03-components.css',
  './css/04-page-home.css',
  './css/05-page-stats.css',
  './css/06-page-thoughts.css',
  './css/07-page-detail.css',
  './css/08-page-settings.css',
  './css/09-sheet.css',
  './css/10-snackbar.css',
  './js/01-icons.js',
  './js/02-data.js',
  './js/03-stats.js',
  './js/04-charts.js',
  './js/05-page-home.js',
  './js/06-page-stats.js',
  './js/07-page-thoughts.js',
  './js/08-page-detail.js',
  './js/09-storage.js',
  './js/10-page-settings.js',
  './js/11-effects.js',
  './js/12-snackbar.js',
  './js/13-counter.js',
  './js/14-sheet.js',
  './js/15-theme.js',
  './js/16-app.js',
  './js/17-pwa.js'
];

/* 安装:把外壳全部缓存;新 SW 立即接管 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

/* 激活:清掉旧版本的缓存 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 拦截请求:网络优先,失败(离线)退回缓存;成功时顺手更新缓存 */
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
