/**
 * 支付宝支付 - PC网站支付 & 手机网站支付
 * 仅服务端使用，依赖 ALIPAY_* 环境变量
 */

import { createSign, createVerify } from "crypto";

// 支付宝网关地址
// 正式环境: https://openapi.alipay.com/gateway.do
// 沙箱环境: https://openapi.alipaydev.com/gateway.do
function getAlipayGateway(): string {
  return (
    process.env.ALIPAY_GATEWAY ||
    (process.env.NODE_ENV === "production"
      ? "https://openapi.alipay.com/gateway.do"
      : "https://openapi.alipaydev.com/gateway.do")
  );
}

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
}

export interface CreatePagePayParams {
  outTradeNo: string;
  totalAmount: string; // 单位：元，精确到小数点后两位
  subject: string;
  returnUrl: string;
  notifyUrl: string;
  body?: string;
}

export interface CreateWapPayParams {
  outTradeNo: string;
  totalAmount: string;
  subject: string;
  returnUrl: string;
  notifyUrl: string;
  quitUrl: string; // 用户取消支付后跳转的地址
  body?: string;
}

export interface AlipayNotifyParams {
  [key: string]: string | undefined;
  notify_time?: string;
  notify_type?: string;
  notify_id?: string;
  app_id?: string;
  charset?: string;
  version?: string;
  sign_type?: string;
  sign?: string;
  trade_no?: string;
  out_trade_no?: string;
  trade_status?: string;
  total_amount?: string;
  buyer_id?: string;
  seller_id?: string;
  gmt_payment?: string;
}

function normalizeKey(key: string, isPrivateKey: boolean): string {
  if (!key) return key;
  
  // 移除所有空白字符和换行符，获取纯 Base64 内容
  const base64Content = key.trim().replace(/\\n/g, "").replace(/\s+/g, "");
  
  // 如果密钥没有 BEGIN/END 标记，说明是支付宝密钥生成工具生成的纯 Base64 格式
  if (!base64Content.includes("BEGIN")) {
    // 将 Base64 字符串按每 64 字符换行（PEM 格式标准）
    const wrappedBase64 = base64Content.match(/.{1,64}/g)?.join("\n") || base64Content;
    
    // 根据密钥类型添加相应的 PEM 标记
    if (isPrivateKey) {
      return `-----BEGIN RSA PRIVATE KEY-----\n${wrappedBase64}\n-----END RSA PRIVATE KEY-----\n`;
    } else {
      return `-----BEGIN PUBLIC KEY-----\n${wrappedBase64}\n-----END PUBLIC KEY-----\n`;
    }
  }
  
  // 如果已有 BEGIN/END 标记，只处理换行符
  let normalized = key.replace(/\\n/g, "\n");
  
  // 确保以换行符结尾
  if (!normalized.endsWith("\n")) {
    normalized += "\n";
  }
  
  return normalized;
}

function getConfig(): AlipayConfig {
  const appId = process.env.ALIPAY_APP_ID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

  if (!appId) throw new Error("ALIPAY_APP_ID is not set");
  if (!privateKey) throw new Error("ALIPAY_PRIVATE_KEY is not set");
  if (!alipayPublicKey) throw new Error("ALIPAY_PUBLIC_KEY is not set");

  // 标准化私钥（支持支付宝密钥生成工具的纯 Base64 格式）
  const normalizedPrivateKey = normalizeKey(privateKey, true);
  
  // 标准化公钥（支持支付宝密钥生成工具的纯 Base64 格式）
  const normalizedPublicKey = normalizeKey(alipayPublicKey, false);

  return {
    appId,
    privateKey: normalizedPrivateKey,
    alipayPublicKey: normalizedPublicKey,
  };
}

/** 生成签名字符串 */
function buildSignString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "" && key !== "sign")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

/** RSA2 签名 (SHA256WithRSA) */
function signWithRSA2(content: string, privateKey: string): string {
  const sign = createSign("RSA-SHA256");
  sign.update(content, "utf8");
  return sign.sign(privateKey, "base64");
}

/** RSA2 验签 */
export function verifySignature(params: AlipayNotifyParams, alipayPublicKey: string): boolean {
  const sign = params.sign;
  if (!sign) return false;

  const signContent = buildSignString(params as Record<string, string>);
  const verify = createVerify("RSA-SHA256");
  verify.update(signContent, "utf8");
  return verify.verify(alipayPublicKey, sign, "base64");
}

/** 构建公共请求参数 */
function buildCommonParams(method: string, config: AlipayConfig): Record<string, string> {
  return {
    app_id: config.appId,
    method,
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    version: "1.0",
  };
}

/**
 * PC网站支付 - 生成跳转表单 HTML
 * 用户需要在浏览器中提交此表单以跳转到支付宝
 */
export function createPagePayForm(params: CreatePagePayParams): string {
  const config = getConfig();
  const gateway = getAlipayGateway();
  const method = "alipay.trade.page.pay";

  const bizContent = JSON.stringify({
    out_trade_no: params.outTradeNo,
    total_amount: params.totalAmount,
    subject: params.subject,
    product_code: "FAST_INSTANT_TRADE_PAY",
    body: params.body,
  });

  const requestParams: Record<string, string> = {
    ...buildCommonParams(method, config),
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    biz_content: bizContent,
  };

  const signContent = buildSignString(requestParams);
  requestParams.sign = signWithRSA2(signContent, config.privateKey);

  // 生成自动提交的表单
  const formFields = Object.entries(requestParams)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${value.replace(/"/g, "&quot;")}" />`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>正在跳转到支付宝...</title></head>
<body>
<form id="alipayForm" action="${gateway}" method="POST">
${formFields}
</form>
<script>document.getElementById('alipayForm').submit();</script>
</body>
</html>`;
}

/**
 * 手机网站支付 - 生成跳转表单 HTML
 */
export function createWapPayForm(params: CreateWapPayParams): string {
  const config = getConfig();
  const gateway = getAlipayGateway();
  const method = "alipay.trade.wap.pay";

  const bizContent = JSON.stringify({
    out_trade_no: params.outTradeNo,
    total_amount: params.totalAmount,
    subject: params.subject,
    product_code: "QUICK_WAP_WAY",
    quit_url: params.quitUrl,
    body: params.body,
  });

  const requestParams: Record<string, string> = {
    ...buildCommonParams(method, config),
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    biz_content: bizContent,
  };

  const signContent = buildSignString(requestParams);
  requestParams.sign = signWithRSA2(signContent, config.privateKey);

  const formFields = Object.entries(requestParams)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${key}" value="${value.replace(/"/g, "&quot;")}" />`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>正在跳转到支付宝...</title></head>
<body>
<form id="alipayForm" action="${gateway}" method="POST">
${formFields}
</form>
<script>document.getElementById('alipayForm').submit();</script>
</body>
</html>`;
}

/**
 * 验证支付宝异步通知
 */
export function verifyNotify(params: AlipayNotifyParams): boolean {
  const config = getConfig();
  return verifySignature(params, config.alipayPublicKey);
}

/**
 * 检查交易状态是否为成功
 */
export function isTradeSuccess(tradeStatus: string | undefined): boolean {
  return tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED";
}
