import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { isValidPhone, sanitizePhone, formatPhoneForSupabase } from "@/lib/utils/phoneValidation";
import { logger } from "@/lib/utils/logger";
import { getTestPhoneWhitelist } from "@/lib/auth/testPhoneWhitelist";
import {
  checkOtpRateLimit,
  getClientIp,
  getOtpRateLimitKeys,
} from "@/lib/auth/otpRateLimit";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      throw ApiError.validationError("手机号不能为空");
    }

    const sanitized = sanitizePhone(phone);

    if (!isValidPhone(sanitized)) {
      throw ApiError.validationError("手机号格式不正确");
    }

    const clientIp = getClientIp(req);
    const isAllowed = await checkOtpRateLimit(
      getOtpRateLimitKeys({ action: "send", phone: sanitized, ip: clientIp })
    );
    if (!isAllowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "请求过于频繁，请稍后再试",
          },
        },
        { status: 429 }
      );
    }

    // Whitelist check: skip real SMS for test phones (e.g. WeChat Pay review)
    const whitelist = getTestPhoneWhitelist();
    if (whitelist.includes(sanitized)) {
      logger.info("[send-phone-otp] Whitelist phone, skipping SMS", { phone: sanitized });
      return apiSuccess({ success: true, message: "验证码已发送到您的手机" });
    }

    const supabase = await createRouteHandlerClient();

    const phoneWithCode = formatPhoneForSupabase(sanitized);

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneWithCode,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      if (isRateLimitError(error.message)) {
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: getRateLimitErrorMessage(error.message, "重新发送验证码"),
            },
          },
          { status: 429 }
        );
      }

      // Supabase Auth Hook misconfiguration — the send_sms hook is enabled
      // but its authorization secret is missing or invalid on the GoTrue side.
      // Log the real error for operators; show a generic message to users.
      if (error.message.toLowerCase().includes("hook requires authorization")) {
        logger.error("[send-phone-otp] Auth hook misconfigured", {
          message: error.message,
          hint: "check Supabase Dashboard > Auth > Hooks > Send SMS secret",
        });
        throw ApiError.internal("短信服务暂时不可用，请稍后重试");
      }

      throw ApiError.validationError(error.message);
    }

    return apiSuccess({
      success: true,
      message: "验证码已发送到您的手机",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
