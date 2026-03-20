"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Label } from "@/components/form/Label";
import { toast } from "sonner";

type Step = "email" | "otp";

export default function OperatorLoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("验证码已发送到邮箱");
      setStep("otp");
    } catch {
      toast.error("发送失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const role = data.user?.app_metadata?.role;
      if (role !== "operator") {
        await supabase.auth.signOut();
        toast.error("该账号没有运营权限");
        return;
      }

      router.replace("/operator");
    } catch {
      toast.error("验证失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
        <h1 className="text-center text-base font-semibold tracking-tight">
          运营后台
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          使用运营账号登录
        </p>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "发送中..." : "发送验证码"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              验证码已发送至{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp">验证码</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoComplete="one-time-code"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length < 6}
            >
              {loading ? "验证中..." : "登录"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
            >
              返回重新输入邮箱
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
