"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/form/Button";
import { Card } from "@/components/container/Card";
import { logger } from "@/lib/utils/logger";
import { useAuth } from "@/app/(marketing)/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PlanType = "monthly" | "yearly";

const PLANS: Record<PlanType, { price: number; label: string; period: string }> = {
  monthly: { price: 29, label: "月付", period: "/月" },
  yearly: { price: 199, label: "年付", period: "/年" },
};

const POLL_INTERVAL_MS = 2000;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function PayPageContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planFromUrl = searchParams.get("plan");
  const initialPlan: PlanType =
    planFromUrl === "monthly" ? "monthly" : "yearly";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentPlan = searchParams.get("plan") || "yearly";
      router.replace(`/signin?next=/pay?plan=${currentPlan}`);
    }
  }, [authLoading, isAuthenticated, router, searchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">加载中…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <PayPageInner defaultPlan={initialPlan} />;
}

function PayPageInner({ defaultPlan }: { defaultPlan: PlanType }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(defaultPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [formHtml, setFormHtml] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const plan = PLANS[selectedPlan];

  const createOrder = useCallback(async () => {
    setError(null);
    setFormHtml(null);
    setOutTradeNo(null);
    setStatus(null);
    setLoading(true);

    const apiUrl = isMobile
      ? "/api/pay/alipay/wap"
      : "/api/pay/alipay/page";

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage =
          typeof data?.error === "object" && typeof data?.error?.message === "string"
            ? data.error.message
            : (typeof data?.message === "string" ? data.message : null) ?? "创建订单失败";
        logger.error("Pay create order failed", {
          status: res.status,
          body: data,
        });
        setError(errorMessage);
        return;
      }

      if (data.data?.form_html) {
        setFormHtml(data.data.form_html);
        setOutTradeNo(data.data.out_trade_no ?? null);
        setStatus("pending");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "网络错误";
      logger.error("Pay create order exception", { error: e });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, isMobile]);

  // 支付宝表单提交：打开新窗口
  useEffect(() => {
    if (formHtml) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(formHtml);
        newWindow.document.close();
      }
    }
  }, [formHtml]);

  // 轮询订单状态
  useEffect(() => {
    if (!outTradeNo || status !== "pending") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pay/orders/${encodeURIComponent(outTradeNo)}`
        );
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

  const isOrderCreated = !!formHtml;

  return (
    <div className="min-h-screen py-12 md:py-20 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          升级 Pro
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          选择适合你的套餐
        </p>

        {/* 套餐选择 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* 月付 */}
          <button
            type="button"
            onClick={() => !isOrderCreated && setSelectedPlan("monthly")}
            disabled={isOrderCreated}
            className={cn(
              "relative rounded-xl border-2 p-5 text-left transition-all",
              selectedPlan === "monthly"
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
              isOrderCreated && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              月付
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ¥{PLANS.monthly.price}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                /月
              </span>
            </div>
          </button>

          {/* 年付 */}
          <button
            type="button"
            onClick={() => !isOrderCreated && setSelectedPlan("yearly")}
            disabled={isOrderCreated}
            className={cn(
              "relative rounded-xl border-2 p-5 text-left transition-all",
              selectedPlan === "yearly"
                ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 shadow-md"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
              isOrderCreated && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="absolute -top-3 right-3 flex gap-1">
              <span className="bg-amber-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                推荐
              </span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                省¥149
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              年付
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ¥{PLANS.yearly.price}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                /年
              </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span className="line-through">原价 ¥348</span>
              <span className="text-red-500 dark:text-red-400 ml-1">≈ ¥16.6/月</span>
            </div>
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center" role="alert">
            {error}
          </p>
        )}

        {/* 支付状态 */}
        {status === "paid" && (
          <Card className="p-6 mb-4 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
              支付成功！
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Pro 会员已生效
            </p>
            <Link href="/learn" className="block mt-4">
              <Button className="w-full">开始学习</Button>
            </Link>
          </Card>
        )}

        {status === "closed" && (
          <Card className="p-6 mb-4 text-center">
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              订单已关闭
            </p>
          </Card>
        )}

        {/* 支付按钮区域 */}
        {!isOrderCreated ? (
          <div className="space-y-3">
            {/* 支付宝按钮 */}
            <Button
              onClick={createOrder}
              loading={loading}
              className="w-full h-12 text-base bg-[#1677FF] hover:bg-[#0958d9] text-white font-semibold"
              size="lg"
            >
              支付宝支付（¥{plan.price}）
            </Button>

            {/* 微信支付灰显 */}
            <button
              type="button"
              className="w-full h-12 text-base rounded-md border border-input bg-background opacity-50 cursor-not-allowed font-medium text-gray-400 dark:text-gray-500"
              onClick={() =>
                toast("微信支付正在审核中，预计很快开通，目前请使用支付宝支付", {
                  duration: 4000,
                })
              }
            >
              微信支付（即将开通）
            </button>
          </div>
        ) : status !== "paid" ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              正在跳转到支付宝支付页面…
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setFormHtml(null);
                setOutTradeNo(null);
                setStatus(null);
                setError(null);
              }}
              className="w-full"
            >
              重新选择
            </Button>
          </div>
        ) : null}

        {/* 底部信任信息 */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          7天无理由退款 · 支付即同意
          <Link href="/terms" className="underline hover:no-underline ml-0.5">
            服务条款
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="underline hover:no-underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}

function PayPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-gray-500">加载中…</span>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<PayPageFallback />}>
      <PayPageContent />
    </Suspense>
  );
}
