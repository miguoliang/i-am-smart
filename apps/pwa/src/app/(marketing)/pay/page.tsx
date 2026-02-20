"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Label } from "@/components/form/Label";
import { Card } from "@/components/container/Card";
import { logger } from "@/lib/utils/logger";

const POLL_INTERVAL_MS = 2000;

type PaymentMethod = "wechat" | "alipay_page" | "alipay_wap";

export default function PayPage() {
  const [amount, setAmount] = useState("0.01");
  const [description, setDescription] = useState("测试商品");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wechat");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [formHtml, setFormHtml] = useState<string | null>(null);

  const createOrder = useCallback(async () => {
    setError(null);
    setCodeUrl(null);
    setOutTradeNo(null);
    setStatus(null);
    setQrDataUrl(null);
    setFormHtml(null);
    const yuan = parseFloat(amount);
    if (Number.isNaN(yuan) || yuan < 0.01) {
      setError("请输入有效金额（至少 0.01 元）");
      return;
    }
    setLoading(true);
    try {
      let apiUrl = "";
      let requestBody: Record<string, unknown> = {};

      if (paymentMethod === "wechat") {
        apiUrl = "/api/pay/wechat/native";
        requestBody = {
          amount: Math.round(yuan * 100), // 微信支付使用分
          description: description.trim() || "商品",
        };
      } else if (paymentMethod === "alipay_page") {
        apiUrl = "/api/pay/alipay/page";
        requestBody = {
          amount: yuan, // 支付宝使用元
          subject: description.trim() || "商品",
        };
      } else if (paymentMethod === "alipay_wap") {
        apiUrl = "/api/pay/alipay/wap";
        requestBody = {
          amount: yuan, // 支付宝使用元
          subject: description.trim() || "商品",
        };
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorCode =
          typeof data?.error === "object" && typeof data?.error?.code === "string"
            ? data.error.code
            : undefined;
        const errorMessage =
          typeof data?.error === "object" && typeof data?.error?.message === "string"
            ? data.error.message
            : (typeof data?.message === "string" ? data.message : null) ?? "创建订单失败";
        logger.error("Pay create order failed", {
          status: res.status,
          statusText: res.statusText,
          errorCode,
          errorMessage,
          body: data,
        });
        const displayMsg =
          errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage;
        setError(displayMsg);
        return;
      }

      // 微信支付返回二维码 URL
      if (paymentMethod === "wechat" && data.data?.code_url) {
        setCodeUrl(data.data.code_url);
        setOutTradeNo(data.data.out_trade_no ?? null);
        setStatus("pending");
      }
      // 支付宝支付返回表单 HTML
      else if (
        (paymentMethod === "alipay_page" || paymentMethod === "alipay_wap") &&
        data.data?.form_html
      ) {
        setFormHtml(data.data.form_html);
        setOutTradeNo(data.data.out_trade_no ?? null);
        setStatus("pending");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "网络错误";
      logger.error("Pay create order exception", {
        error: e,
        message: msg,
        stack: e instanceof Error ? e.stack : undefined,
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [amount, description, paymentMethod]);

  useEffect(() => {
    if (!codeUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(codeUrl, { width: 260, margin: 2 }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [codeUrl]);

  useEffect(() => {
    if (!outTradeNo || status !== "pending") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/orders/${encodeURIComponent(outTradeNo)}`);
        const data = await res.json();
        const s = data?.data?.status;
        if (s === "paid") setStatus("paid");
        if (s === "closed") setStatus("closed");
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [outTradeNo, status]);

  // 支付宝支付：渲染表单 HTML
  useEffect(() => {
    if (formHtml) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(formHtml);
        newWindow.document.close();
      }
    }
  }, [formHtml]);

  const isOrderCreated = !!(codeUrl || formHtml);
  const isWechatPay = paymentMethod === "wechat";
  const isAlipayPay = paymentMethod === "alipay_page" || paymentMethod === "alipay_wap";

  return (
    <div className="min-h-screen py-12 md:py-20 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
          支付
        </h1>
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="pay-amount">金额（元）</Label>
            <Input
              id="pay-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isOrderCreated}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pay-desc">商品描述</Label>
            <Input
              id="pay-desc"
              type="text"
              maxLength={127}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isOrderCreated}
              className="mt-1"
            />
          </div>
          <div>
            <Label>支付方式</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("wechat")}
                disabled={isOrderCreated}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  paymentMethod === "wechat"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                微信
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("alipay_page")}
                disabled={isOrderCreated}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  paymentMethod === "alipay_page"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                支付宝PC
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("alipay_wap")}
                disabled={isOrderCreated}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  paymentMethod === "alipay_wap"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                支付宝手机
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {!isOrderCreated ? (
            <Button
              onClick={createOrder}
              disabled={loading}
              className="w-full"
            >
              {loading
                ? "创建中…"
                : isWechatPay
                  ? "生成支付二维码"
                  : "跳转支付"}
            </Button>
          ) : (
            <div className="space-y-4 pt-2">
              {isWechatPay && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    请使用微信扫描下方二维码完成支付
                  </p>
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    {qrDataUrl ? (
                      <Image
                        src={qrDataUrl}
                        alt="支付二维码"
                        width={260}
                        height={260}
                        unoptimized
                      />
                    ) : (
                      <div className="w-[260px] h-[260px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                    )}
                  </div>
                </>
              )}
              {isAlipayPay && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  正在跳转到支付宝支付页面...
                </p>
              )}
              {status === "paid" && (
                <p className="text-center text-green-600 dark:text-green-400 font-medium">
                  支付成功
                </p>
              )}
              {status === "closed" && (
                <p className="text-center text-amber-600 dark:text-amber-400">
                  订单已关闭
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setCodeUrl(null);
                  setFormHtml(null);
                  setOutTradeNo(null);
                  setStatus(null);
                }}
                className="w-full"
              >
                重新创建
              </Button>
            </div>
          )}
        </Card>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="underline hover:no-underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
