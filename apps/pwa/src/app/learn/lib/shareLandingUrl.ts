/**
 * URL encoded in the share card QR (landing page / app entry).
 * Prefer explicit site URL in env; fall back to current origin in the browser.
 */
export function resolveShareLandingUrl(): string {
  const fromEnv =
    typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_ORIGIN);
  if (fromEnv && typeof fromEnv === "string") {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://iamsmart.top";
}
