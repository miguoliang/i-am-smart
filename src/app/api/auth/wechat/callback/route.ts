import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { logger } from "@/lib/utils/logger";
import {
  WECHAT_OAUTH_STATE_COOKIE_NAME,
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
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  if (!origin) {
    throw new Error("NEXT_PUBLIC_APP_ORIGIN or VERCEL_URL is required for WeChat callback");
  }
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export async function GET(request: NextRequest) {
  const signinUrl = `${getAppOrigin()}/signin`;
  const errorRedirect = `${signinUrl}?error=wechat_failed`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || state.length < 10) {
      logger.warn("WeChat callback missing or invalid code/state");
      return NextResponse.redirect(errorRedirect);
    }

    const appId = process.env.WECHAT_OPEN_APP_ID;
    const appSecret = process.env.WECHAT_OPEN_APP_SECRET;
    if (!appId || !appSecret) {
      logger.error("WeChat callback: WECHAT_OPEN_APP_ID or WECHAT_OPEN_APP_SECRET not set");
      return NextResponse.redirect(errorRedirect);
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(WECHAT_OAUTH_STATE_COOKIE_NAME)?.value;
    if (!verifyStateCookie(stateCookie, state, appSecret)) {
      logger.warn("WeChat callback state mismatch or missing cookie");
      const res = NextResponse.redirect(errorRedirect);
      res.cookies.set(WECHAT_OAUTH_STATE_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
      return res;
    }

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

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink) {
      logger.error("WeChat callback: generateLink failed", { error: linkError?.message });
      return NextResponse.redirect(errorRedirect);
    }

    const magicLinkUrl = actionLink.startsWith("http")
      ? actionLink
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")}/${actionLink.replace(/^\//, "")}`;
    const successRes = NextResponse.redirect(magicLinkUrl);
    successRes.cookies.set(WECHAT_OAUTH_STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return successRes;
  } catch (err) {
    logger.error("WeChat callback exception", { error: err });
    return NextResponse.redirect(errorRedirect);
  }
}