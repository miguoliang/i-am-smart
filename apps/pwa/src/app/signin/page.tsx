// src/app/signin/page.tsx - Sign In Page
"use client";

import { Suspense, useEffect, useLayoutEffect, useCallback, useMemo, useReducer, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Checkbox } from "@/components/form/Checkbox";
import { Label } from "@/components/form/Label";
import { usePhoneSignIn } from "../hooks/usePhoneSignIn";
import { useAppleSignIn } from "../hooks/useAppleSignIn";
import { useDebounce } from "../hooks/useDebounce";
import { useCountdown } from "../hooks/useCountdown";
import { isValidPhone, sanitizePhone } from "@/lib/utils/phoneValidation";
import { cn } from "@/lib/utils";

const COUNTDOWN_SECONDS = 60;
const DEBOUNCE_MS = 500;
const OTP_LENGTH = 6;
const WECHAT_QRCONNECT_URL = "https://open.weixin.qq.com/connect/qrconnect";

/**
 * Detect mobile phones and tablets via User-Agent.
 * iPadOS sends a desktop-like "Macintosh" UA, so we also check
 * `maxTouchPoints` to catch it.
 */
function detectMobileOrTablet(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  // iPadOS in desktop mode: reports "Macintosh" but has touch
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/**
 * Detect if running in WeChat miniprogram environment.
 * WeChat miniprogram provides a global `wx` object.
 */
function detectMiniprogram(): boolean {
  if (typeof window === "undefined") return false;
  // Check for WeChat miniprogram global object
  // @ts-expect-error - wx is provided by WeChat miniprogram runtime
  return typeof wx !== "undefined" && typeof wx.getSystemInfoSync === "function";
}

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

function SignInContent() {
  const {
    phone,
    setPhone,
    otp: phoneOtp,
    setOtp: setPhoneOtp,
    otpSent: phoneOtpSent,
    loading: phoneLoading,
    otpInputRef: phoneOtpInputRef,
    handleSendOtp: handleSendPhoneOtp,
    handleVerifyOtp: handleVerifyPhoneOtp,
    handleResendOtp: handleResendPhoneOtp,
  } = usePhoneSignIn();

  const { loading: appleLoading, handleAppleSignIn } = useAppleSignIn();

  const searchParams = useSearchParams();
  const wechatError = searchParams.get("error") === "wechat_failed";
  const oauthError = searchParams.get("error") === "oauth_failed";
  const isPreview = process.env.NEXT_PUBLIC_APP_ENV === "preview";
  const isDevelopment = !process.env.NEXT_PUBLIC_APP_ENV || process.env.NEXT_PUBLIC_APP_ENV === "development";
  
  // In development, show all login methods for testing even if env vars are not set
  const showAppleLogin = isDevelopment || !!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

  // Detect mobile/tablet — WeChat QR login is desktop-only
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  useEffect(() => {
    setIsMobileOrTablet(detectMobileOrTablet());
  }, []);

  // Detect WeChat miniprogram environment
  const [isMiniprogram, setIsMiniprogram] = useState(false);
  useEffect(() => {
    setIsMiniprogram(detectMiniprogram());
  }, []);

  // In development, show WeChat login for testing even if env vars are not set
  const showWechatLogin =
    (isDevelopment || !!process.env.NEXT_PUBLIC_WECHAT_OPEN_APP_ID) && !isPreview && !isMobileOrTablet;

  const [state, dispatch] = useReducer(signInReducer, {
    autoSubmitted: false,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);

  const handleAppleLogin = useCallback(async () => {
    if (!agreedToTerms) return;
    await handleAppleSignIn();
  }, [agreedToTerms, handleAppleSignIn]);

  const handleWechatLogin = useCallback(async () => {
    if (!agreedToTerms || typeof window === "undefined") return;
    const appId = process.env.NEXT_PUBLIC_WECHAT_OPEN_APP_ID;
    if (!appId) return;
    const origin = process.env.NEXT_PUBLIC_APP_ORIGIN
      ? process.env.NEXT_PUBLIC_APP_ORIGIN.replace(/\/$/, "")
      : window.location.origin;
    const nextPath = searchParams.get("next");
    const stateUrl = nextPath
      ? `/api/auth/wechat/state?next=${encodeURIComponent(nextPath)}`
      : "/api/auth/wechat/state";
    setWechatLoading(true);
    try {
      const res = await fetch(stateUrl);
      if (!res.ok) return;
      const { state } = (await res.json()) as { state?: string };
      if (!state) return;
      const redirectUri = encodeURIComponent(
        `${origin}/api/auth/wechat/callback`
      );
      const url = `${WECHAT_QRCONNECT_URL}?appid=${encodeURIComponent(appId)}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${encodeURIComponent(state)}#wechat_redirect`;
      window.location.href = url;
    } finally {
      setWechatLoading(false);
    }
  }, [agreedToTerms, searchParams]);

  // Debounce phone for validation
  const debouncedPhone = useDebounce(phone, DEBOUNCE_MS);

  // Countdown timer for resend
  const {
    seconds: countdownSeconds,
    isActive: countdownActive,
    reset: resetCountdown,
  } = useCountdown(COUNTDOWN_SECONDS);

  // Phone validation error
  const phoneError = useMemo(() => {
    if (!debouncedPhone || debouncedPhone.length === 0) {
      return null;
    }
    const sanitized = sanitizePhone(debouncedPhone);
    return !isValidPhone(sanitized) ? "手机号格式不正确" : null;
  }, [debouncedPhone]);

  // Handle phone change
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits, +, spaces
      const value = e.target.value.replace(/[^\d+\s\-]/g, "");
      setPhone(value);
    },
    [setPhone]
  );

  // Start countdown when OTP is sent
  useEffect(() => {
    if (phoneOtpSent) {
      resetCountdown();
    }
  }, [phoneOtpSent, resetCountdown]);

  // Auto-focus OTP input when OTP is sent
  useLayoutEffect(() => {
    if (phoneOtpSent && phoneOtpInputRef.current) {
      phoneOtpInputRef.current.focus();
    }
  }, [phoneOtpSent, phoneOtpInputRef]);

  // Determine if the send button should be enabled
  const canSendOtp = !phoneLoading && !phoneOtpSent && !phoneError && !!phone && agreedToTerms;

  // Handle Enter key for input
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && canSendOtp) {
        e.preventDefault();
        handleSendPhoneOtp();
      }
    },
    [canSendOtp, handleSendPhoneOtp]
  );

  // Handle Enter key for OTP input
  const handleOtpKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !phoneLoading && phoneOtpSent) {
        e.preventDefault();
        handleVerifyPhoneOtp();
      }
    },
    [phoneLoading, phoneOtpSent, handleVerifyPhoneOtp]
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
      setPhoneOtp(sanitized);
    },
    [sanitizeOtp, setPhoneOtp]
  );

  // Handle OTP input change - only allow digits
  const handleOtpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeOtp(e.target.value);
      setPhoneOtp(sanitized);

      // Reset auto-submitted flag when OTP length changes away from 6
      if (sanitized.length !== OTP_LENGTH) {
        dispatch({ type: "RESET_AUTO_SUBMITTED" });
      }
    },
    [sanitizeOtp, setPhoneOtp]
  );

  // Auto-submit when OTP reaches 6 digits
  useEffect(() => {
    if (
      phoneOtp.length === OTP_LENGTH &&
      phoneOtpSent &&
      !phoneLoading &&
      !state.autoSubmitted
    ) {
      dispatch({ type: "SET_AUTO_SUBMITTED", payload: true });
      handleVerifyPhoneOtp();
    }
  }, [phoneOtp, phoneOtpSent, phoneLoading, state.autoSubmitted, handleVerifyPhoneOtp]);

  // Handle resend with countdown
  const handleResendClick = useCallback(() => {
    if (countdownActive) {
      return;
    }
    dispatch({ type: "RESET_AUTO_SUBMITTED" });
    handleResendPhoneOtp();
    resetCountdown();
  }, [countdownActive, handleResendPhoneOtp, resetCountdown]);


  // Whether to show the OTP login form (phone only)
  // Show in all environments except miniprogram
  const showOtpLogin = !isMiniprogram;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Sign In Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="box-border w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm md:max-w-lg md:p-8 lg:max-w-xl lg:p-10">
          <h1 className="mb-2 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            聪明的背单词工具
          </h1>
          <h2 className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-10 md:text-2xl">
            登录
          </h2>

          {(wechatError || oauthError) && (
            <p
              className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive"
              role="alert"
            >
              {wechatError
                ? (isMiniprogram ? "微信登录失败，请重试。" : "微信登录失败，请重试或使用其他方式登录。")
                : "登录失败，请重试。"}
            </p>
          )}

          <div className="flex items-start gap-2 text-left my-4">
            <Checkbox
              id="agree-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              aria-describedby="agree-terms-desc"
              className="mt-0.5 shrink-0"
            />
            <Label
              htmlFor="agree-terms"
              className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
              onClick={(e) => {
                // When clicking a link inside the label, prevent the label from
                // also toggling the checkbox — let the link navigate normally.
                if ((e.target as HTMLElement).closest("a")) {
                  e.preventDefault();
                }
              }}
            >
              <span id="agree-terms-desc">使用即表示同意</span>{" "}
              <Link
                href="/terms"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                《服务条款》
              </Link>{" "}
              <span>和</span>{" "}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                《隐私政策》
              </Link>
            </Label>
          </div>

          {/* Third-party login buttons - Priority: WeChat > Apple > Phone */}
          {(showWechatLogin || showAppleLogin) && (
            <div className="mt-6">
              <div className="space-y-3">
                {/* WeChat Login - Highest Priority */}
                {showWechatLogin && (
                  <button
                    type="button"
                    disabled={!agreedToTerms || wechatLoading}
                    onClick={handleWechatLogin}
                    aria-label={
                      agreedToTerms
                        ? "使用微信扫码登录"
                        : "请先勾选同意服务条款与隐私政策后再使用微信登录"
                    }
                    title={!agreedToTerms ? "请先勾选上方「使用即表示同意《服务条款》和《隐私政策》」" : undefined}
                    className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[52px] md:px-8 md:py-4
                      bg-[#07C160] hover:bg-[#06AD56] active:bg-[#059C4D]"
                  >
                    <WeChatIcon className="h-5 w-5 shrink-0" />
                    <span>{wechatLoading ? "跳转中…" : "微信登录"}</span>
                  </button>
                )}

                {/* Apple Login - Second Priority (iOS devices) */}
                {showAppleLogin && (
                  <button
                    type="button"
                    disabled={!agreedToTerms || appleLoading}
                    onClick={handleAppleLogin}
                    aria-label={
                      agreedToTerms
                        ? "使用 Apple 账号登录"
                        : "请先勾选同意服务条款与隐私政策后再使用 Apple 登录"
                    }
                    title={!agreedToTerms ? "请先勾选上方「使用即表示同意《服务条款》和《隐私政策》」" : undefined}
                    className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[52px] md:px-8 md:py-4
                      bg-neutral-950 text-white hover:bg-neutral-800 active:bg-neutral-900
                      dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 dark:active:bg-neutral-200"
                  >
                    <AppleIcon className="h-5 w-5 shrink-0" />
                    <span>{appleLoading ? "登录中…" : "通过 Apple 登录"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phone Login - Lowest Priority */}
          {showOtpLogin && (
            <>
              {(showWechatLogin || showAppleLogin) && (
                <div className="relative my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <span className="text-sm text-muted-foreground">或</span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>
              )}

              <div className="space-y-3">
                {/* Phone Input */}
                <div>
                  <label htmlFor="phone-input" className="sr-only">
                    手机号
                  </label>
                  <Input
                    id="phone-input"
                    type="tel"
                    placeholder="手机号"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handleInputKeyDown}
                    disabled={phoneOtpSent}
                    aria-invalid={phoneError ? "true" : "false"}
                    aria-describedby={
                      phoneError ? "phone-error" : "phone-description"
                    }
                    className={cn(
                      "my-2.5 w-full px-4 py-3.5 text-base md:my-3 md:px-5 md:py-4 md:text-lg lg:py-5 lg:text-lg",
                      phoneError && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {phoneError && (
                    <p
                      id="phone-error"
                      className="mt-1 text-left text-sm text-destructive"
                      role="alert"
                    >
                      {phoneError}
                    </p>
                  )}
                  <p id="phone-description" className="sr-only">
                    请输入您的手机号以接收验证码
                  </p>
                </div>

                {/* OTP Input */}
                {phoneOtpSent && (
                  <div>
                    <label htmlFor="otp-input" className="sr-only">
                      验证码
                    </label>
                    <Input
                      id="otp-input"
                      ref={phoneOtpInputRef}
                      type="text"
                      placeholder="请输入验证码"
                      value={phoneOtp}
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
                      请输入发送到您手机的6位数字验证码
                    </p>
                  </div>
                )}
              </div>

              <div className="my-6 md:my-8">
                {!phoneOtpSent ? (
                  <Button
                    onClick={handleSendPhoneOtp}
                    loading={phoneLoading}
                    disabled={!canSendOtp}
                    size="lg"
                    aria-label="发送验证码到手机"
                    className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
                  >
                    发送验证码
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleVerifyPhoneOtp}
                      loading={phoneLoading}
                      disabled={phoneLoading || phoneOtp.length !== 6}
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
            </>
          )}
        </div>
      </div>
      <p className="pb-4 text-center text-xs text-muted-foreground/80">
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </p>
    </div>
  );
}

/** Apple logo icon following Apple's branding guidelines. */
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

/** WeChat logo icon using official SVG design. */
function WeChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="200 200 624 624"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M614.76864 440.32c6.144 0 12.12416 0.28672 18.2272 0.8192-13.80352-87.53152-99.65568-154.99264-203.5712-154.99264-113.4592 0-205.49632 80.52736-205.49632 179.8144 0 55.54176 28.79488 105.18528 73.97376 138.24-5.77536 28.8768-12.94336 66.84672-11.91936 65.536a2617.58976 2617.58976 0 0 0 66.23232-37.02784c23.83872 8.43776 49.88928 13.1072 77.2096 13.1072l8.6016-0.12288a153.1904 153.1904 0 0 1-4.87424-38.37952c0-92.20096 81.26464-166.99392 181.61664-166.99392z m-104.61184-58.69568a25.64096 25.64096 0 1 1 0.08192 51.32288 25.64096 25.64096 0 0 1-0.08192-51.32288zM352.37888 432.9472a25.68192 25.68192 0 1 1 0.08192-51.36384 25.68192 25.68192 0 0 1-0.08192 51.36384z m447.6928 168.7552c0-83.06688-78.848-150.44608-176.128-150.44608s-176.128 67.42016-176.128 150.48704 78.848 150.528 176.128 150.528c26.50112 0 51.56864-5.03808 74.1376-14.00832 23.22432 12.41088 48.5376 25.47712 49.80736 25.84576 0.90112 0.98304-4.096-23.3472-9.50272-47.88224 37.6832-27.72992 61.68576-68.64896 61.68576-114.4832z m-242.19648-33.01376a25.68192 25.68192 0 1 1-0.08192-51.36384 25.68192 25.68192 0 0 1 0.08192 51.36384z m128.4096 0a25.72288 25.72288 0 1 1 0-51.4048 25.72288 25.72288 0 0 1 0 51.4048z" fill="currentColor" />
    </svg>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
          加载中…
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
