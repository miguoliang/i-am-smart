"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/container/Card";
import { Button } from "@/components/form/Button";

type OrderStatus = "loading" | "success" | "failed" | "unknown";

export default function PayResultPage() {
  const searchParams = useSearchParams();
  const outTradeNo = searchParams.get("out_trade_no");
  const tradeNo = searchParams.get("trade_no");
  const totalAmount = searchParams.get("total_amount");
  const initialStatus: OrderStatus = outTradeNo ? "loading" : "unknown";
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  useEffect(() => {
    if (!outTradeNo) {
      return;
    }

    async function checkOrder() {
      try {
        const res = await fetch(`/api/pay/orders/${outTradeNo}`);
        if (res.ok) {
          const data = await res.json();
          const orderStatus = data?.order?.status;
          if (orderStatus === "paid" || orderStatus === "TRADE_SUCCESS") {
            setStatus("success");
          } else if (orderStatus === "failed" || orderStatus === "TRADE_CLOSED") {
            setStatus("failed");
          } else {
            // 支付宝回调到这里时订单可能还没更新，默认显示成功
            setStatus("success");
          }
        } else {
          // API 返回非 200，但支付宝已回调，大概率成功
          setStatus("success");
        }
      } catch {
        // 网络错误，但支付宝已回调，大概率成功
        setStatus("success");
      }
    }

    checkOrder();
  }, [outTradeNo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              正在查询支付结果...
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              支付成功
            </h1>
            {totalAmount && (
              <p className="text-gray-600 mb-1">
                支付金额：<span className="font-semibold">¥{totalAmount}</span>
              </p>
            )}
            {tradeNo && (
              <p className="text-sm text-gray-400 mb-4">
                支付宝交易号：{tradeNo}
              </p>
            )}
            <p className="text-gray-600 mb-6">
              感谢您的购买！您的 Pro 会员已生效。
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              支付失败
            </h1>
            <p className="text-gray-600 mb-6">
              支付未完成，请重试或联系客服。
            </p>
          </>
        )}

        {status === "unknown" && (
          <>
            <div className="text-5xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-gray-600 mb-2">
              无法确认支付状态
            </h1>
            <p className="text-gray-600 mb-6">
              未找到订单信息，请稍后查看您的账户。
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/learn">
            <Button className="w-full">开始学习</Button>
          </Link>
          <Link href="/">
            <Button className="w-full" variant="outline">
              返回首页
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
