import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

interface UseAppleSignInReturn {
  loading: boolean;
  handleAppleSignIn: () => Promise<void>;
}

/**
 * Apple Sign-In hook — uses Supabase `signInWithOAuth` redirect flow.
 *
 * Flow:
 * 1. User clicks "Apple 登录" button.
 * 2. Browser is redirected to Supabase → Apple authorization page.
 * 3. User authenticates with Apple (web page or native iOS sheet).
 * 4. Apple redirects to Supabase callback URL.
 * 5. Supabase exchanges the code, creates/authenticates the user,
 *    then redirects to the app's `/auth/callback` route.
 * 6. The app's callback handler sets the session cookies and
 *    navigates to the target page.
 *
 * Prerequisites:
 * - **Apple Developer Console**:
 *   1. Create a Services ID with "Sign In with Apple" enabled.
 *   2. Add Return URL: `https://<project>.supabase.co/auth/v1/callback`
 *      (No hosting-domain verification required for the redirect flow.)
 *   3. Generate a private key for the Services ID.
 * - **Supabase Dashboard**:
 *   1. Auth → Providers → Apple → Enabled.
 *   2. Set the client_id (Services ID) and secret (Apple client secret JWT).
 *   3. Auth → URL Configuration → add **ALL** app origins to Redirect URLs.
 *      **Every domain that can initiate sign-in must be listed**, including
 *      both production and preview environments. For example:
 *        - `https://www.example.com/**`
 *        - `https://preview.example.com/**`
 *      If a domain is missing, Supabase silently falls back to `site_url`,
 *      causing the user to land on the wrong domain after authentication.
 * - **App Environment**:
 *   Set `NEXT_PUBLIC_APPLE_CLIENT_ID` so the Apple button is rendered.
 */
export function useAppleSignIn(): UseAppleSignInReturn {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  const handleAppleSignIn = useCallback(async () => {
    if (typeof window === "undefined") return;

    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Apple 登录未配置");
      return;
    }

    setLoading(true);

    try {
      const nextPath = searchParams.get("next") ?? "/learn";
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      logger.info("Apple Sign-In: initiating OAuth redirect", {
        origin,
        redirectTo,
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo,
          scopes: "name email",
        },
      });

      if (error) {
        logger.error("Apple Sign-In: signInWithOAuth failed", {
          message: error.message,
        });
        toast.error("Apple 登录失败，请重试。");
        setLoading(false);
        return;
      }

      // Browser will be redirected — keep loading=true during navigation
    } catch (err: unknown) {
      logger.error("Apple Sign-In exception", { error: err });
      toast.error("Apple 登录失败，请重试。");
      setLoading(false);
    }
  }, [supabase, searchParams]);

  return { loading, handleAppleSignIn };
}
