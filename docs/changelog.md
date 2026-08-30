# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 修复

- **安卓 15 全面屏下页面内容与状态栏重叠**:壳把状态栏/手势条高度注入 CSS 变量 `--sat`/`--sab`,六处贴边留白(页面顶、Tab 栏、FAB、Snackbar、弹层、页底)按变量留白;网页版变量默认 0 不受影响

### 新增

- **字体本地化,摆脱 CDN**:Lora + Noto Sans SC 的 108 个 woff2 分块(4.5MB)存入仓库 `fonts/`,由 `css/fonts.css` 提供 @font-face(保留 unicode-range 按需分块);页面不再访问 fonts.googleapis.com / gstatic,APK 内也能用上真字体
- 安卓壳工程 `android/`:WebView 壳(WebViewAssetLoader 本地资源,离线无网络权限)
- GitHub Actions 自动打包:推送构建 debug APK(Artifacts 可下载);推 `v*` 标签自动发 Release 并挂 APK
- 构建时自动把仓库根目录网页同步进壳,网页只维护一份
- **签名固定化**:`android/keystore/zhinian-signing.p12`(自签调试级)入仓库,debug/release 统一签名;此前 Actions 的 keystore 缓存从未生效,每次构建生成一次性密钥导致无法覆盖安装(1.0.3 起修复)

### 计划中

- 正式签名的 release 包(现为 debug 签名)
- 单条记录补记一句备注
- 添加念头自选颜色 / 图标

## [1.0.1] - 2026-08-31

### 修复

- 首页空状态添加第一个念头后,首页不刷新、仍显示空状态(`js/16-app.js`)
- 点卡片 +1 后,卡片「本周 N 次」不即时更新,出现「今日 2 · 本周 0」的自相矛盾(`js/05-page-home.js`、`js/13-counter.js`)
- App 外壳容器可被程序化滚动(如输入框聚焦触发),导致整屏错位且无法自行恢复;`overflow: clip` 一行修复(`css/02-base.css`)

### 新增

- 念头查重:添加与已有念头重名的念头、或把念头改名成别人已占用的名字时,温和提醒并拦截(`js/02-data.js`、`js/16-app.js`)
- 弹层空名称提交时的轻提醒:输入框抖动 + 聚焦,不用弹窗打断(`js/14-sheet.js`、`css/09-sheet.css`)

### 变更

- 添加念头弹层的描述不再限定「不要……」句式:怎么写都行,写下来是为了认出念头
- Service Worker 缓存版本 v1 → v2

## [1.0.0] - 2026-08-30

### 新增

- 零摩擦计数:首页点卡片 +1,涟漪 + 数字弹跳动效,5 秒内可撤销
- 统计四视图:日分布 / 周条形图 / 月折线图 / 年日历热力图,各念头分布与较上期变化
- 念头管理:添加(预设 chips)/ 重命名 / 暂停 / 归档 / 删除(危险操作确认)
- 念头详情:周图 + 年足迹 + 最近觉察时间线,可删单条记录
- 设置:主题三选、备份/恢复、导出/导入 .json、测试数据导入、重置数据
- 数据全部本地存储,自动保存;PWA 支持「添加到主屏幕」离线使用
- 从单文件原型拆分为「一个页面一个文件、一个效果一个文件」的结构,全部中文注释
