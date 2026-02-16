/**
 * WeChat Pay API v3 - Native payment (下单、回调验签与解密).
 * 仅服务端使用，依赖 WECHAT_PAY_* 环境变量。
 */

import {
  createPrivateKey,
  createPublicKey,
  createDecipheriv,
  randomBytes,
  sign,
  verify,
} from "crypto";

const WECHAT_PAY_API_BASE = "https://api.mch.weixin.qq.com";

export interface CreateNativeOrderParams {
  appId: string;
  mchId: string;
  description: string;
  outTradeNo: string;
  notifyUrl: string;
  totalCents: number;
  attach?: string;
  payerClientIp?: string;
}

export interface NativeOrderResult {
  codeUrl: string;
}

export interface NotifyResource {
  algorithm: string;
  ciphertext: string;
  associated_data?: string;
  nonce: string;
  original_type?: string;
}

export interface DecryptedTransaction {
  mchid: string;
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  trade_state_desc?: string;
  success_time?: string;
  amount?: { total: number; payer_total?: number; currency?: string };
}

function getPrivateKey(): string {
  const key = process.env.WECHAT_PAY_PRIVATE_KEY;
  if (!key) throw new Error("WECHAT_PAY_PRIVATE_KEY is not set");
  return key;
}

export function getApiV3Key(): Buffer {
  const key = process.env.WECHAT_PAY_API_V3_KEY;
  if (!key) throw new Error("WECHAT_PAY_API_V3_KEY is not set");
  const buf = Buffer.from(key, "utf8");
  if (buf.length !== 32) throw new Error("WECHAT_PAY_API_V3_KEY must be 32 bytes (e.g. 32 ASCII chars)");
  return buf;
}

/** 构造请求签名原文并 RSA-SHA256 签名，用于 Authorization 头 */
function signRequest(
  method: string,
  urlPath: string,
  body: string,
  privateKeyPem: string
): { signature: string; nonce: string; timestamp: string } {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = [method, urlPath, timestamp, nonce, body].join("\n") + "\n";
  const key = createPrivateKey(privateKeyPem);
  const sig = sign("RSA-SHA256", Buffer.from(message, "utf8"), key);
  return {
    signature: sig.toString("base64"),
    nonce,
    timestamp,
  };
}

/** 构造 WeChat Pay API v3 Authorization 头 */
export function buildAuthorization(
  mchId: string,
  serialNo: string,
  privateKeyPem: string,
  method: string,
  urlPath: string,
  body: string
): string {
  const { signature, nonce, timestamp } = signRequest(method, urlPath, body, privateKeyPem);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
}

