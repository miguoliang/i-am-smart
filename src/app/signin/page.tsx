// src/app/signin/page.tsx - Sign In Page
"use client";

import { useEffect, useLayoutEffect, useCallback, useMemo, useReducer } from "react";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { useSignIn } from "../hooks/useSignIn";
import { useDebounce } from "../hooks/useDebounce";
import { useCountdown } from "../hooks/useCountdown";
import { isValidEmail, sanitizeEmail } from "@/lib/utils/emailValidation";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 60;
const EMAIL_DEBOUNCE_MS = 500;
const OTP_LENGTH = 6;

interface SignInState {
  autoSubmitted: boolean;
}

type SignInAction =
  | { type: "SET_AUTO_SUBMITTED"; payload: boolean }
  | { type: "RESET_AUTO_SUBMITTED" };

function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case "SET_AUTO_SUBMITTED":
      return { ...state, autoSubmitted: action.payload };
    case "RESET_AUTO_SUBMITTED":
      return { ...state, autoSubmitted: false };
    default:
      return state;
  }
}

export default function SignIn() {
  const {
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
  } = useSignIn();

  const [state, dispatch] = useReducer(signInReducer, {
    autoSubmitted: false,
  });

  // Debounce email for validation
  const debouncedEmail = useDebounce(email, EMAIL_DEBOUNCE_MS);

  // Countdown timer for resend
  const {
    seconds: countdownSeconds,
    isActive: countdownActive,
    reset: resetCountdown,
  } = useCountdown(COUNTDOWN_SECONDS);

  // Validate email on debounced change
  // Using derived state pattern to avoid setState in effect warning
  // Sanitize email before validation (trim whitespace, normalize)
  const emailError = useMemo(() => {
    if (!debouncedEmail || debouncedEmail.length === 0) {
      return null;
    }
    const sanitized = sanitizeEmail(debouncedEmail);
    return !isValidEmail(sanitized) ? "邮箱格式不正确" : null;
  }, [debouncedEmail]);

  // Handle email change
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    [setEmail]
  );

  // Start countdown when OTP is sent
  useEffect(() => {
    if (otpSent) {
      resetCountdown();
    }
  }, [otpSent, resetCountdown]);

  // Auto-focus OTP input when OTP is sent
  useLayoutEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent, otpInputRef]);

  // Handle Enter key for email input
  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading && !otpSent && !emailError) {
        e.preventDefault();
        handleSendOtp();
      }
    },
    [loading, otpSent, emailError, handleSendOtp]
  );

  // Handle Enter key for OTP input
  const handleOtpKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading && otpSent) {
        e.preventDefault();
        handleVerifyOtp();
      }
    },
    [loading, otpSent, handleVerifyOtp]
  );

  // Sanitize OTP input: remove non-digits and limit length
  const sanitizeOtp = useCallback((value: string): string => {
    return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
  }, []);

  // Handle OTP paste
  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const sanitized = sanitizeOtp(pastedText);
      setOtp(sanitized);
    },
    [sanitizeOtp, setOtp]
  );

  // Handle OTP input change - only allow digits
  const handleOtpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeOtp(e.target.value);
      setOtp(sanitized);

      // Reset auto-submitted flag when OTP length changes away from 6
      if (sanitized.length !== OTP_LENGTH) {
        dispatch({ type: "RESET_AUTO_SUBMITTED" });
      }
    },
    [sanitizeOtp, setOtp]
  );

  // Auto-submit when OTP reaches 6 digits
  useEffect(() => {
    if (
      otp.length === OTP_LENGTH &&
      otpSent &&
      !loading &&
      !state.autoSubmitted
    ) {
      dispatch({ type: "SET_AUTO_SUBMITTED", payload: true });
      handleVerifyOtp();
    }
  }, [otp, otpSent, loading, state.autoSubmitted, handleVerifyOtp]);

  // Handle resend with countdown
  const handleResendClick = useCallback(() => {
    if (countdownActive) {
      return; // Prevent resend during countdown
    }
    dispatch({ type: "RESET_AUTO_SUBMITTED" });
    handleResendOtp();
    resetCountdown();
  }, [countdownActive, handleResendOtp, resetCountdown]);

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col">
      {/* Sign In Form */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto p-5 md:p-8 lg:p-10 text-center box-border">
          <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            聪明的背单词工具
          </h1>
          <h2 className="mb-6 md:mb-8 lg:mb-10 text-gray-600 dark:text-gray-400 text-lg sm:text-xl md:text-2xl lg:text-3xl">
            登录
          </h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="email-input" className="sr-only">
                邮箱地址
              </label>
              <Input
                id="email-input"
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleEmailKeyDown}
                disabled={otpSent}
                aria-invalid={emailError ? "true" : "false"}
                aria-describedby={
                  emailError ? "email-error" : "email-description"
                }
                className={cn(
                  "w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg",
                  emailError && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {emailError && (
                <p
                  id="email-error"
                  className="text-red-500 text-sm mt-1 text-left"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
              <p id="email-description" className="sr-only">
                请输入您的邮箱地址以接收验证码
              </p>
            </div>

            {otpSent && (
              <div>
                <label htmlFor="otp-input" className="sr-only">
                  验证码
                </label>
                <Input
                  id="otp-input"
                  ref={otpInputRef}
                  type="text"
                  placeholder="请输入验证码"
                  value={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  onPaste={handleOtpPaste}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  aria-label="请输入6位数字验证码"
                  aria-describedby="otp-description"
                  className="w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg"
                />
                <p id="otp-description" className="sr-only">
                  请输入发送到您邮箱的6位数字验证码
                </p>
              </div>
            )}
          </div>

          <div className="my-6 md:my-8">
            {!otpSent ? (
              <Button
                onClick={handleSendOtp}
                loading={loading}
                disabled={loading || !!emailError || !email}
                size="lg"
                aria-label="发送验证码到邮箱"
                className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
              >
                发送验证码
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleVerifyOtp}
                  loading={loading}
                  disabled={loading || otp.length !== 6}
                  size="lg"
                  aria-label="验证并登录"
                  className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
                >
                  验证登录
                </Button>
                <Button
                  onClick={handleResendClick}
                  variant="ghost"
                  disabled={countdownActive}
                  aria-label={
                    countdownActive
                      ? `请等待${countdownSeconds}秒后重新发送`
                      : "重新发送验证码"
                  }
                  className="w-full mt-3"
                >
                  {countdownActive
                    ? `重新发送验证码 (${countdownSeconds}秒)`
                    : "重新发送验证码"}
                </Button>
              </>
            )}
          </div>

          <div
            className="mt-5 md:mt-6 text-gray-600 dark:text-gray-400 text-sm md:text-base"
            role="note"
          >
            首次使用？输入邮箱即可自动创建账号
          </div>
        </div>
      </div>
    </div>
  );
}
