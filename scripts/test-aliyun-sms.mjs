#!/usr/bin/env node
/**
 * 纯 Node.js 测试阿里云短信验证码接口（不依赖 Deno）
 * 用法: node scripts/test-aliyun-sms.mjs [手机号]
 */

import { createHmac, randomBytes } from "node:crypto";

// ─── 配置（从环境变量读取，或 apps/pwa/.env.local） ───
const ACCESS_KEY_ID = process.env.ALIYUN_SMS_ACCESS_KEY_ID;
const ACCESS_KEY_SECRET = process.env.ALIYUN_SMS_ACCESS_KEY_SECRET;
const SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME ?? "速通互联验证码";
const TEMPLATE_CODE = process.env.ALIYUN_SMS_TEMPLATE_CODE ?? "100001";
const PHONE = process.argv[2] || "18620398354";
const OTP = "123456"; // 测试用固定验证码

if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
  console.error("缺少阿里云配置。请设置 ALIYUN_SMS_ACCESS_KEY_ID 和 ALIYUN_SMS_ACCESS_KEY_SECRET");
  console.error("示例: ALIYUN_SMS_ACCESS_KEY_ID=xxx ALIYUN_SMS_ACCESS_KEY_SECRET=xxx node scripts/test-aliyun-sms.mjs");
  process.exit(1);
}

// ─── 签名工具 ───
function percentEncode(value) {
  return encodeURIComponent(value)
    .replace(/\+/g, "%2B")
    .replace(/\*/g, "%2A")
    .replace(/%7E/g, "~");
}

function generateSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const canonicalized = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");

  const stringToSign = `POST&${percentEncode("/")}&${percentEncode(canonicalized)}`;

  const hmac = createHmac("sha1", `${secret}&`);
  hmac.update(stringToSign);
  return hmac.digest("base64");
}

// ─── 构建请求 ───
const params = {
  AccessKeyId: ACCESS_KEY_ID,
  Action: "SendSmsVerifyCode",
  CodeLength: "6",
  CodeType: "1",
  CountryCode: "86",
  DuplicatePolicy: "1",
  Format: "JSON",
  Interval: "60",
  PhoneNumber: PHONE,
  RegionId: "cn-hangzhou",
  SignName: SIGN_NAME,
  SignatureMethod: "HMAC-SHA1",
  SignatureNonce: randomBytes(16).toString("hex"),
  SignatureVersion: "1.0",
  TemplateCode: TEMPLATE_CODE,
  TemplateParam: JSON.stringify({ code: OTP, min: "5" }),
  Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  ValidTime: "300",
  Version: "2017-05-25",
};

params.Signature = generateSignature(params, ACCESS_KEY_SECRET);

const body = new URLSearchParams(params).toString();

console.log("=== 阿里云短信测试 ===");
console.log(`手机号: ${PHONE}`);
console.log(`签名: ${SIGN_NAME}`);
console.log(`模版: ${TEMPLATE_CODE}`);
console.log(`OTP: ${OTP}`);
console.log("");

// ─── 发请求 ───
try {
  const response = await fetch("https://dypnsapi.aliyuncs.com/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await response.text();
  console.log("HTTP Status:", response.status);
  console.log("Raw Response:", text);

  try {
    const json = JSON.parse(text);
    console.log("\nParsed:");
    console.log("  Code:", json.Code);
    console.log("  Message:", json.Message);
    console.log("  RequestId:", json.RequestId);
    console.log("  Success:", json.Success);
    if (json.Model) {
      console.log("  Model:", JSON.stringify(json.Model));
    }
  } catch {
    console.log("(无法解析为 JSON)");
  }
} catch (err) {
  console.error("请求失败:", err.message);
}
