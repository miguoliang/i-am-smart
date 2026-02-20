import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { logger } from "@/lib/utils/logger";
import {
  WECHAT_OAUTH_STATE_COOKIE_NAME,
  WECHAT_POST_LOGIN_NEXT_COOKIE_NAME,
  verifyStateCookie,
} from "../wechatState";

const WECHAT_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token";

interface WeChatTokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (!origin) {
    throw new Error("NEXT_PUBLIC_APP_ORIGIN is required for WeChat callback");
  }
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/**
 * Resolve WECHAT_OPEN_APP_ID with fallback to NEXT_PUBLIC_ variant.
 * Users commonly set only the NEXT_PUBLIC_ variable; it is also available
 * on the server in Next.js, so we use it as a fallback.
 */
function getWeChatAppId(): string | undefined {
  return process.env.WECHAT_OPEN_APP_ID || process.env.NEXT_PUBLIC_WECHAT_OPEN_APP_ID;
}

export async function GET(request: NextRequest) {
  const signinUrl = `${getAppOrigin()}/signin`;
  const errorRedirect = `${signinUrl}?error=wechat_failed`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || state.length < 10) {
      logger.warn("WeChat callback missing or invalid code/state", {
        hasCode: !!code,
        hasState: !!state,
        stateLength: state?.length,
      });
      return NextResponse.redirect(errorRedirect);
    }

    const appId = getWeChatAppId();
    const appSecret = process.env.WECHAT_OPEN_APP_SECRET;
    if (!appId || !appSecret) {
      logger.error("WeChat callback: WECHAT_OPEN_APP_ID or WECHAT_OPEN_APP_SECRET not set", {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
      });
      return NextResponse.redirect(errorRedirect);
    }

    // Read the state cookie from the incoming request directly instead of
    // using cookies() from next/headers to avoid header-merging issues.
    const stateCookie = request.cookies.get(WECHAT_OAUTH_STATE_COOKIE_NAME)?.value;
    if (!verifyStateCookie(stateCookie, state, appSecret)) {
      logger.warn("WeChat callback state mismatch or missing cookie", {
        hasCookie: !!stateCookie,
      });
      const res = NextResponse.redirect(errorRedirect);
      res.cookies.set(WECHAT_OAUTH_STATE_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    // --- Exchange WeChat code for access token ---
    const tokenRes = await fetch(
      `${WECHAT_TOKEN_URL}?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`
    );
    const tokenData = (await tokenRes.json()) as WeChatTokenResponse;

    if (tokenData.errcode || !tokenData.openid) {
      logger.warn("WeChat token exchange failed", {
        errcode: tokenData.errcode,
        errmsg: tokenData.errmsg,
      });
      return NextResponse.redirect(errorRedirect);
    }

    // --- Find or create user ---
    const wechatId = tokenData.unionid ?? tokenData.openid;
    const admin = createSupabaseAdmin();

    const { data: accountRow } = await admin
      .from("accounts")
      .select("id")
      .eq("wechat_id", wechatId)
      .maybeSingle();

    let email: string;

    if (accountRow?.id) {
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(
        accountRow.id
      );
      if (userError || !userData?.user?.email) {
        logger.error("WeChat callback: getUserById failed", { error: userError?.message });
        return NextResponse.redirect(errorRedirect);
      }
      email = userData.user.email;
    } else {
      const syntheticEmail = `wechat_${wechatId}@wechat.placeholder`;
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        email_confirm: true,
        user_metadata: {
          wechat_openid: tokenData.openid,
          wechat_unionid: tokenData.unionid ?? null,
        },
      });

      if (createError) {
        logger.error("WeChat callback: createUser failed", { message: createError.message });
        return NextResponse.redirect(errorRedirect);
      }

      const userId = createData.user?.id;
      if (!userId) {
        logger.error("WeChat callback: createUser returned no user id");
        return NextResponse.redirect(errorRedirect);
      }

      const { error: updateError } = await admin
        .from("accounts")
        .update({ wechat_id: wechatId })
        .eq("id", userId);

      if (updateError) {
        logger.error("WeChat callback: UPDATE accounts wechat_id failed", {
          message: updateError.message,
        });
        return NextResponse.redirect(errorRedirect);
      }

      email = syntheticEmail;
    }

    // --- Establish session server-side ---
    // Generate a one-time OTP via the admin API, then verify it with a
    // regular Supabase client so session cookies are written to the
    // redirect response.  This avoids the previous magic-link-redirect
    // approach which broke under the PKCE flow (no code verifier on the
    // client meant the session was never established).
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const emailOtp = linkData?.properties?.email_otp;
    if (linkError || !emailOtp) {
      logger.error("WeChat callback: generateLink failed", { error: linkError?.message });
      return NextResponse.redirect(errorRedirect);
    }

    // Resolve post-login redirect: next path from cookie (e.g. /pay) or default /learn
    const nextPath = request.cookies.get(WECHAT_POST_LOGIN_NEXT_COOKIE_NAME)?.value;
    const safePath =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.includes(":")
        ? nextPath
        : "/learn";
    const successUrl = `${getAppOrigin()}${safePath}`;
    const response = NextResponse.redirect(successUrl);

    // Clear the OAuth state cookie and post-login-next cookie
    response.cookies.set(WECHAT_OAUTH_STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    response.cookies.set(WECHAT_POST_LOGIN_NEXT_COOKIE_NAME, "", { path: "/", maxAge: 0 });

    // Create a Supabase client that reads cookies from the incoming request
    // and writes session cookies onto the outgoing redirect response.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp,
      type: "magiclink",
    });

    if (verifyError) {
      logger.error("WeChat callback: verifyOtp failed", { error: verifyError.message });
      return NextResponse.redirect(errorRedirect);
    }

    return response;
  } catch (err) {
    logger.error("WeChat callback exception", { error: err });
    return NextResponse.redirect(errorRedirect);
  }
}