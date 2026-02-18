import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { logger } from "@/lib/utils/logger";
import {
  isValidPhone,
  sanitizePhone,
  formatPhoneForSupabase,
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
    const phoneWithCode = formatPhoneForSupabase(sanitized);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneWithCode,
      token: otp,
      type: "sms",
    });

    if (error) {
      if (isRateLimitError(error.message)) {
        toast.error(getRateLimitErrorMessage(error.message, "重试"));
      } else if (
        error.message.includes("token") ||
        error.message.includes("expired")
      ) {
        toast.error("验证码无效或已过期，请重新获取验证码");
      } else if (error.message.includes("phone")) {
        toast.error("手机号验证失败，请检查手机号是否正确");
      } else {
        toast.error(`${error.message}。如果问题持续，请重新获取验证码。`);
      }
      setLoading(false);
      return;
    }

    const user = data.user;
    const role = user?.app_metadata?.role;

    logger.debug("User role check", {
      userId: user?.id,
      app_metadata: user?.app_metadata,
      role,
    });

    const defaultPath = role === "operator" ? "/operator" : "/learn";
    const nextPath = resolveSafeNextPath(searchParams.get("next"), defaultPath);
    router.push(nextPath);
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
