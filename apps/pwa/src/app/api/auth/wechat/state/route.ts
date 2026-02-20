import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logger } from "@/lib/utils/logger";
import {
  WECHAT_OAUTH_STATE_COOKIE_NAME,
  WECHAT_POST_LOGIN_NEXT_COOKIE_NAME,
  signState,
} from "../wechatState";

const COOKIE_MAX_AGE_SECONDS = 600; // 10 minutes

/** Allow only relative paths (e.g. /pay, /learn) to avoid open redirect. */
function isValidNextPath(path: string | null): path is string {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes(":")) return false;
  return path.length <= 500;
}

function getSecret(): string | null {
  return process.env.WECHAT_OPEN_APP_SECRET ?? null;
}

export async function GET(request: NextRequest) {
  const secret = getSecret();
  if (!secret) {
    logger.warn("WeChat state: WECHAT_OPEN_APP_SECRET not set");
    return NextResponse.json({ error: "WeChat login not configured" }, { status: 503 });
  }

  const state = randomBytes(24).toString("hex");
  const signature = signState(state, secret);
  const value = `${state}.${signature}`;

  const response = NextResponse.json({ state });
  response.cookies.set(WECHAT_OAUTH_STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  const nextParam = request.nextUrl.searchParams.get("next");
  if (isValidNextPath(nextParam)) {
    response.cookies.set(WECHAT_POST_LOGIN_NEXT_COOKIE_NAME, nextParam, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  return response;
}
