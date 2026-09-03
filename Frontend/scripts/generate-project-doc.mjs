/**
 * 从实际项目配置生成 PROJECT.md，确保构建产物与说明文档保持一致。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));

const appConfig = await readJson("src/config/app.json");
const packageJson = await readJson("package.json");
const pagesJson = await readJson("src/pages.json");
const pageRows = pagesJson.pages
  .map(
    (page) =>
      `| ${page.style?.navigationBarTitleText || "未命名"} | \`${page.path}\` |`,
  )
  .join("\n");

const document = `# ${appConfig.name}

> 本文档由 \`npm run generate:docs\` 自动生成，请勿直接修改生成内容。

## 项目简介

${appConfig.name} 是基于 UniApp、Vue 3 和 TypeScript 开发的多端短剧应用。首页即短剧剧场，目前具备内容浏览、搜索、福利任务、收益和用户中心等页面骨架。

## 技术栈

- UniApp ${packageJson.dependencies["@dcloudio/uni-app"]}
- Vue ${packageJson.dependencies.vue}
- TypeScript ${packageJson.devDependencies.typescript}
- uView Plus ${packageJson.dependencies["uview-plus"]}
- UnoCSS ${packageJson.devDependencies.unocss}

## 页面清单

| 页面 | 路由 |
|---|---|
${pageRows}

## 常用命令

\`\`\`powershell
npm.cmd run dev:h5       # 启动 H5 开发环境
npm.cmd run type-check   # TypeScript 类型检查
npm.cmd run build:h5     # 构建 H5，并自动刷新本文档
npm.cmd run generate:docs # 单独刷新项目说明
\`\`\`

## 配置说明

应用名称的唯一配置源为 \`src/config/app.json\`。H5 启动、构建前会自动同步应用清单、首页标题并刷新本文档。

## 当前实现边界

- 页面主要使用本地演示数据，尚未接入业务 API。
- 每日签到和搜索历史保存在设备本地。
- 播放器、登录、支付、广告和提现目前仅提供入口或状态提示。
- \`dist\` 为构建产物，不应直接修改。

## 目录结构

- \`src/pages\`：页面入口
- \`src/components/common\`：跨业务基础组件
- \`src/components/<module>\`：按业务模块组织的展示与交互组件
- \`src/composables\`：可复用响应式状态、页面生命周期和业务编排 Hook
- \`src/types\`：独立领域模型与接口契约
- \`src/services\`：数据访问层，页面不直接依赖 Mock 或存储结构
- \`src/config\`：应用级配置
- \`src/styles\`：全局及页面公共样式
- \`scripts\`：配置同步与文档生成脚本
`;

await writeFile(resolve(root, "PROJECT.md"), document, "utf8");
console.log(`项目说明已生成：PROJECT.md（${appConfig.name}）`);
