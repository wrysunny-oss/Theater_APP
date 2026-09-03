# Composables 目录约定

Composable（Hook）负责可复用的响应式状态和页面生命周期，不渲染 UI：

- `useHomeMovies`：首页筛选、分页和刷新。
- `useDramaPlayer`：播放器状态机、秒级续播、网络监听、任务进度和观看记录上报。
- `useContentCollection`：历史、收藏等集合页的通用操作。
- `useEarningsLedger`：收益筛选、汇总和增量展示。
- `useUserDashboard`：个人中心跨服务数据聚合。
- `useAccountSecurity`：账户安全编辑状态与校验。
- `useSmsCountdown`：验证码倒计时。
- `useConfirmAction`：删除、清空和重置等操作的二次确认。

命名统一使用 `useXxx`。Composable 只能依赖 `services`、`types`、配置和 Vue/UniApp API，不依赖页面组件。
