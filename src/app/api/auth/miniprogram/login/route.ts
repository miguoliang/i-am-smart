import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createServerClient } from "@supabase/ssr";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { logger } from "@/lib/utils/logger";

const WECHAT_MINIPROGRAM_API_BASE = "https://api.weixin.qq.com";

interface WeChatMiniProgramLoginResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

/**
 * 小程序登录：用 wx.login() 的 code 换取 openid，然后创建/查找用户，返回 access_token
 * POST /api/auth/miniprogram/login
 * Body: { code: string }
 * Response: { data: { access_token: string, user: {...} } }
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      throw ApiError.validationError("code is required");
    }

    const appId = process.env.WECHAT_MINIPROGRAM_APP_ID;
    const appSecret = process.env.WECHAT_MINIPROGRAM_APP_SECRET;

    if (!appId || !appSecret) {
      logger.error("Miniprogram login: WECHAT_MINIPROGRAM_APP_ID or APP_SECRET not set");
      throw ApiError.internal("小程序登录未配置");
    }

    // Exchange code for openid/session_key
    const tokenRes = await fetch(
      `${WECHAT_MINIPROGRAM_API_BASE}/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    );

    const tokenData = (await tokenRes.json()) as WeChatMiniProgramLoginResponse;

    if (tokenData.errcode || !tokenData.openid) {
      logger.warn("Miniprogram code2session failed", {
        errcode: tokenData.errcode,
        errmsg: tokenData.errmsg,
      });
      throw ApiError.validationError(
        tokenData.errmsg ?? "微信登录失败，请重试"
      );
    }

    const wechatId = tokenData.unionid ?? tokenData.openid;
    const admin = createSupabaseAdmin();

    // Find or create user
    const { data: accountRow } = await admin
      .from("accounts")
      .select("id")
      .eq("wechat_id", wechatId)
      .maybeSingle();

    let email: string;
    let userId: string;

    if (accountRow?.id) {
      userId = accountRow.id;
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError || !userData?.user?.email) {
        logger.error("Miniprogram login: getUserById failed", { error: userError?.message });
        throw ApiError.internal("获取用户信息失败");
      }
      email = userData.user.email;
    } else {
      // Create new user
      const syntheticEmail = `miniprogram_${wechatId}@miniprogram.placeholder`;
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          wechat_openid: tokenData.openid,
          wechat_unionid: tokenData.unionid ?? null,
        },
      });

      if (createError) {
        logger.error("Miniprogram login: createUser failed", { message: createError.message });
        throw ApiError.internal("创建用户失败");
      }

      userId = createData.user?.id;
      if (!userId) {
        logger.error("Miniprogram login: createUser returned no user id");
        throw ApiError.internal("创建用户失败");
      }

      const { error: updateError } = await admin
        .from("accounts")
        .update({ wechat_id: wechatId })
        .eq("id", userId);

      if (updateError) {
        logger.error("Miniprogram login: UPDATE accounts wechat_id failed", {
          message: updateError.message,
        });
        throw ApiError.internal("更新用户信息失败");
      }

      email = syntheticEmail;
    }

    // Generate a magic link OTP and verify it to get session token
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const emailOtp = linkData?.properties?.email_otp;
    if (linkError || !emailOtp) {
      logger.error("Miniprogram login: generateLink failed", { error: linkError?.message });
      throw ApiError.internal("生成登录凭证失败");
    }

    // Create a Supabase client without cookies (for miniprogram)
    // Verify OTP to get session token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {}, // No-op: miniprogram doesn't use cookies
        },
      }
    );

    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: "magiclink",
    });

    if (verifyError || !sessionData?.session?.access_token) {
      logger.error("Miniprogram login: verifyOtp failed", { error: verifyError?.message });
      throw ApiError.internal("验证登录凭证失败");
    }

    return apiSuccess({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      expires_at: sessionData.session.expires_at,
      user: {
        id: userId,
        email,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
