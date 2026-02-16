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

export default function PayPage() {
  const [amount, setAmount] = useState("0.01");
  const [description, setDescription] = useState("测试商品");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const createOrder = useCallback(async () => {
    setError(null);
    setCodeUrl(null);
    setOutTradeNo(null);
    setStatus(null);
    setQrDataUrl(null);
    const yuan = parseFloat(amount);
    if (Number.isNaN(yuan) || yuan < 0.01) {
      setError("请输入有效金额（至少 0.01 元）");
      return;
    }
    const totalCents = Math.round(yuan * 100);
    setLoading(true);
    try {
      const res = await fetch("/api/pay/wechat/native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalCents,
          description: description.trim() || "商品",
        }),
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
      setCodeUrl(data.data?.code_url ?? null);
      setOutTradeNo(data.data?.out_trade_no ?? null);
      setStatus("pending");
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
  }, [amount, description]);

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

  return (
    <div className="min-h-screen py-12 md:py-20 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
          微信 Native 支付
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
              disabled={!!codeUrl}
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
              disabled={!!codeUrl}
              className="mt-1"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {!codeUrl ? (
            <Button
              onClick={createOrder}
              disabled={loading}
              className="w-full"
            >
              {loading ? "创建中…" : "生成支付二维码"}
            </Button>
          ) : (
            <div className="space-y-4 pt-2">
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
                  setOutTradeNo(null);
                  setStatus(null);
                }}
                className="w-full"
              >
                重新生成
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