/** 调用 Native 下单接口，返回 code_url */
export async function createNativeOrder(
  params: CreateNativeOrderParams
): Promise<NativeOrderResult> {
  const mchId = process.env.WECHAT_PAY_MCH_ID;
  const serialNo = process.env.WECHAT_PAY_MERCHANT_SERIAL_NO;
  if (!mchId || !serialNo) throw new Error("WECHAT_PAY_MCH_ID or WECHAT_PAY_MERCHANT_SERIAL_NO not set");

  const urlPath = "/v3/pay/transactions/native";
  const bodyObj = {
    appid: params.appId,
    mchid: params.mchId,
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: params.notifyUrl,
    amount: { total: params.totalCents, currency: "CNY" as const },
    attach: params.attach ?? undefined,
    scene_info: params.payerClientIp
      ? { payer_client_ip: params.payerClientIp }
      : undefined,
  };
  const body = JSON.stringify(bodyObj);
  const privateKeyPem = getPrivateKey();
  const auth = buildAuthorization(mchId, serialNo, privateKeyPem, "POST", urlPath, body);

  const res = await fetch(`${WECHAT_PAY_API_BASE}${urlPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
    },
    body,
  });

  const data = (await res.json()) as { code_url?: string; errcode?: number; errmsg?: string };
  if (!res.ok || !data.code_url) {
    throw new Error(
      data.errmsg ?? `WeChat Pay native order failed: ${res.status} ${JSON.stringify(data)}`
    );
  }
  return { codeUrl: data.code_url };
}

/** AEAD_AES_256_GCM 解密（APIv3 密钥，associated_data、nonce、base64 密文） */
export function decryptAesGcm(
  apiV3Key: Buffer,
  associatedData: string,
  nonce: string,
  ciphertextBase64: string
): string {
  const ciphertext = Buffer.from(ciphertextBase64, "base64");
  const authTagLength = 16;
  if (ciphertext.length < authTagLength) throw new Error("ciphertext too short");
  const tag = ciphertext.subarray(ciphertext.length - authTagLength);
  const data = ciphertext.subarray(0, ciphertext.length - authTagLength);
  const decipher = createDecipheriv("aes-256-gcm", apiV3Key, Buffer.from(nonce, "utf8"), {
    authTagLength,
  });
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(associatedData, "utf8"));
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** 使用平台证书验证回调签名 */
export function verifyNotifySignature(
  serial: string,
  signature: string,
  timestamp: string,
  nonce: string,
  body: string,
  platformCertPem: string
): boolean {
  const message = [timestamp, nonce, body].join("\n") + "\n";
  const key = createPublicKey(platformCertPem);
  const sigBuf = Buffer.from(signature, "base64");
  return verify("RSA-SHA256", Buffer.from(message, "utf8"), key, sigBuf);
}

/** 解密支付成功回调中的 resource，得到交易信息 */
export function decryptNotifyResource(
  apiV3Key: Buffer,
  resource: NotifyResource
): DecryptedTransaction {
  const associatedData = resource.associated_data ?? "";
  const plain = decryptAesGcm(
    apiV3Key,
    associatedData,
    resource.nonce,
    resource.ciphertext
  );
  return JSON.parse(plain) as DecryptedTransaction;
}

/** 平台证书缓存：serial_no -> PEM */
let platformCertsCache: Map<string, string> | null = null;
let platformCertsExpiry = 0;
const PLATFORM_CERTS_TTL_MS = 60 * 60 * 1000; // 1 hour

/** 获取微信支付平台证书列表并解密缓存（用于回调验签） */
export async function getPlatformCertificates(): Promise<Map<string, string>> {
  if (platformCertsCache && Date.now() < platformCertsExpiry) return platformCertsCache;

  const mchId = process.env.WECHAT_PAY_MCH_ID;
  const serialNo = process.env.WECHAT_PAY_MERCHANT_SERIAL_NO;
  if (!mchId || !serialNo) throw new Error("WECHAT_PAY_MCH_ID or WECHAT_PAY_MERCHANT_SERIAL_NO not set");

  const urlPath = "/v3/certificates";
  const body = "";
  const privateKeyPem = getPrivateKey();
  const auth = buildAuthorization(mchId, serialNo, privateKeyPem, "GET", urlPath, body);

  const res = await fetch(`${WECHAT_PAY_API_BASE}${urlPath}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: auth },
  });
  if (!res.ok) throw new Error(`WeChat Pay certificates failed: ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{
      serial_no: string;
      encrypt_certificate?: {
        algorithm: string;
        nonce: string;
        associated_data: string;
        ciphertext: string;
      };
    }>;
  };
  const apiV3Key = getApiV3Key();
  const map = new Map<string, string>();
  for (const cert of json.data ?? []) {
    const enc = cert.encrypt_certificate;
    if (!enc || enc.algorithm !== "AEAD_AES_256_GCM") continue;
    const pem = decryptAesGcm(
      apiV3Key,
      enc.associated_data ?? "certificate",
      enc.nonce,
      enc.ciphertext
    );
    map.set(cert.serial_no, pem);
  }
  platformCertsCache = map;
  platformCertsExpiry = Date.now() + PLATFORM_CERTS_TTL_MS;
  return map;
}
