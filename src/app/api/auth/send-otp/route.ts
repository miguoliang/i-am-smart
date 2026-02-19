import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import {
  isRateLimitError,
  getRateLimitErrorMessage,
} from "@/lib/utils/errorHandling";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { isValidEmail } from "@/lib/utils/emailValidation";

export async function POST(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
      return NextResponse.json(
        { error: "生产环境仅支持微信登录" },
        { status: 403 }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      throw ApiError.validationError("邮箱不能为空");
    }

    // Email validation using shared utility
    if (!isValidEmail(email)) {
      throw ApiError.validationError("邮箱格式不正确");
    }

    const supabase = await createRouteHandlerClient();

    // 使用 signInWithOtp 发送 OTP 验证码
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      if (isRateLimitError(error.message)) {
        // Handle rate limit specifically as it needs custom message parsing
        return NextResponse.json(
          {
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: getRateLimitErrorMessage(error.message, "重新发送验证码")
            }
          },
          { status: 429 } 
        );
      }
      throw ApiError.validationError(error.message);
    }

    return apiSuccess({
      success: true,
      message: "验证码已发送到您的邮箱",
    });
  } catch (error) {
    return handleApiError(error);
  }
}