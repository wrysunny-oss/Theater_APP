# 幻乐剧场

> 本文档由 `npm run generate:docs` 自动生成，请勿直接修改生成内容。

## 项目简介

幻乐剧场 是基于 UniApp、Vue 3 和 TypeScript 开发的多端短剧应用。首页即短剧剧场，目前具备内容浏览、搜索、福利任务、收益和用户中心等页面骨架。

## 技术栈

- UniApp 3.0.0-5020420260813003
- Vue ^3.4.21
- TypeScript ^4.9.4
- uView Plus ^3.8.113
- UnoCSS ^66.9.2

## 页面清单

| 页面 | 路由 |
|---|---|
| 幻乐剧场 | `pages/index/index` |
| 福利 | `pages/tasks/tasks` |
| 收益 | `pages/earnings/earnings` |
| 金币提现 | `pages/withdrawal/withdrawal` |
| 我的 | `pages/user/user` |
| 搜索 | `pages/search/search` |
| 通知中心 | `pages/notifications/notifications` |
| 设置 | `pages/settings/settings` |
| 帮助与反馈 | `pages/help/help` |
| 协议与政策 | `pages/agreement/agreement` |
| 登录注册 | `pages/auth/auth` |
| 个人资料 | `pages/profile/profile` |
| 账户安全 | `pages/security/security` |
| 邀请好友 | `pages/share/share` |
| 观看历史 | `pages/history/history` |
| 我的收藏 | `pages/favorites/favorites` |
| 播放 | `pages/player/player` |

## 常用命令

```powershell
npm.cmd run dev:h5       # 启动 H5 开发环境
npm.cmd run type-check   # TypeScript 类型检查
npm.cmd run build:h5     # 构建 H5，并自动刷新本文档
npm.cmd run generate:docs # 单独刷新项目说明
```

## 配置说明

应用名称的唯一配置源为 `src/config/app.json`。H5 启动、构建前会自动同步应用清单、首页标题并刷新本文档。

全局颜色与暗色模式设计令牌集中在 `src/styles/theme.scss`。页面优先使用 UnoCSS 的 `app-page-shell`、`app-surface`、`app-text-secondary` 等语义快捷类，不应新增无业务含义的重复色值。

## 当前实现边界

- 页面主要使用本地演示数据，尚未接入业务 API。
- 每日签到和搜索历史保存在设备本地。
- 播放器已支持沉浸式切集、秒级续播、进度拖动、网络重试和观看任务上报；视频地址仍为演示资源。
- 支付和提现目前仅提供入口或状态提示。
- 穿山甲广告已建立 Android UTS 插件、Service 和 Hook 骨架，正式 SDK 参数和原生调用尚未配置。
- `dist` 为构建产物，不应直接修改。

## 目录结构

- `src/pages`：页面入口
- `src/components/common`：跨业务基础组件
- `src/components/<module>`：按业务模块组织的展示与交互组件
- `src/composables`：可复用响应式状态、页面生命周期和业务编排 Hook
- `src/types`：独立领域模型与接口契约
- `src/services`：数据访问层，页面不直接依赖 Mock 或存储结构
- `uni_modules/hly-csj-ad`：Android 穿山甲广告 UTS 桥接模块骨架
- `src/config`：应用级配置
- `src/styles`：全局及页面公共样式
- `scripts`：配置同步与文档生成脚本
