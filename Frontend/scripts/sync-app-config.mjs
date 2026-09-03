import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// app.json 是应用名称的唯一配置源，平台配置文件由本脚本统一维护。
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "src/config/app.json");
const manifestPath = resolve(root, "src/manifest.json");
const pagesPath = resolve(root, "src/pages.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

if (!config.name?.trim()) throw new Error("app.json 中的 name 不能为空");
if (!config.versionName?.trim()) throw new Error("app.json 中的 versionName 不能为空");

const escapedName = JSON.stringify(config.name).slice(1, -1);
// manifest.json 属于 JSONC 格式，定向替换可以保留 UniApp 原有注释。
const manifest = (await readFile(manifestPath, "utf8"))
  .replace(/("name"\s*:\s*)"[^"]*"/, `$1"${escapedName}"`)
  .replace(/("versionName"\s*:\s*)"[^"]*"/, `$1"${config.versionName}"`);
const pages = (await readFile(pagesPath, "utf8")).replace(
  /("navigationBarTitleText"\s*:\s*)"[^"]*"/,
  `$1"${escapedName}"`,
);

await Promise.all([
  writeFile(manifestPath, manifest, "utf8"),
  writeFile(pagesPath, pages, "utf8"),
]);

console.log(`应用名称已同步：${config.name}`);
