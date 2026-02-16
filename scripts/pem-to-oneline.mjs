#!/usr/bin/env node
/**
 * 把 PEM 文件（多行）转成用 \n 连接的一行，便于填入环境变量。
 * 用法：node scripts/pem-to-oneline.mjs < apiclient_key.pem
 *   或：node scripts/pem-to-oneline.mjs apiclient_key.pem
 */

import { readFileSync, existsSync } from "fs";
import { createInterface } from "readline";

async function readStdin() {
  const rl = createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n");
}

async function main() {
  const pathArg = process.argv[2];
  let raw;
  if (pathArg && existsSync(pathArg)) {
    raw = readFileSync(pathArg, "utf8");
  } else if (pathArg) {
    console.error("文件不存在:", pathArg);
    process.exit(1);
  } else if (!process.stdin.isTTY) {
    raw = await readStdin();
  } else {
    console.error("用法: node scripts/pem-to-oneline.mjs < apiclient_key.pem");
    console.error("  或: node scripts/pem-to-oneline.mjs apiclient_key.pem");
    process.exit(1);
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    console.error("输入为空");
    process.exit(1);
  }
  const oneline = trimmed.split(/\r?\n/).join("\\n");
  console.log(oneline);
}

main();
