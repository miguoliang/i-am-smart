import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

/* ------------------------------------------------------------------ */
/*  Apple JS SDK type declarations                                     */
/* ------------------------------------------------------------------ */

interface AppleSignInResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

interface AppleAuthAPI {
  init: (config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    usePopup: boolean;
    nonce?: string;
    state?: string;
  }) => void;
  signIn: () => Promise<AppleSignInResponse>;
}

declare global {
  interface Window {
    AppleID?: { auth: AppleAuthAPI };
  }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const APPLE_JS_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Singleton promise so the SDK script is loaded at most once. */
let sdkLoadPromise: Promise<void> | null = null;

function loadAppleSDK(): Promise<void> {
  if (typeof window !== "undefined" && window.AppleID) {
    return Promise.resolve();
  }
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = APPLE_JS_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error("Failed to load Apple Sign-In SDK"));
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Generate a cryptographically random nonce and its SHA-256 hash.
 *
 * - The **raw** nonce is sent to Supabase `signInWithIdToken`.
 * - The **hashed** nonce is passed to Apple SDK `init` so that Apple
 *   embeds it in the `id_token`.  Supabase verifies they match.
 */
async function generateNonce(): Promise<{
  nonce: string;
  hashedNonce: string;
}> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  const encoded = new TextEncoder().encode(nonce);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hashedNonce = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

  return { nonce, hashedNonce };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

interface UseAppleSignInReturn {
  loading: boolean;
  handleAppleSignIn: () => Promise<void>;
}

/**
 * Apple Sign-In hook — uses the **Apple JS SDK** with `usePopup: true`.
 *
 * On iOS (including PWA), this triggers the **native system Apple ID
 * authentication sheet** (Face ID / Touch ID) instead of a browser
 * redirect or window.open popup.
 *
 * Flow:
 * 1. Load Apple JS SDK on demand.
 * 2. Generate a nonce pair (raw + SHA-256 hash).
 * 3. Call `AppleID.auth.signIn()` — iOS shows the native sheet;
 *    desktop shows Apple's popup.
 * 4. On success receive the `id_token` from Apple.
 * 5. Pass the token to Supabase `signInWithIdToken` to create /
 *    authenticate the session entirely client-side (no redirect).
 * 6. Navigate to the target page.
 */
export function useAppleSignIn(): UseAppleSignInReturn {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
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
      // 1. Load Apple JS SDK (cached after first load)
      await loadAppleSDK();

      // 2. Generate nonce
      const { nonce, hashedNonce } = await generateNonce();

      // 3. Initialise & invoke Apple Sign-In
      //    `usePopup: true` → iOS native sheet / desktop popup
      //    `redirectURI` is required by Apple for validation but no
      //    redirect actually happens in popup mode.
      //    Use NEXT_PUBLIC_APP_ORIGIN when set so the URI always matches
      //    what is registered in the Apple Developer Console (avoids
      //    "Invalid web redirect url" on preview / non-production hosts).
      const origin = process.env.NEXT_PUBLIC_APP_ORIGIN
        ? process.env.NEXT_PUBLIC_APP_ORIGIN.replace(/\/$/, "")
        : window.location.origin;

      window.AppleID!.auth.init({
        clientId,
        scope: "name email",
        redirectURI: `${origin}/auth/callback`,
        usePopup: true,
        nonce: hashedNonce,
      });

      const response = await window.AppleID!.auth.signIn();

      // 4. Exchange Apple id_token for a Supabase session
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: response.authorization.id_token,
        nonce,
      });

      if (error) {
        logger.error("Apple Sign-In: signInWithIdToken failed", {
          message: error.message,
        });
        toast.error("Apple 登录失败，请重试。");
        setLoading(false);
        return;
      }

      // 5. Navigate — keep loading=true during redirect
      const nextPath = searchParams.get("next") ?? "/learn";
      router.push(nextPath);
    } catch (err: unknown) {
      // Apple SDK rejects when the user closes the sheet / popup
      if (isUserCancellation(err)) {
        setLoading(false);
        return;
      }

      logger.error("Apple Sign-In exception", { error: err });
      toast.error("Apple 登录失败，请重试。");
      setLoading(false);
    }
  }, [supabase, router, searchParams]);

  return { loading, handleAppleSignIn };
}

/**
 * Detect user-initiated cancellation from the Apple JS SDK.
 * The SDK rejects with `{ error: "popup_closed_by_user" }` on desktop
 * and may throw a similar object on iOS when the sheet is dismissed.
 */
function isUserCancellation(err: unknown): boolean {
  if (err && typeof err === "object" && "error" in err) {
    const msg = (err as { error: string }).error;
    return (
      msg === "popup_closed_by_user" ||
      msg === "user_cancelled_authorize"
    );
  }
  return false;
}
