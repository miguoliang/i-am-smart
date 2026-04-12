import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createServerClient } from "@supabase/ssr";
import {
  apiSuccess,
  handleApiError,
  ApiError,
  PUBLIC_INTERNAL_ERROR_MESSAGE,
} from "@/lib/utils/apiError";
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
      logger.warn("Miniprogram login: missing or invalid code", { code });
      throw ApiError.validationError("code is required");
    }

    logger.info("Miniprogram login: received code", { codeLength: code.length });

    const appId = process.env.WECHAT_MINIPROGRAM_APP_ID;
    const appSecret = process.env.WECHAT_MINIPROGRAM_APP_SECRET;

    if (!appId || !appSecret) {
      logger.error("Miniprogram login: WECHAT_MINIPROGRAM_APP_ID or APP_SECRET not set", {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });
      throw ApiError.internal("小程序登录未配置");
    }

    logger.info("Miniprogram login: exchanging code for openid", { appId });

    // Exchange code for openid/session_key
    const code2sessionUrl = `${WECHAT_MINIPROGRAM_API_BASE}/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    
    logger.debug("Miniprogram login: calling WeChat API", { url: code2sessionUrl.replace(appSecret, "***") });
    
    const tokenRes = await fetch(code2sessionUrl);

    if (!tokenRes.ok) {
      logger.error("Miniprogram login: WeChat API request failed", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
      });
      throw ApiError.internal("微信登录服务异常");
    }

    const tokenData = (await tokenRes.json()) as WeChatMiniProgramLoginResponse;

    logger.info("Miniprogram login: WeChat API response", {
      hasOpenid: !!tokenData.openid,
      hasUnionid: !!tokenData.unionid,
      errcode: tokenData.errcode,
    });

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
    logger.info("Miniprogram login: using wechatId", { wechatId, isUnionid: !!tokenData.unionid });
    
    const admin = createSupabaseAdmin();

    // Find or create user
    logger.debug("Miniprogram login: searching for existing account", { wechatId });
    const { data: accountRow, error: accountError } = await admin
      .from("accounts")
      .select("id")
      .eq("wechat_id", wechatId)
      .maybeSingle();

    if (accountError) {
      logger.error("Miniprogram login: account lookup failed", { error: accountError.message });
      throw ApiError.internal("查询用户失败");
    }

    let email: string;
    let userId: string;

    if (accountRow?.id) {
      logger.info("Miniprogram login: found existing account", { userId: accountRow.id });
      userId = accountRow.id;
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
      if (userError || !userData?.user?.email) {
        logger.error("Miniprogram login: getUserById failed", { error: userError?.message });
        throw ApiError.internal("获取用户信息失败");
      }
      email = userData.user.email;
      logger.info("Miniprogram login: existing user email", { email });
    } else {
      logger.info("Miniprogram login: creating new user", { wechatId });
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

      logger.debug("Miniprogram login: updating accounts table", { userId, wechatId });
      
      // The trigger should have created the accounts record automatically
      // Wait a bit to ensure trigger execution, then update wechat_id
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update wechat_id (account should exist due to trigger)
      const { error: updateError, data: updateData } = await admin
        .from("accounts")
        .update({ wechat_id: wechatId })
        .eq("id", userId)
        .select();

      if (updateError) {
        logger.error("Miniprogram login: UPDATE accounts wechat_id failed", {
          message: updateError.message,
          code: updateError.code,
        });
        // If account doesn't exist (trigger didn't fire), create it
        const { error: insertError } = await admin
          .from("accounts")
          .insert({ 
            id: userId, 
            wechat_id: wechatId,
            username: `miniprogram_${wechatId.substring(0, 20)}`,
          });
        
        if (insertError) {
          logger.error("Miniprogram login: INSERT accounts also failed", {
            message: insertError.message,
          });
          throw ApiError.internal("更新用户信息失败");
        }
        logger.info("Miniprogram login: created accounts record manually", { userId });
      } else {
        logger.debug("Miniprogram login: updated accounts wechat_id", { 
          userId, 
          updatedRows: updateData?.length || 0 
        });
      }

      email = syntheticEmail;
      logger.info("Miniprogram login: new user created", { userId, email });
    }

    // Generate a magic link OTP and verify it to get session token
    logger.debug("Miniprogram login: generating magic link", { email });
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const emailOtp = linkData?.properties?.email_otp;
    const hashedToken = linkData?.properties?.hashed_token;
    
    logger.debug("Miniprogram login: generateLink response", {
      hasLinkData: !!linkData,
      hasOtp: !!emailOtp,
      hasHashedToken: !!hashedToken,
      linkDataKeys: linkData ? Object.keys(linkData) : [],
      propertiesKeys: linkData?.properties ? Object.keys(linkData.properties) : [],
    });

    if (linkError || !emailOtp) {
      logger.error("Miniprogram login: generateLink failed", { 
        error: linkError?.message,
        hasLinkData: !!linkData,
        hasOtp: !!emailOtp,
      });
      throw ApiError.internal("生成登录凭证失败");
    }

    logger.debug("Miniprogram login: magic link generated, verifying OTP", {
      email,
      hasOtp: !!emailOtp,
      otpLength: emailOtp?.length,
    });

    // Create a Supabase client without cookies (for miniprogram)
    // Verify OTP to get session token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error("Miniprogram login: Supabase config missing", {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
      });
      throw ApiError.internal("服务器配置错误");
    }

    logger.debug("Miniprogram login: creating Supabase client", {
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {}, // No-op: miniprogram doesn't use cookies
        },
      }
    );

    logger.debug("Miniprogram login: calling verifyOtp", {
      email,
      tokenLength: emailOtp?.length,
      type: "magiclink",
    });

    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: "magiclink",
    });

    logger.debug("Miniprogram login: verifyOtp response", {
      hasError: !!verifyError,
      errorMessage: verifyError?.message,
      errorStatus: verifyError?.status,
      hasSession: !!verifyData?.session,
      hasAccessToken: !!verifyData?.session?.access_token,
      hasUser: !!verifyData?.user,
    });

    if (verifyError) {
      logger.error("Miniprogram login: verifyOtp failed", {
        error: verifyError.message,
        errorStatus: verifyError.status,
        errorName: verifyError.name,
        email,
        otpLength: emailOtp?.length,
      });
      throw ApiError.internal(PUBLIC_INTERNAL_ERROR_MESSAGE);
    }

    if (!verifyData?.session?.access_token) {
      logger.error("Miniprogram login: verifyOtp succeeded but no access token", {
        hasSession: !!verifyData?.session,
        hasAccessToken: !!verifyData?.session?.access_token,
        sessionKeys: verifyData?.session ? Object.keys(verifyData.session) : [],
      });
      throw ApiError.internal("验证登录凭证失败: 未获取到访问令牌");
    }

    const sessionData = verifyData;
    const session = sessionData.session;

    if (!session) {
      logger.error("Miniprogram login: session is null after verifyOtp", {
        hasSessionData: !!sessionData,
        sessionDataKeys: sessionData ? Object.keys(sessionData) : [],
      });
      throw ApiError.internal("验证登录凭证失败: 会话数据为空");
    }

    logger.info("Miniprogram login: success", { 
      userId,
      email,
      hasAccessToken: !!session.access_token,
    });

    return apiSuccess({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      user: {
        id: userId,
        email,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
