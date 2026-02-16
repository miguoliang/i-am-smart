#!/usr/bin/env node
/**
 * 本地快速验证 WECHAT_PAY_PRIVATE_KEY 是否可被 Node crypto 解析。
 * 用法：在项目根目录执行 node scripts/verify-wechat-pay-key.mjs
 * 会读取 .env.local 中的 WECHAT_PAY_PRIVATE_KEY（若不存在则读 process.env）。
 */

import { readFileSync, existsSync } from "fs";
import { createPrivateKey } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadKey() {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    const keyRegex = /WECHAT_PAY_PRIVATE_KEY\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)'|(\S[\s\S]*?))(?=\n[A-Z_]+=|\n*$)/;
    const match = content.match(keyRegex);
    if (match) {
      const raw = (match[1] ?? match[2] ?? match[3] ?? "").trim();
      return raw.replace(/\\n/g, "\n");
    }
  }
  const fromEnv = process.env.WECHAT_PAY_PRIVATE_KEY;
  if (fromEnv) return fromEnv.replace(/\\n/g, "\n");
  return null;
}

const key = loadKey();
if (!key) {
  console.error("未找到 WECHAT_PAY_PRIVATE_KEY。请确保 .env.local 中存在该变量，或先 export 再运行本脚本。");
  process.exit(1);
}

try {
  createPrivateKey(key);
  console.log("OK: 私钥格式正确，可被 Node crypto 解析。");
} catch (e) {
  console.error("私钥解析失败:", e.message);
  console.error("请检查 WECHAT_PAY_PRIVATE_KEY 是否为 apiclient_key.pem 的完整内容，且换行使用 \\n 或真实换行。");
  process.exit(1);
}
