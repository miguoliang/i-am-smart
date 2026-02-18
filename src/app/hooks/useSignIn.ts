import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { logger } from "@/lib/utils/logger";
import { isValidEmail, sanitizeEmail } from "@/lib/utils/emailValidation";

interface UseSignInReturn {
  email: string;
  setEmail: (email: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  otpSent: boolean;
  loading: boolean;
  otpInputRef: React.RefObject<HTMLInputElement | null>;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleResendOtp: () => void;
}

function resolveSafeNextPath(rawPath: string | null, fallbackPath: string): string {
  if (!rawPath || typeof rawPath !== "string") return fallbackPath;
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return fallbackPath;
  if (rawPath.includes(":") || rawPath.length > 500) return fallbackPath;
  return rawPath;
}

export function useSignIn(): UseSignInReturn {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSendOtp = useCallback(async () => {
    if (!email) {
      toast.error("请输入邮箱");
      return;
    }

    // Sanitize email (trim whitespace, normalize)
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast.error("请输入邮箱");
      return;
    }

    // Email validation
    if (!isValidEmail(sanitizedEmail)) {
      toast.error("邮箱格式不正确，请检查后重试");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle API errors with better messages
        if (data.error) {
          if (data.error.code === 'RATE_LIMIT_EXCEEDED') {
            toast.error(data.error.message);
          } else {
            const errorMsg = data.error.message || "发送验证码失败";
            toast.error(`${errorMsg}。如果问题持续，请检查网络连接或稍后重试。`);
          }
        } else {
          toast.error("发送验证码失败，请检查网络连接后重试");
        }
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
      toast.success("验证码已发送到您的邮箱，请查收。");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "发送验证码失败，请检查网络连接";
      logger.error("OTP Exception", { error: err, message: errorMessage });
      toast.error(`${errorMessage}。请检查网络连接后重试。`);
      setLoading(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp) {
      toast.error("请输入验证码");
      return;
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      toast.error("验证码格式不正确，请输入6位数字");
      return;
    }

    setLoading(true);
    // Sanitize email before verification
    const sanitizedEmail = sanitizeEmail(email);
    const { data, error } = await supabase.auth.verifyOtp({
      email: sanitizedEmail,
      token: otp,
      type: "email",
    });

    if (error) {
      if (isRateLimitError(error.message)) {
        toast.error(getRateLimitErrorMessage(error.message, "重试"));
      } else if (error.message.includes("token") || error.message.includes("expired")) {
        toast.error("验证码无效或已过期，请重新获取验证码");
      } else if (error.message.includes("email")) {
        toast.error("邮箱验证失败，请检查邮箱地址是否正确");
      } else {
        toast.error(`${error.message}。如果问题持续，请重新获取验证码。`);
      }
      setLoading(false);
      return;
    }

    // Debug role checking
    const user = data.user;
    const role = user?.app_metadata?.role;
    
    logger.debug("User role check", {
      userId: user?.id,
      app_metadata: user?.app_metadata,
      role,
    });

    // Navigate based on role, or return to the page the user was trying to access
    const defaultPath = role === "operator" ? "/operator" : "/learn";
    const nextPath = resolveSafeNextPath(searchParams.get("next"), defaultPath);
    router.push(nextPath);
    // Keep loading true while redirecting
  }, [otp, email, supabase, router, searchParams]);

  const handleResendOtp = useCallback(() => {
    setOtpSent(false);
    setOtp("");
  }, []);

  return {
    email,
    setEmail,
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
