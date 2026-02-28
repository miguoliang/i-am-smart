#!/usr/bin/env node
/**
 * 本地测试 Edge Function (send-sms)
 *
 * 用法:
 *   node scripts/test-edge-function.mjs           # 启动函数并发送测试请求
 *   node scripts/test-edge-function.mjs --serve   # 仅启动函数（保持运行，另开终端 curl 测试）
 *   node scripts/test-edge-function.mjs --with-sms # 从 apps/pwa/.env.local 加载阿里云配置
 *
 * 手动测试:
 *   cd apps/pwa/supabase/functions/send-sms
 *   deno run --allow-net --allow-env index.ts
 *
 *   另开终端:
 *   curl -X POST http://localhost:8000/ \
 *     -H "Content-Type: application/json" \
 *     -d '{"user":{"phone":"13800138000"},"sms":{"otp":"123456"}}'
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const serve = args.includes("--serve");
const withSms = args.includes("--with-sms");

function loadEnvLocal() {
  const path = resolve(process.cwd(), "apps/pwa/.env.local");
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function runCurlTest() {
  console.log("Sending test request to http://localhost:8000/ ...\n");
  try {
    const out = execSync(
      `curl -s -X POST http://127.0.0.1:8000/ -H "Content-Type: application/json" -d '{"user":{"phone":"13800138000"},"sms":{"otp":"123456"}}'`,
      { encoding: "utf8" }
    );
    console.log(out);
  } catch (e) {
    console.error("curl failed. Is the function running on port 8000?");
    process.exit(1);
  }
}

const env = { ...process.env };
if (withSms) Object.assign(env, loadEnvLocal());

const cwd = resolve(process.cwd(), "apps/pwa/supabase/functions/send-sms");

if (serve) {
  console.log("Starting send-sms edge function... (Ctrl+C to stop)\n");
  const proc = spawn("deno", ["run", "--allow-net", "--allow-env", "index.ts"], {
    cwd,
    env,
    stdio: "inherit",
  });
  proc.on("exit", (code) => process.exit(code ?? 0));
} else {
  (async () => {
    const proc = spawn("deno", ["run", "--allow-net", "--allow-env", "index.ts"], {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (d) => process.stdout.write(d));
    proc.stderr?.on("data", (d) => process.stderr.write(d));

    await new Promise((r) => setTimeout(r, 2000));
    if (proc.exitCode != null) {
      console.error("Function failed to start");
      process.exit(1);
    }
    runCurlTest();
    proc.kill();
  })();
}
