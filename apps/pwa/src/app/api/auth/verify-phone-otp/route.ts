import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { isValidPhone, sanitizePhone, formatPhoneForSupabase } from "@/lib/utils/phoneValidation";
import { logger } from "@/lib/utils/logger";
import { getTestOtpCode, getTestPhoneWhitelist } from "@/lib/auth/testPhoneWhitelist";
import {
  checkOtpRateLimit,
  getClientIp,
  getOtpRateLimitKeys,
} from "@/lib/auth/otpRateLimit";
import type { SupabaseClient } from "@supabase/supabase-js";

async function findAuthUserByPhoneOrEmail(
  admin: SupabaseClient,
  phone: string,
  email: string
): Promise<string | null> {
  const { data, error } = await admin.rpc("find_auth_user_by_phone_or_email", {
    p_phone: phone,
    p_email: email,
  });

  if (error) {
    logger.error("[verify-phone-otp] Auth user lookup failed", {
      error: error.message,
    });
    throw ApiError.internal("用户查询失败");
  }

  return typeof data === "string" && data.length > 0 ? data : null;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, token } = await req.json();

    if (!phone || typeof phone !== "string") {
      throw ApiError.validationError("手机号不能为空");
    }
    if (!token || typeof token !== "string") {
      throw ApiError.validationError("验证码不能为空");
    }

    const sanitized = sanitizePhone(phone);
    if (!isValidPhone(sanitized)) {
      throw ApiError.validationError("手机号格式不正确");
    }

    const clientIp = getClientIp(req);
    const isAllowed = await checkOtpRateLimit(
      getOtpRateLimitKeys({ action: "verify", phone: sanitized, ip: clientIp })
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

    // Whitelist check
    const whitelist = getTestPhoneWhitelist();
    const testOtp = getTestOtpCode();

    if (testOtp && whitelist.includes(sanitized)) {
      if (token !== testOtp) {
        throw ApiError.validationError("验证码无效或已过期，请重新获取验证码");
      }

      logger.info("[verify-phone-otp] Whitelist phone verified", { phone: sanitized });

      // Use admin to generate a magic link token, then exchange for session
      const admin = createSupabaseAdmin();
      const phoneWithCode = formatPhoneForSupabase(sanitized);
      const email = `${sanitized}@test.iamsmart.top`;

      let userId = await findAuthUserByPhoneOrEmail(admin, phoneWithCode, email);

      if (!userId) {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          phone: phoneWithCode,
          email,
          email_confirm: true,
          phone_confirm: true,
        });
        if (createError || !created.user) {
          throw ApiError.internal("创建测试用户失败");
        }
        userId = created.user.id;
      }

      // Generate magic link and exchange for session
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (linkError || !linkData?.properties?.email_otp) {
        throw ApiError.internal("生成登录凭证失败");
      }

      const { data: sessionData, error: sessionError } = await admin.auth.verifyOtp({
        email,
        token: linkData.properties.email_otp,
        type: "magiclink",
      });
      if (sessionError || !sessionData?.session) {
        throw ApiError.internal("验证登录凭证失败");
      }

      return apiSuccess({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
        user: { id: userId },
      });
    }

    // Non-whitelist: proxy to Supabase verifyOtp via server client
    const supabase = await createRouteHandlerClient();
    const phoneWithCode = formatPhoneForSupabase(sanitized);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneWithCode,
      token,
      type: "sms",
    });

    if (error) {
      throw ApiError.validationError(error.message);
    }

    if (!data.session) {
      throw ApiError.internal("验证失败，请重试");
    }

    return apiSuccess({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      user: { id: data.user?.id },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
