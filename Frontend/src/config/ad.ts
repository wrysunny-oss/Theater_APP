/**
 * 广告配置唯一入口。正式参数应由构建环境注入，不要散落在页面中。
 * SDK 未完成接入前保持 enabled=false，业务层会返回可识别的未配置错误。
 */
export const adConfig = {
  enabled: true,
  appId: "5879132",
  debug: true,
  // 平台标准代码 isLimitPersonalAds=false，即允许个性化广告。
  personalizedAds: true,
  placements: {
    rewardedTask: {
      id: "104489019",
      rewardName: "金币",
      rewardAmount: 30,
      dailyLimit: 5,
    },
  },
} as const;
