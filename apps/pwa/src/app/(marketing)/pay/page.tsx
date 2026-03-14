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
      router.replace(`/signin?next=${encodeURIComponent(`/pay?plan=${currentPlan}`)}`);
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
    <div className="min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            升级 Pro
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
            选择适合你的套餐，解锁全部功能
          </p>
        </div>

        {/* 套餐选择：与 pricing 页一致的 Card 风格 */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 max-w-4xl mx-auto">
          {/* 月付 */}
          <button
            type="button"
            onClick={() => !isOrderCreated && setSelectedPlan("monthly")}
            disabled={isOrderCreated}
            className={cn(
              "relative rounded-lg border-2 p-8 text-left transition-all bg-card text-card-foreground shadow-sm",
              selectedPlan === "monthly"
                ? "border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md"
                : "border-border hover:border-gray-300 dark:hover:border-gray-600",
              isOrderCreated && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                月付
              </h2>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ¥{PLANS.monthly.price}
                <span className="text-lg font-normal text-gray-600 dark:text-gray-400"> / 月</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              灵活订阅，随时取消
            </p>
          </button>

          {/* 年付（推荐） */}
          <button
            type="button"
            onClick={() => !isOrderCreated && setSelectedPlan("yearly")}
            disabled={isOrderCreated}
            className={cn(
              "relative rounded-lg border-2 p-8 text-left transition-all bg-card text-card-foreground shadow-sm md:scale-105",
              selectedPlan === "yearly"
                ? "border-amber-400 dark:border-amber-500 shadow-xl"
                : "border-border hover:border-amber-300 dark:hover:border-amber-600",
              isOrderCreated && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="absolute top-0 right-0 flex gap-1">
              <span className="bg-amber-400 dark:bg-amber-500 text-gray-900 dark:text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                推荐
              </span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                省 ¥149
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                年付
              </h2>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                ¥{PLANS.yearly.price}
                <span className="text-lg font-normal"> / 年</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="line-through">原价 ¥348</span>
                <span className="text-red-600 dark:text-red-400 font-bold ml-1">≈ ¥16.6/月</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              最划算，约 58% off
            </p>
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <p
            className="text-sm text-red-600 dark:text-red-400 mb-6 text-center max-w-4xl mx-auto"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 支付状态 */}
        {(status === "paid" || status === "closed") && (
          <div className="max-w-4xl mx-auto mb-8">
            {status === "paid" && (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-green-600 dark:text-green-400 font-semibold text-xl mb-1">
                  支付成功！
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Pro 会员已生效
                </p>
                <Link href="/learn" className="block">
                  <Button
                    className="w-full bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-gray-900 dark:text-white font-bold shadow-lg"
                    size="lg"
                  >
                    开始学习
                  </Button>
                </Link>
              </Card>
            )}
            {status === "closed" && (
              <Card className="p-8 text-center">
                <p className="text-amber-600 dark:text-amber-400 font-medium text-lg">
                  订单已关闭
                </p>
              </Card>
            )}
          </div>
        )}

        {/* 支付按钮区域 */}
        {!isOrderCreated && status !== "paid" && (
          <div className="space-y-4 max-w-md mx-auto mb-8">
            <Button
              onClick={createOrder}
              loading={loading}
              className="w-full h-14 text-lg bg-[#1677FF] hover:bg-[#0958d9] text-white font-semibold shadow-lg"
              size="lg"
            >
              支付宝支付（¥{plan.price}）
            </Button>
            <button
              type="button"
              className="w-full h-14 text-lg rounded-lg border border-input bg-background opacity-50 cursor-not-allowed font-medium text-gray-400 dark:text-gray-500"
              onClick={() =>
                toast("微信支付正在审核中，预计很快开通，目前请使用支付宝支付", {
                  duration: 4000,
                })
              }
            >
              微信支付（即将开通）
            </button>
          </div>
        )}
        {isOrderCreated && status !== "paid" && (
          <div className="space-y-4 max-w-md mx-auto mb-8">
            <p className="text-center text-gray-600 dark:text-gray-400">
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
              size="lg"
            >
              重新选择
            </Button>
          </div>
        )}

        {/* 底部信任信息：与 pricing 页一致 */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          7天无理由退款 · 支付即同意
          <Link href="/terms" className="underline hover:no-underline ml-0.5">
            服务条款
          </Link>
        </div>
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 mb-6">
          微信支付 · 支付宝
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="underline hover:no-underline">
            返回首页
          </Link>
        </p>
      </section>
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
