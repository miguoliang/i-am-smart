import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Generic OAuth callback handler.
 *
 * After the user completes an external OAuth flow (e.g. Apple Sign-In),
 * Supabase redirects here with a `code` query-parameter.  We exchange
 * that code for a session (which sets cookies on the response), then:
 *
 * - **Popup mode** (`window.opener` exists): send a `postMessage` to the
 *   parent window so it can react (e.g. redirect) and close the popup.
 * - **Redirect mode** (direct navigation): redirect the browser to the
 *   desired destination (defaults to `/learn`).
 */

/** Only allow safe relative paths to prevent open-redirect. */
function safePath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/learn";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) return "/learn";
  if (/[\u0000-\u001F\u007F<>]/.test(raw)) return "/learn";
  if (raw.length > 500) return "/learn";
  return raw;
}

function buildSuccessHtml(origin: string, fallbackPath: string): string {
  const encodedOrigin = JSON.stringify(origin);
  const encodedFallback = JSON.stringify(fallbackPath);

  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="utf-8"><title>登录成功</title></head>
<body>
<p style="text-align:center;margin-top:40vh;font-family:system-ui;color:#333;">登录成功，正在跳转…</p>
<script>
(function(){
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({type:'OAUTH_COMPLETE',success:true},${encodedOrigin});
      window.close();
      return;
    }
  } catch(e) {}
  window.location.replace(${encodedFallback});
})();
</script>
</body>
</html>`;
}

function buildErrorHtml(origin: string): string {
  const encodedOrigin = JSON.stringify(origin);
  return `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="utf-8"><title>登录失败</title></head>
<body>
<p style="text-align:center;margin-top:40vh;font-family:system-ui;color:#c00;">登录失败，请重试</p>
<script>
(function(){
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({type:'OAUTH_COMPLETE',success:false},${encodedOrigin});
      window.close();
      return;
    }
  } catch(e) {}
  window.location.replace('/signin?error=oauth_failed');
})();
</script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"));

  if (!code) {
    logger.warn("OAuth callback: missing code parameter");
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Prepare an HTML response that handles both popup and redirect modes.
  const successHtml = buildSuccessHtml(origin, next);
  const response = new NextResponse(successHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  // Create a Supabase client that reads/writes cookies on the request/response pair.
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
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.error("OAuth callback: exchangeCodeForSession failed", {
      message: error.message,
    });
    return new NextResponse(buildErrorHtml(origin), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return response;
}
