import { createHmac } from "crypto";

export const WECHAT_OAUTH_STATE_COOKIE_NAME = "wechat_oauth_state";

export function signState(state: string, secret: string): string {
  return createHmac("sha256", secret).update(state).digest("hex");
}

export function verifyStateCookie(
  cookieValue: string | undefined,
  stateFromQuery: string,
  secret: string
): boolean {
  if (!cookieValue || !stateFromQuery || !secret) return false;
  const dot = cookieValue.indexOf(".");
  if (dot === -1) return false;
  const state = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);
  if (state !== stateFromQuery) return false;
  const expected = signState(state, secret);
  return signature.length > 0 && timingSafeEqual(signature, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
