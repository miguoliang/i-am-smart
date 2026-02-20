import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { isValidPhone, sanitizePhone, formatPhoneForSupabase } from "@/lib/utils/phoneValidation";

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

    const supabase = await createRouteHandlerClient();

    const phoneWithCode = formatPhoneForSupabase(sanitized);

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneWithCode,
      options: {
        shouldCreateUser: false,
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
