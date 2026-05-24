import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError } from "@/lib/utils/apiError";
import { logger } from "@/lib/utils/logger";

const OTP_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const OTP_RATE_LIMIT_MAX_ATTEMPTS = 5;

export type OtpRateLimitAction = "send" | "verify";

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "unknown";
}

export function getOtpRateLimitKeys({
  action,
  phone,
  ip,
}: {
  action: OtpRateLimitAction;
  phone: string;
  ip: string;
}): string[] {
  return [`otp:${action}:ip:${ip}`, `otp:${action}:phone:${phone}`];
}

export async function checkOtpRateLimit(keys: string[]): Promise<boolean> {
  const admin = createSupabaseAdmin();

  for (const key of keys) {
    const { data, error } = await admin.rpc("check_otp_rate_limit", {
      p_key: key,
      p_max_attempts: OTP_RATE_LIMIT_MAX_ATTEMPTS,
      p_window_seconds: OTP_RATE_LIMIT_WINDOW_SECONDS,
    });

    if (error) {
      logger.error("OTP rate limit check failed", {
        key,
        error: error.message,
      });
      throw ApiError.internal("验证码服务暂时不可用，请稍后重试");
    }

    if (data !== true) {
      return false;
    }
  }

  return true;
}
