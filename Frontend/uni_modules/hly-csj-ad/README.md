# hly-csj-ad

幻乐剧场 Android 穿山甲广告 UTS 插件骨架。当前不会初始化或请求真实广告，原生方法会返回 `CSJ_SDK_NOT_LINKED`。

## 完成真实接入前需要

1. 在穿山甲后台确认 Android App ID、包名、签名和激励视频代码位。
2. 使用后台当前推荐的 SDK Maven 坐标填写 `utssdk/app-android/config.json` 的 `dependencies`，不要猜测或固定过期版本。
3. 按对应 SDK 文档在 `index.uts` 实现初始化、预加载、展示、完整观看和错误回调。
4. 补充 SDK 要求的 Provider、资源白名单与混淆规则。
5. 在 `src/services/ad.ts` 注册 UTS 原生桥接实现。
6. 将 `src/config/ad.ts` 的 `enabled`、App ID 和广告位 ID 替换为构建环境配置。

涉及原生依赖的修改必须制作 Android 自定义基座或云打包后验证，普通 H5 运行无法加载穿山甲 SDK。

## 回调约束

- `loadRewarded` 成功只表示广告已缓存，不能发放奖励。
- `showRewarded` 只有收到 SDK 的完整观看回调才能返回 `completed=true`。
- 客户端完成回调仍不可信，正式金币必须等待服务端交易校验。
- 同一时间只允许展示一个激励视频，展示结束后再预加载下一条。
