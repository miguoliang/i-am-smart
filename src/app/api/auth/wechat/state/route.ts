import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { logger } from "@/lib/utils/logger";
import {
  WECHAT_OAUTH_STATE_COOKIE_NAME,
  signState,
} from "../wechatState";

const COOKIE_MAX_AGE_SECONDS = 600; // 10 minutes

function getSecret(): string | null {
  return process.env.WECHAT_OPEN_APP_SECRET ?? null;
}

export async function GET() {
  const secret = getSecret();
  if (!secret) {
    logger.warn("WeChat state: WECHAT_OPEN_APP_SECRET not set");
    return NextResponse.json({ error: "WeChat login not configured" }, { status: 503 });
  }

  const state = randomBytes(24).toString("hex");
  const signature = signState(state, secret);
  const value = `${state}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(WECHAT_OAUTH_STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return NextResponse.json({ state });
}
