/**
 * 广告配置唯一入口。正式参数应由构建环境注入，不要散落在页面中。
 * SDK 未完成接入前保持 enabled=false，业务层会返回可识别的未配置错误。
 */
export const adConfig = {
  enabled: false,
  appId: "",
  debug: true,
  personalizedAds: false,
  placements: {
    rewardedTask: {
      id: "",
      rewardName: "金币",
      rewardAmount: 30,
      dailyLimit: 5,
    },
  },
} as const;
