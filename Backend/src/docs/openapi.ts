/**
 * 项目 OpenAPI 单一事实源。
 * 每个 path 都明确声明用途、认证要求、输入参数和主要响应，新增路由时必须同步补充。
 */
const bearer = [{ bearerAuth: [] }];
const idParameter = (name: string, description: string) => [{ in: "path", name, required: true, description, schema: { type: "string", pattern: "^[1-9]\\d*$" } }];
const pageParameters = [
  { in: "query", name: "page", description: "页码，从 1 开始", schema: { type: "integer", minimum: 1, default: 1 } },
  { in: "query", name: "pageSize", description: "每页数量，最大 100", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
];
const ok = (description = "请求成功") => ({ "200": { description }, "400": { description: "参数校验失败" }, "401": { description: "未登录或令牌失效" }, "403": { description: "权限不足" } });
const jsonBody = (properties: Record<string, unknown>, required: string[]) => ({ required: true, content: { "application/json": { schema: { type: "object", properties, required } } } });

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "幻悦短剧 API",
    version: "1.0.0",
    description: "Express + Prisma + MySQL 后端接口。统一响应为 `{ code, message, data, requestId }`，BigInt 字段以字符串返回。",
  },
  servers: [{ url: "/api/v1", description: "当前服务" }],
  tags: [
    { name: "认证", description: "注册、登录和当前用户" },
    { name: "短剧", description: "App 公开内容" },
    { name: "用户资料库", description: "收藏和观看历史" },
    { name: "奖励中心", description: "邀请码和每日签到" },
    { name: "提现", description: "用户提现申请与记录" },
    { name: "运营配置", description: "App 启动配置、协议和版本检查" },
    { name: "后台-运营", description: "运营内容、素材与发布管理" },
    { name: "反馈风控", description: "反馈、举报及风险处置" },
    { name: "后台-用户", description: "用户与金币账户" },
    { name: "资金对账", description: "余额一致性检查与差异记录" },
    { name: "后台-奖励", description: "奖励配置及运营记录" },
    { name: "后台-权限", description: "管理员 RBAC 与审计" },
  ],
  paths: {
    "/auth/register": { post: { tags: ["认证"], summary: "用户注册", description: "邀请码为必填项；验证邀请人后创建用户、绑定邀请关系并发放注册奖励。", requestBody: jsonBody({ phone: { type: "string", example: "13800138000" }, password: { type: "string", minLength: 8 }, nickname: { type: "string" }, inviteCode: { type: "string", pattern: "^[A-Z0-9]{6,12}$" } }, ["phone", "password", "nickname", "inviteCode"]), responses: { ...ok("注册成功"), "201": { description: "注册成功并返回访问令牌" }, "404": { description: "邀请码不存在" } } } },
    "/auth/login": { post: { tags: ["认证"], summary: "账号密码登录", description: "App 使用手机号；中后台可使用管理员账号。", requestBody: jsonBody({ phone: { type: "string", example: "admin" }, password: { type: "string", example: "123456" } }, ["phone", "password"]), responses: ok("返回访问令牌、刷新令牌和用户信息") } },
    "/auth/refresh": { post: { tags:["认证"],summary:"轮换刷新令牌",description:"刷新令牌仅可使用一次，成功后返回一组新令牌。受接口限流保护。",requestBody:jsonBody({refreshToken:{type:"string"}},["refreshToken"]),responses:ok() } },
    "/auth/logout": { post: { tags:["认证"],summary:"退出登录",description:"撤销指定刷新令牌，重复调用保持幂等。",requestBody:jsonBody({refreshToken:{type:"string"}},["refreshToken"]),responses:ok() } },
    "/auth/password": { put: { tags:["认证"],summary:"修改当前密码",description:"验证旧密码并更新密码，同时撤销账号全部刷新令牌。",security:bearer,requestBody:jsonBody({oldPassword:{type:"string"},newPassword:{type:"string",minLength:8}},["oldPassword","newPassword"]),responses:ok() } },
    "/auth/me": {
      get: { tags: ["认证"], summary: "获取当前用户资料", description: "根据 Bearer Token 返回安全字段，不包含密码摘要。", security: bearer, responses: ok() },
      put: { tags: ["认证"], summary: "更新当前用户资料", description: "更新昵称、性别、生日和个人简介。", security: bearer, requestBody: jsonBody({ nickname: { type: "string", maxLength: 50 }, gender: { type: "string", enum: ["unknown", "male", "female"] }, birthday: { type: "string", format: "date" }, bio: { type: "string", maxLength: 500 } }, ["nickname"]), responses: ok("资料保存成功") },
    },
    "/auth/avatar": { post: { tags: ["认证"], summary: "上传当前用户头像", description: "上传 JPEG、PNG、WebP 或 GIF，单文件最大 5MB，并立即绑定当前用户。", security: bearer, requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } } } }, responses: { ...ok(), "201": { description: "头像上传成功" } } } },

    "/content/dramas": { get: { tags: ["短剧"], summary: "短剧列表", description: "分页查询已发布短剧，可按分类和关键词筛选。", parameters: [...pageParameters, { in: "query", name: "category", description: "短剧分类", schema: { type: "string" } }, { in: "query", name: "keyword", description: "标题关键词", schema: { type: "string" } }], responses: ok() } },
    "/content/dramas/{id}": { get: { tags: ["短剧"], summary: "短剧详情", description: "获取已发布短剧及其可播放剧集。", parameters: idParameter("id", "短剧 ID"), responses: ok() } },

    "/library/favorites": { get: { tags: ["用户资料库"], summary: "收藏列表", description: "返回当前用户收藏的短剧。", security: bearer, responses: ok() } },
    "/library/favorites/{dramaId}": {
      put: { tags: ["用户资料库"], summary: "收藏短剧", description: "幂等添加收藏。", security: bearer, parameters: idParameter("dramaId", "短剧 ID"), responses: ok() },
      delete: { tags: ["用户资料库"], summary: "取消收藏", description: "幂等移除收藏。", security: bearer, parameters: idParameter("dramaId", "短剧 ID"), responses: ok() },
    },
    "/library/history": { get: { tags: ["用户资料库"], summary: "观看历史", description: "返回当前用户最近的观看进度。", security: bearer, responses: ok() } },
    "/library/history/{dramaId}": { put: { tags: ["用户资料库"], summary: "保存观看进度", description: "按用户和短剧覆盖保存最后观看剧集与秒数。", security: bearer, parameters: idParameter("dramaId", "短剧 ID"), requestBody: jsonBody({ episodeId: { type: "string" }, positionSeconds: { type: "integer", minimum: 0 } }, ["episodeId", "positionSeconds"]), responses: ok() } },

    "/rewards/center": { get: { tags: ["奖励中心"], summary: "奖励中心概览", description: "返回个人邀请码、邀请数量、签到状态、连续天数、签到日历和奖励规则。", security: bearer, responses: ok() } },
    "/rewards/ledgers": { get: { tags: ["奖励中心"], summary: "我的金币流水", description: "分页返回当前用户自己的金币增减明细。", security: bearer, parameters: pageParameters, responses: ok() } },
    "/rewards/invite/bind": { post: { tags: ["奖励中心"], summary: "绑定邀请码", description: "每个用户只能绑定一次，成功后事务化发放直推和二级奖励。", security: bearer, requestBody: jsonBody({ inviteCode: { type: "string", minLength: 6, maxLength: 12 } }, ["inviteCode"]), responses: { ...ok(), "201": { description: "绑定成功" }, "409": { description: "已绑定或不能绑定自己" } } } },
    "/rewards/invite-code": { put: { tags: ["奖励中心"], summary: "修改个人邀请码", description: "邀请码自动转为大写且全局唯一；历史邀请关系及已发放奖励不受影响。", security: bearer, requestBody: jsonBody({ inviteCode: { type: "string", pattern: "^[A-Z0-9]{6,12}$", example: "HUANYUE8" } }, ["inviteCode"]), responses: { ...ok("修改成功"), "409": { description: "邀请码已被使用" } } } },
    "/rewards/check-ins": { post: { tags: ["奖励中心"], summary: "每日签到", description: "按北京时间自然日签到，记录连续天数并根据 7 天循环规则发放金币。", security: bearer, responses: { ...ok(), "201": { description: "签到成功" }, "409": { description: "今天已经签到" } } } },

    "/withdrawals/config": { get: { tags: ["提现"], summary: "提现规则", description: "返回开关、金币兑换比例、单次与每日限额及手续费。", security: bearer, responses: ok() } },
    "/withdrawals": { post: { tags: ["提现"], summary: "申请提现", description: "使用 requestId 幂等创建订单，将可用金币转为冻结金币；收款信息加密保存。", security: bearer, requestBody: jsonBody({ requestId: { type: "string", minLength: 8 }, coins: { type: "string", description: "提现金币正整数" }, channel: { type: "string", enum: ["ALIPAY", "WECHAT", "BANK"] }, account: { type: "string" }, realName: { type: "string" } }, ["requestId", "coins", "channel", "account", "realName"]), responses: { ...ok(), "201": { description: "申请成功" }, "409": { description: "余额不足或提现关闭" }, "429": { description: "超过每日限额" } } } },
    "/withdrawals/mine": { get: { tags: ["提现"], summary: "我的提现记录", description: "分页返回当前用户的提现状态和脱敏收款账号。", security: bearer, parameters: [...pageParameters, { in: "query", name: "status", schema: { type: "string", enum: ["PENDING", "PAYING", "COMPLETED", "REJECTED", "FAILED"] } }], responses: ok() } },
    "/operations/bootstrap": { get: { tags: ["运营配置"], summary: "App 启动配置", description: "聚合返回当前有效的首页轮播、推荐位、启动弹窗、公告、基础参数和功能开关。", responses: ok() } },
    "/operations/documents/{code}": { get: { tags: ["运营配置"], summary: "最新发布文档", description: "按稳定编码获取用户协议、隐私政策或帮助文档的最新发布版本。", parameters: [{ in: "path", name: "code", required: true, schema: { type: "string", example: "USER_AGREEMENT" } }], responses: ok() } },
    "/operations/version-check": { get: { tags: ["运营配置"], summary: "App 版本检查", description: "根据平台、当前版本号和设备稳定灰度分桶，返回升级及强制更新信息。", parameters: [{ in: "query", name: "platform", required: true, schema: { type: "string", enum: ["ANDROID", "IOS"] } }, { in: "query", name: "versionCode", required: true, schema: { type: "integer" } }, { in: "query", name: "deviceId", required: true, schema: { type: "string" } }], responses: ok() } },
    "/safety/feedback": { post: { tags:["反馈风控"],summary:"提交反馈",description:"登录用户提交问题、联系方式和最多 9 张图片。",security:bearer,requestBody:jsonBody({type:{type:"string"},content:{type:"string"},contact:{type:"string"},imageUrls:{type:"array",items:{type:"string"}}},["type","content"]),responses:{...ok(),"201":{description:"提交成功"}} } },
    "/safety/feedback/mine": { get: { tags:["反馈风控"],summary:"我的反馈",description:"查看当前用户反馈状态和官方回复。",security:bearer,responses:ok() } },
    "/safety/device-risk-assessments": { post: { tags:["反馈风控"],summary:"提交设备环境检测",description:"十项检测各 10 分，由服务端重新评分；低于 60 分自动封号、撤销刷新令牌并生成风险事件。",security:bearer,requestBody:jsonBody({deviceId:{type:"string"},simPresent:{type:"boolean"},wechatInstalled:{type:"boolean"},douyinInstalled:{type:"boolean"},alipayInstalled:{type:"boolean"},emulatorDetected:{type:"boolean"},cloudDeviceDetected:{type:"boolean"},scriptDetected:{type:"boolean"},networkRiskDetected:{type:"boolean"},ipRiskDetected:{type:"boolean"}},["deviceId","simPresent","wechatInstalled","douyinInstalled","alipayInstalled","emulatorDetected","cloudDeviceDetected","scriptDetected","networkRiskDetected","ipRiskDetected"]),responses:{...ok(),"201":{description:"评分完成"}} } },
    "/safety/reports": { post: { tags:["反馈风控"],summary:"提交举报",description:"举报内容、广告或用户行为并提交证据。",security:bearer,requestBody:jsonBody({type:{type:"string"},targetType:{type:"string"},targetId:{type:"string"},content:{type:"string"},evidenceUrls:{type:"array",items:{type:"string"}}},["type","targetType","content"]),responses:{...ok(),"201":{description:"提交成功"}} } },

    "/admin/access-codes": { get: { tags: ["后台-权限"], summary: "当前管理员权限码", description: "Vben 登录后用于控制菜单和按钮显隐。", security: bearer, responses: ok() } },
    "/admin/dashboard": { get: { tags: ["后台-用户"], summary: "运营看板", description: "返回用户、短剧、反馈、金币以及待处理对账异常和最近对账状态。需要 dashboard:read。", security: bearer, responses: ok() } },
    "/admin/users": {
      get: { tags: ["后台-用户"], summary: "用户列表", description: "分页查询用户，可按手机号或昵称搜索。需要 user:read。", security: bearer, parameters: [...pageParameters, { in: "query", name: "keyword", description: "手机号或昵称关键词", schema: { type: "string" } }], responses: ok() },
      post: { tags: ["后台-用户"], summary: "创建一级代理", description: "管理员直接创建一级代理账号，无需填写上级邀请码；自动生成该代理自己的邀请码并记录审计日志。需要 user:update 和二次密码验证。", security: bearer, requestBody: jsonBody({ phone: { type: "string", pattern: "^1\\d{10}$" }, nickname: { type: "string", maxLength: 50 }, password: { type: "string", minLength: 8, maxLength: 72 } }, ["phone", "nickname", "password"]), responses: { ...ok(), "201": { description: "一级代理创建成功" }, "409": { description: "手机号已存在" } } },
    },
    "/admin/users/{id}": { get: { tags: ["后台-用户"], summary: "用户详情", description: "返回用户安全字段、角色和业务统计。需要 user:read。", security: bearer, parameters: idParameter("id", "用户 ID"), responses: ok() } },
    "/admin/users/{id}/status": { patch: { tags: ["后台-用户"], summary: "修改用户状态", description: "启用或禁用用户并写入审计日志。需要 user:update。", security: bearer, parameters: idParameter("id", "用户 ID"), requestBody: jsonBody({ status: { type: "string", enum: ["ACTIVE", "DISABLED"] } }, ["status"]), responses: ok() } },
    "/admin/users/{id}/ad-share-rate": { put: { tags: ["后台-用户"], summary: "配置用户广告分成", description: "设置用户独立万分比；传 null 恢复继承全局比例。需要 user:update 和二次密码验证。", security: bearer, parameters: idParameter("id", "用户 ID"), requestBody: jsonBody({ shareRateBps: { type: "integer", minimum: 0, maximum: 10000, nullable: true } }, ["shareRateBps"]), responses: ok() } },
    "/admin/users/{id}/coin-adjustments": { post: { tags: ["后台-用户"], summary: "人工调整金币", description: "事务化调整余额并生成不可变流水和审计记录，余额不能为负。需要 coin:adjust。", security: bearer, parameters: idParameter("id", "用户 ID"), requestBody: jsonBody({ amount: { type: "string", description: "非零整数；负数表示扣减" }, reason: { type: "string", minLength: 2 } }, ["amount", "reason"]), responses: { ...ok(), "201": { description: "调整成功" }, "409": { description: "余额不足" } } } },
    "/admin/coin-ledgers": { get: { tags: ["后台-用户"], summary: "金币流水", description: "分页查询不可变金币流水。需要 coin:read。", security: bearer, parameters: [...pageParameters, { in: "query", name: "userId", description: "可选用户 ID", schema: { type: "string" } }], responses: ok() } },
    "/admin/withdrawals": { get: { tags: ["后台-用户"], summary: "提现订单", description: "分页按状态、手机号或昵称筛选提现订单。需要 withdrawal:read。", security: bearer, parameters: [...pageParameters, { in: "query", name: "status", schema: { type: "string", enum: ["PENDING", "PAYING", "COMPLETED", "REJECTED", "FAILED"] } }, { in: "query", name: "keyword", schema: { type: "string" } }], responses: ok() } },
    "/admin/withdrawals/{id}": { get: { tags: ["后台-用户"], summary: "提现敏感详情", description: "解密返回实名和收款账号，每次访问均写入审计日志。需要 withdrawal:review。", security: bearer, parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], responses: ok() } },
    "/admin/withdrawals/{id}/review": { post: { tags: ["后台-用户"], summary: "审核提现", description: "PENDING 只能进入 PAYING 或 REJECTED；拒绝时自动退回冻结金币。需要 withdrawal:review。", security: bearer, parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], requestBody: jsonBody({ approved: { type: "boolean" }, remark: { type: "string", minLength: 2 } }, ["approved", "remark"]), responses: ok() } },
    "/admin/withdrawals/{id}/complete": { post: { tags: ["后台-用户"], summary: "确认打款结果", description: "PAYING 只能进入 COMPLETED 或 FAILED；失败时自动退回冻结金币。需要 withdrawal:review。", security: bearer, parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }], requestBody: jsonBody({ success: { type: "boolean" }, remark: { type: "string", minLength: 2 }, paymentReference: { type: "string" } }, ["success", "remark"]), responses: ok() } },
    "/admin/withdrawal-config": {
      get: { tags: ["后台-用户"], summary: "后台提现规则", description: "获取完整提现配置。需要 withdrawal:read。", security: bearer, responses: ok() },
      put: { tags: ["后台-用户"], summary: "更新提现规则", description: "更新兑换比例、限额、手续费和开关并写入审计。需要 withdrawal:config。", security: bearer, requestBody: jsonBody({ enabled: { type: "boolean" }, coinsPerCent: { type: "integer" }, minCoins: { type: "string" }, maxCoins: { type: "string" }, dailyCountLimit: { type: "integer" }, dailyCoinLimit: { type: "string" }, feeRateBps: { type: "integer", minimum: 0, maximum: 10000 } }, ["enabled", "coinsPerCent", "minCoins", "maxCoins", "dailyCountLimit", "dailyCoinLimit", "feeRateBps"]), responses: ok() },
    },
    "/admin/finance-dashboard": { get: { tags: ["资金对账"], summary: "财务提现看板", description: "统计今日申请、各状态金额、24 小时超时订单和异常批次。需要 withdrawal:read。", security: bearer, responses: ok() } },
    "/admin/withdrawal-batches": {
      get: { tags: ["资金对账"], summary: "打款批次列表", description: "返回最近 100 个批次和订单处理结果。需要 withdrawal:batch:read。", security: bearer, responses: ok() },
      post: { tags: ["资金对账"], summary: "创建打款批次", description: "将打款中订单原子加入唯一批次，requestId 防止重复创建；要求 X-Confirm-Password 二次验证。", security: bearer, parameters: [{ in: "header", name: "X-Confirm-Password", required: true, schema: { type: "string", format: "password" } }], requestBody: jsonBody({ requestId: { type: "string" }, withdrawalIds: { type: "array", items: { type: "string", format: "uuid" } }, remark: { type: "string" } }, ["requestId", "withdrawalIds"]), responses: { ...ok(), "201": { description: "批次创建成功" } } },
    },
    "/admin/withdrawal-batches/{id}/export": { get: { tags: ["资金对账"], summary: "导出批次 CSV", description: "解密并导出完整收款信息，同时写敏感操作审计；要求导出权限和二次密码。", security: bearer, parameters: [...idParameter("id", "批次 ID"), { in: "header", name: "X-Confirm-Password", required: true, schema: { type: "string", format: "password" } }], responses: { "200": { description: "UTF-8 BOM CSV 文件", content: { "text/csv": { schema: { type: "string", format: "binary" } } } }, "403": { description: "权限或二次验证失败" } } } },
    "/admin/withdrawal-batches/{id}/close": { post: { tags: ["资金对账"], summary: "关闭打款批次", description: "仅允许关闭尚未确认结果的批次，释放订单以便重新组批；要求二次密码。", security: bearer, parameters: [...idParameter("id", "批次 ID"), { in: "header", name: "X-Confirm-Password", required: true, schema: { type: "string", format: "password" } }], responses: ok() } },
    "/admin/withdrawal-batches/{id}/results/preview": { post: { tags: ["资金对账"], summary: "预检批次结果", description: "逐行验证订单归属、状态、重复项和结果字段，不修改数据库。", security: bearer, parameters: idParameter("id", "批次 ID"), responses: ok() } },
    "/admin/withdrawal-batches/{id}/results/confirm": { post: { tags: ["资金对账"], summary: "确认批次结果", description: "在串行化事务中更新订单、冻结金币和失败退款；requestId 保证重复请求幂等，并要求二次密码。", security: bearer, parameters: [...idParameter("id", "批次 ID"), { in: "header", name: "X-Confirm-Password", required: true, schema: { type: "string", format: "password" } }], responses: ok() } },
    "/admin/uploads/images": { post: { tags: ["后台-运营"], summary: "上传运营图片", description: "上传 JPEG、PNG、WebP 或 GIF，单文件最大 5MB。需要 upload:create。", security: bearer, requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } } } }, responses: { ...ok(), "201": { description: "上传成功，返回资产和 URL" } } } },
    "/admin/operation-slots": {
      get: { tags: ["后台-运营"], summary: "运营位列表", description: "获取轮播、推荐位和启动弹窗。需要 operation:read。", security: bearer, responses: ok() },
      post: { tags: ["后台-运营"], summary: "创建运营位", description: "创建展示位置、图片、跳转、排序和有效期配置。需要 operation:update。", security: bearer, requestBody: jsonBody({ placement: { type: "string", enum: ["HOME_BANNER", "HOME_RECOMMEND", "STARTUP_POPUP"] }, title: { type: "string" }, imageUrl: { type: "string" }, targetType: { type: "string", enum: ["NONE", "DRAMA", "INTERNAL", "EXTERNAL"] }, targetValue: { type: "string", nullable: true }, sort: { type: "integer" }, enabled: { type: "boolean" } }, ["placement", "title", "imageUrl", "targetType", "sort", "enabled"]), responses: { ...ok(), "201": { description: "创建成功" } } },
    },
    "/admin/operation-slots/{id}": {
      put: { tags: ["后台-运营"], summary: "更新运营位", description: "更新完整运营位配置。需要 operation:update。", security: bearer, parameters: idParameter("id", "运营位 ID"), responses: ok() },
      delete: { tags: ["后台-运营"], summary: "删除运营位", description: "永久删除指定运营位。需要 operation:update。", security: bearer, parameters: idParameter("id", "运营位 ID"), responses: ok() },
    },
    "/admin/announcements": {
      get: { tags: ["后台-运营"], summary: "公告列表", description: "获取草稿、已发布和已下线公告。需要 operation:read。", security: bearer, responses: ok() },
      post: { tags: ["后台-运营"], summary: "创建公告", description: "创建公告内容和发布状态。需要 operation:update。", security: bearer, requestBody: jsonBody({ title: { type: "string" }, content: { type: "string" }, status: { type: "string", enum: ["DRAFT", "PUBLISHED", "OFFLINE"] } }, ["title", "content", "status"]), responses: { ...ok(), "201": { description: "创建成功" } } },
    },
    "/admin/announcements/{id}": {
      put: { tags: ["后台-运营"], summary: "更新公告", description: "更新公告内容、状态和有效期。需要 operation:update。", security: bearer, parameters: idParameter("id", "公告 ID"), responses: ok() },
      delete: { tags: ["后台-运营"], summary: "删除公告", description: "永久删除指定公告。需要 operation:update。", security: bearer, parameters: idParameter("id", "公告 ID"), responses: ok() },
    },
    "/admin/system-configs": { get: { tags: ["后台-运营"], summary: "系统参数列表", description: "获取 App 基础参数和功能开关。需要 operation:read。", security: bearer, responses: ok() } },
    "/admin/system-configs/{key}": { put: { tags: ["后台-运营"], summary: "更新系统参数", description: "使用 JSON 更新配置值并审计。需要 operation:update。", security: bearer, parameters: [{ in: "path", name: "key", required: true, schema: { type: "string" } }], requestBody: jsonBody({ value: {}, description: { type: "string", nullable: true } }, ["value"]), responses: ok() } },
    "/admin/app-documents": {
      get: { tags: ["后台-运营"], summary: "协议文档列表", description: "获取协议和帮助文档的所有版本。需要 operation:read。", security: bearer, responses: ok() },
      post: { tags: ["后台-运营"], summary: "创建文档版本", description: "按编码和版本创建协议或帮助文档。需要 operation:update。", security: bearer, requestBody: jsonBody({ code: { type: "string" }, title: { type: "string" }, version: { type: "string" }, content: { type: "string" }, status: { type: "string", enum: ["DRAFT", "PUBLISHED", "OFFLINE"] } }, ["code", "title", "version", "content", "status"]), responses: { ...ok(), "201": { description: "创建成功" } } },
    },
    "/admin/app-documents/{id}": { put: { tags: ["后台-运营"], summary: "更新协议文档", description: "更新内容和发布状态。需要 operation:update。", security: bearer, parameters: idParameter("id", "文档 ID"), responses: ok() } },
    "/admin/app-versions": {
      get: { tags: ["后台-运营"], summary: "App 版本列表", description: "获取 Android/iOS 版本策略。需要 operation:read。", security: bearer, responses: ok() },
      post: { tags: ["后台-运营"], summary: "创建 App 版本", description: "创建更新说明、下载地址、最低版本和灰度比例。需要 operation:update。", security: bearer, requestBody: jsonBody({ platform: { type: "string", enum: ["ANDROID", "IOS"] }, versionName: { type: "string" }, versionCode: { type: "integer" }, minVersionCode: { type: "integer" }, downloadUrl: { type: "string" }, releaseNotes: { type: "string" }, enabled: { type: "boolean" }, rolloutPercent: { type: "integer" } }, ["platform", "versionName", "versionCode", "minVersionCode", "downloadUrl", "releaseNotes", "enabled", "rolloutPercent"]), responses: { ...ok(), "201": { description: "创建成功" } } },
    },
    "/admin/app-versions/{id}": { put: { tags: ["后台-运营"], summary: "更新 App 版本", description: "更新发布、强制升级和灰度策略。需要 operation:update。", security: bearer, parameters: idParameter("id", "版本 ID"), responses: ok() } },
    "/admin/feedback": { get:{tags:["反馈风控"],summary:"反馈工单列表",description:"分页查询反馈工单。需要 feedback:read。",security:bearer,parameters:pageParameters,responses:ok()} },
    "/admin/feedback/{id}": { put:{tags:["反馈风控"],summary:"处理反馈工单",description:"回复、内部备注并流转处理中、已解决或关闭。需要 feedback:update。",security:bearer,parameters:idParameter("id","反馈 ID"),responses:ok()} },
    "/admin/reports": { get:{tags:["反馈风控"],summary:"举报列表",description:"分页查询用户举报。需要 report:read。",security:bearer,parameters:pageParameters,responses:ok()} },
    "/admin/reports/{id}": { put:{tags:["反馈风控"],summary:"处理举报",description:"判定有效或无效并记录处置。需要 report:update。",security:bearer,parameters:idParameter("id","举报 ID"),responses:ok()} },
    "/admin/risk-events": { get:{tags:["反馈风控"],summary:"风险事件列表",description:"分页查询规则命中的风险事件。需要 risk:read。",security:bearer,parameters:pageParameters,responses:ok()} },
    "/admin/device-risk-assessments": { get:{tags:["反馈风控"],summary:"设备环境评分列表",description:"分页查看十项检测结果、评分、IP、位置距离及自动封号状态。需要 risk:read。",security:bearer,parameters:pageParameters,responses:ok()} },
    "/admin/risk-events/{id}": { put:{tags:["反馈风控"],summary:"处理风险事件",description:"确认或忽略风险事件并记录处理人。需要 risk:update。",security:bearer,parameters:idParameter("id","风险事件 ID"),responses:ok()} },
    "/admin/users/{id}/risk": { put:{tags:["反馈风控"],summary:"更新用户风险状态",description:"设置观察、奖励限制、提现限制、冻结或封禁并审计。需要 risk:update。",security:bearer,parameters:idParameter("id","用户 ID"),responses:ok()} },
    "/admin/users/{id}/security": { get:{tags:["反馈风控"],summary:"用户安全记录",description:"查看最近登录、设备及风险事件。需要 risk:read。",security:bearer,parameters:idParameter("id","用户 ID"),responses:ok()} },
    "/admin/reconciliation-runs": {
      get: { tags: ["资金对账"], summary: "资金对账记录", description: "返回最近 50 次对账任务及差异明细。需要 reconciliation:read。", security: bearer, responses: ok() },
      post: { tags: ["资金对账"], summary: "立即执行资金对账", description: "比较可用金币与金币流水汇总、冻结金币与处理中提现汇总；只记录差异和风险事件，不自动修改余额。需要 reconciliation:run。", security: bearer, responses: { ...ok(), "201": { description: "对账完成" }, "409": { description: "已有对账任务执行中" } } },
    },
    "/admin/reconciliation-schedule": {
      get: { tags: ["资金对账"], summary: "自动对账配置", description: "获取自动对账开关与上海时区的每日执行时间。需要 reconciliation:read。", security: bearer, responses: ok() },
      put: { tags: ["资金对账"], summary: "更新自动对账配置", description: "更新时间后无需重启服务，并记录审计日志。需要 reconciliation:run。", security: bearer, requestBody: jsonBody({ enabled: { type: "boolean" }, hour: { type: "integer", minimum: 0, maximum: 23 }, minute: { type: "integer", minimum: 0, maximum: 59 }, timezone: { type: "string", enum: ["Asia/Shanghai"] } }, ["enabled", "hour", "minute", "timezone"]), responses: ok() },
    },

    "/admin/reward-rules": { get: { tags: ["后台-奖励"], summary: "奖励规则列表", description: "获取注册、邀请和签到奖励配置。需要 reward:read。", security: bearer, responses: ok() } },
    "/admin/ad-reward-config": {
      get: { tags: ["后台-奖励"], summary: "获取全局广告分成", description: "返回观看用户、直推和间推三个广告分成万分比。", security: bearer, responses: ok() },
      put: { tags: ["后台-奖励"], summary: "更新全局广告分成", description: "先按用户比例计算基础收益，再从基础收益拆分直推和间推返佣；两项返佣合计不得超过 100%。需要 reward:update 和二次密码验证。", security: bearer, requestBody: jsonBody({ defaultShareRateBps: { type: "integer", minimum: 0, maximum: 10000 }, directShareRateBps: { type: "integer", minimum: 0, maximum: 10000 }, indirectShareRateBps: { type: "integer", minimum: 0, maximum: 10000 } }, ["defaultShareRateBps", "directShareRateBps", "indirectShareRateBps"]), responses: ok() },
    },
    "/admin/ad-reward-settlements": {
      get: { tags: ["后台-奖励"], summary: "广告收益结算记录", description: "分页查看广告收入、观看者净收益以及直推和间推返佣快照。需要 reward:read。", security: bearer, parameters: pageParameters, responses: ok() },
      post: { tags: ["后台-奖励"], summary: "结算单次广告收入", description: "计算观看者基础收益，扣除并向直属及隔级上级返佣，剩余部分归观看者；requestId 保证幂等。", security: bearer, requestBody: jsonBody({ requestId: { type: "string" }, userId: { type: "string" }, revenueYuan: { type: "string", example: "0.012345" }, source: { type: "string", example: "PANGLE" } }, ["requestId", "userId", "revenueYuan"]), responses: { ...ok(), "201": { description: "结算成功" } } },
    },
    "/admin/ad-reward-dashboard": { get: { tags: ["后台-奖励"], summary: "广告收益看板", description: "汇总广告收入、用户净收益、两级返佣和平台留存金币等值。需要 reward:read。", security: bearer, responses: ok() } },
    "/admin/ad-callback-logs": { get: { tags: ["后台-奖励"], summary: "广告回调日志", description: "分页查看回调成功、失败和处理中状态。需要 reward:read。", security: bearer, parameters: pageParameters, responses: ok() } },
    "/admin/users/{id}/team": { get: { tags: ["后台-用户"], summary: "用户两级邀请团队", description: "查询相对指定用户的直推、间推成员及返佣贡献。需要 user:read。", security: bearer, parameters: idParameter("id", "用户 ID"), responses: ok() } },
    "/webhooks/pangle/ad-revenue": { post: { tags: ["平台回调"], summary: "穿山甲广告收入回调", description: "使用 X-Pangle-Timestamp、X-Pangle-Nonce、X-Pangle-Signature 请求头进行 HMAC-SHA256 验签，eventId 保证幂等。正式接入时需按平台文档调整字段映射和签名规范。", requestBody: jsonBody({ eventId: { type: "string" }, userId: { type: "string" }, revenueYuan: { type: "string" }, source: { type: "string" } }, ["eventId", "userId", "revenueYuan"]), responses: ok() } },
    "/admin/reward-rules/{code}": { put: { tags: ["后台-奖励"], summary: "更新奖励规则", description: "修改奖励金币和启用状态并记录审计日志。需要 reward:update。", security: bearer, parameters: [{ in: "path", name: "code", required: true, description: "奖励规则编码", schema: { type: "string", example: "SIGNIN_DAY_1" } }], requestBody: jsonBody({ amount: { type: "string", description: "非负整数" }, enabled: { type: "boolean" } }, ["amount", "enabled"]), responses: ok() } },
    "/admin/invite-relations": { get: { tags: ["后台-奖励"], summary: "邀请记录", description: "分页查看邀请人与受邀用户关系。需要 reward:read。", security: bearer, parameters: pageParameters, responses: ok() } },
    "/admin/check-ins": { get: { tags: ["后台-奖励"], summary: "签到记录", description: "分页查看用户签到日期、连续天数和实际奖励。需要 reward:read。", security: bearer, parameters: pageParameters, responses: ok() } },

    "/admin/permissions": { get: { tags: ["后台-权限"], summary: "权限列表", description: "获取全部细粒度权限点。需要 rbac:read。", security: bearer, responses: ok() } },
    "/admin/roles": { get: { tags: ["后台-权限"], summary: "角色列表", description: "获取角色、权限和成员数量。需要 rbac:read。", security: bearer, responses: ok() } },
    "/admin/roles/{id}/permissions": { put: { tags: ["后台-权限"], summary: "更新角色权限", description: "覆盖自定义角色权限；系统角色禁止修改。需要 rbac:update。", security: bearer, parameters: idParameter("id", "角色 ID"), requestBody: jsonBody({ permissionIds: { type: "array", items: { type: "integer" } } }, ["permissionIds"]), responses: ok() } },
    "/admin/administrators": { get: { tags: ["后台-权限"], summary: "管理员列表", description: "返回拥有任意后台角色的账号。需要 admin:read。", security: bearer, responses: ok() } },
    "/admin/audit-logs": { get: { tags: ["后台-权限"], summary: "审计日志", description: "返回最近 100 条后台敏感操作记录。需要 audit:read。", security: bearer, responses: ok() } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "登录后填写 accessToken" } },
  },
} as const;
