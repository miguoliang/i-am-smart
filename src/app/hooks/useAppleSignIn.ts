import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

interface UseAppleSignInReturn {
  loading: boolean;
  handleAppleSignIn: () => Promise<void>;
}

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const POPUP_POLL_INTERVAL_MS = 500;

/**
 * Open a centered popup window.
 * Returns null if the browser blocks the popup.
 */
function openCenteredPopup(url: string, name: string): Window | null {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
  return window.open(
    url,
    name,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes`,
  );
}

/**
 * Hook that manages Apple Sign-In via Supabase OAuth in a popup window.
 *
 * Flow:
 * 1. Call `signInWithOAuth` with `skipBrowserRedirect` to obtain the OAuth URL.
 * 2. Open the URL in a popup.
 * 3. After the user completes authentication, the popup lands on `/auth/callback`
 *    which exchanges the code for a session (setting cookies) and sends a
 *    `postMessage` back to this window.
 * 4. On receiving the success message, refresh the local session and redirect.
 */
export function useAppleSignIn(): UseAppleSignInReturn {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const popupRef = useRef<Window | null>(null);

  // Listen for the OAuth completion message from the popup.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "OAUTH_COMPLETE") return;

      popupRef.current = null;
      setLoading(false);

      if (event.data.success) {
        const nextPath = searchParams.get("next") ?? "/learn";
        router.push(nextPath);
      } else {
        toast.error("Apple 登录失败，请重试。");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, searchParams]);

  // Poll to detect if the user closed the popup without completing the flow.
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        popupRef.current = null;
        setLoading(false);
      }
    }, POPUP_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loading]);

  const handleAppleSignIn = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error || !data.url) {
        logger.error("Apple Sign-In: signInWithOAuth failed", {
          message: error?.message,
        });
        toast.error("Apple 登录初始化失败，请重试。");
        setLoading(false);
        return;
      }

      const popup = openCenteredPopup(data.url, "apple-signin");

      if (!popup) {
        toast.error("弹窗被浏览器阻止，请允许弹窗后重试。");
        setLoading(false);
        return;
      }

      popupRef.current = popup;
    } catch (err) {
      logger.error("Apple Sign-In exception", { error: err });
      toast.error("Apple 登录失败，请重试。");
      setLoading(false);
    }
  }, [supabase]);

  return { loading, handleAppleSignIn };
}
