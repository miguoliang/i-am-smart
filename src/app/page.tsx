// src/app/page.tsx - Sign In Page
"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
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
  // Using derived state pattern to avoid setState in effect warning
  const emailError = debouncedEmail && debouncedEmail.length > 0 && !isValidEmail(debouncedEmail)
    ? "邮箱格式不正确"
    : null;

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Start countdown when OTP is sent
  useEffect(() => {
    if (otpSent && !countdownActive) {
      resetCountdown();
    }
  }, [otpSent, countdownActive, resetCountdown]);

  // Auto-focus OTP input when OTP is sent
  useLayoutEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent, otpInputRef]);


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
    setOtp(sanitized);
  };

  // Handle OTP input change - only allow digits
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, max 6 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setOtp(sanitized);
    
    // Reset ref when OTP length changes away from 6
    if (sanitized.length !== 6) {
      autoSubmitRef.current = false;
    }
  };

  // Auto-submit when OTP reaches 6 digits
  useEffect(() => {
    if (otp.length === 6 && otpSent && !loading && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      handleVerifyOtp();
    }
  }, [otp.length, otpSent, loading, autoSubmitRef, handleVerifyOtp]);

  // Handle resend with countdown
  const handleResendClick = () => {
    if (countdownActive) {
      return; // Prevent resend during countdown
    }
    handleResendOtp();
    resetCountdown();
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              背它一辈子
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/features"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                功能
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                文档
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                博客
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                关于
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sign In Form */}
      <div className="flex flex-col items-center justify-center flex-1">
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
    </div>
  );
}
