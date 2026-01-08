// src/app/page.tsx - Sign In Page
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from "./hooks/useSignIn";
import { useDebounce } from "./hooks/useDebounce";
import { useCountdown } from "./hooks/useCountdown";
import { isValidEmail } from "@/lib/utils/emailValidation";

export default function SignIn() {
  const {
    email,
    setEmail,
    otp,
    setOtp,
    otpSent,
    loading,
    otpInputRef,
    autoSubmitRef,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
  } = useSignIn();

  // Email validation error state
  const [emailError, setEmailError] = useState<string | null>(null);
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce email for validation
  const debouncedEmail = useDebounce(email, 500);

  // Countdown timer for resend (60 seconds)
  const { seconds: countdownSeconds, isActive: countdownActive, reset: resetCountdown } = useCountdown(
    60,
    () => {
      // Countdown completed
    }
  );

  // Validate email on debounced change
  useEffect(() => {
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    
    if (debouncedEmail && debouncedEmail.length > 0) {
      validationTimerRef.current = setTimeout(() => {
        if (!isValidEmail(debouncedEmail)) {
          setEmailError("邮箱格式不正确");
        } else {
          setEmailError(null);
        }
      }, 0);
    } else {
      setEmailError(null);
    }
    
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [debouncedEmail]);

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error immediately if empty
    if (!value) {
      setEmailError(null);
    }
  };

  // Start countdown when OTP is sent
  useEffect(() => {
    if (otpSent && !countdownActive) {
      resetCountdown();
    }
  }, [otpSent, countdownActive, resetCountdown]);

  // Auto-focus OTP input when OTP is sent
  useEffect(() => {
    if (otpSent) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpSent]);


  // Handle Enter key for email input
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && !otpSent && !emailError) {
      e.preventDefault();
      handleSendOtp();
    }
  };

  // Handle Enter key for OTP input
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && otpSent) {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    // Sanitize: remove all non-digit characters and take first 6 digits
    const sanitized = pastedText.replace(/\D/g, "").slice(0, 6);
    const previousLength = otp.length;
    setOtp(sanitized);
    
    // Auto-submit if exactly 6 digits after paste
    if (sanitized.length === 6 && previousLength !== 6 && otpSent && !loading && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      // Use setTimeout to defer the call after state update
      setTimeout(() => {
        handleVerifyOtp();
      }, 0);
    }
  };

  // Handle OTP input change - only allow digits and auto-submit on 6 digits
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, max 6 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    const previousLength = otp.length;
    setOtp(sanitized);
    
    // Auto-submit when reaching exactly 6 digits
    if (sanitized.length === 6 && previousLength !== 6 && otpSent && !loading && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      // Use setTimeout to defer the call after state update
      setTimeout(() => {
        handleVerifyOtp();
      }, 0);
    } else if (sanitized.length !== 6) {
      // Reset ref when OTP length changes away from 6
      autoSubmitRef.current = false;
    }
  };

  // Handle resend with countdown
  const handleResendClick = () => {
    if (countdownActive) {
      return; // Prevent resend during countdown
    }
    handleResendOtp();
    resetCountdown();
  };

  return (
    <div className="bg-white dark:bg-gray-900 flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto p-5 md:p-8 lg:p-10 text-center box-border">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          背它一辈子
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
              aria-describedby={emailError ? "email-error" : "email-description"}
              className={`w-full py-3.5 md:py-4 lg:py-5 px-4 md:px-5 my-2.5 md:my-3 text-base md:text-lg ${
                emailError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {emailError && (
              <p id="email-error" className="text-red-500 text-sm mt-1 text-left" role="alert">
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
                aria-label={countdownActive ? `请等待${countdownSeconds}秒后重新发送` : "重新发送验证码"}
                className="w-full mt-3"
              >
                {countdownActive ? `重新发送验证码 (${countdownSeconds}秒)` : "重新发送验证码"}
              </Button>
            </>
          )}
        </div>
        
        <div className="mt-5 md:mt-6 text-gray-600 dark:text-gray-400 text-sm md:text-base" role="note">
          首次使用？输入邮箱即可自动创建账号
        </div>
      </div>
    </div>
  );
}
