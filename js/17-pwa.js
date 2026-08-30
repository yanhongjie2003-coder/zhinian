/* ============================================================
 * 17-pwa.js — PWA 注册
 * 只做一件事:注册 sw.js,让止念可以"添加到主屏幕"、离线打开。
 * 本文件不依赖其他模块,双击文件打开(file://)时自动跳过——
 * Service Worker 只在 http:// 或 https:// 下生效(本地服务器没问题)。
 * ============================================================ */

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js').catch(() => {
    /* 注册失败不影响 App 本身(比如浏览器不支持时),静默跳过 */
  });
}
