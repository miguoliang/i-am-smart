import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import {
  isValidPhone,
  sanitizePhone,
} from "@/lib/utils/phoneValidation";

interface UsePhoneSignInReturn {
  phone: string;
  setPhone: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  otpSent: boolean;
  loading: boolean;
  otpInputRef: React.RefObject<HTMLInputElement | null>;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleResendOtp: () => void;
}

function resolveSafeNextPath(
  rawPath: string | null,
  fallbackPath: string
): string {
  if (!rawPath || typeof rawPath !== "string") return fallbackPath;
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return fallbackPath;
  if (rawPath.includes(":") || rawPath.length > 500) return fallbackPath;
  return rawPath;
}

export function usePhoneSignIn(): UsePhoneSignInReturn {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSendOtp = useCallback(async () => {
    if (!phone) {
      toast.error("请输入手机号");
      return;
    }

    const sanitized = sanitizePhone(phone);
    if (!sanitized) {
      toast.error("请输入手机号");
      return;
    }

    if (!isValidPhone(sanitized)) {
      toast.error("手机号格式不正确，请检查后重试");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sanitized }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error) {
          if (data.error.code === "RATE_LIMIT_EXCEEDED") {
            toast.error(data.error.message);
          } else {
            const errorMsg = data.error.message || "发送验证码失败";
            toast.error(
              `${errorMsg}。如果问题持续，请检查网络连接或稍后重试。`
            );
          }
        } else {
          toast.error("发送验证码失败，请检查网络连接后重试");
        }
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
      toast.success("验证码已发送到您的手机，请查收。");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "发送验证码失败，请检查网络连接";
      logger.error("Phone OTP Exception", {
        error: err,
        message: errorMessage,
      });
      toast.error(`${errorMessage}。请检查网络连接后重试。`);
      setLoading(false);
    }
  }, [phone]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp) {
      toast.error("请输入验证码");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error("验证码格式不正确，请输入6位数字");
      return;
    }

    setLoading(true);
    const sanitized = sanitizePhone(phone);

    try {
      const res = await fetch("/api/auth/verify-phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: sanitized, token: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message || "验证码无效或已过期，请重新获取验证码";
        toast.error(msg);
        setLoading(false);
        return;
      }

      // Set session from API response
      const { access_token, refresh_token } = data.data;
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        toast.error("登录失败，请重试");
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const role = userData?.user?.app_metadata?.role;
      const defaultPath = role === "operator" ? "/operator" : "/learn";
      const nextPath = resolveSafeNextPath(searchParams.get("next"), defaultPath);
      router.push(nextPath);
    } catch (err) {
      logger.error("Phone OTP verify exception", { error: err });
      toast.error("验证失败，请检查网络连接后重试");
      setLoading(false);
    }
  }, [otp, phone, supabase, router, searchParams]);

  const handleResendOtp = useCallback(() => {
    setOtpSent(false);
    setOtp("");
  }, []);

  return {
    phone,
    setPhone,
    otp,
    setOtp,
    otpSent,
    loading,
    otpInputRef,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
  };
}
