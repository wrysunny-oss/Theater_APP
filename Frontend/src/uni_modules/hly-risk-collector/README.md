# Android 风控采集器

仅用于 Android APP 自定义基座或云打包。插件采集 SIM 是否可用、指定应用安装情况、模拟器、云手机、调试/Root/Hook 和网络代理/VPN 信号。

- 无法判断的项目必须返回 `UNKNOWN`，服务端不会因此扣分。
- IP 信誉和定位距离应由服务端或可信服务判断，不能相信客户端自行给出的结果。
- `READ_PHONE_STATE` 仅用于 SIM 状态；用户拒绝权限时 SIM 项为 `UNKNOWN`。
- APK 侧载仍需使用固定发布证书签名，并在发布前用 `apksigner verify --print-certs` 核验。
