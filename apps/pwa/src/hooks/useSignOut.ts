import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

/** Set while sign-out is in progress so /learn can show loading instead of guest cards before navigation. */
export const LEARN_SIGN_OUT_PENDING_KEY = "pwa_learn_signing_out";

const clearLearnSignOutPending = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LEARN_SIGN_OUT_PENDING_KEY);
  } catch {
    // ignore quota / private mode
  }
};

export function useSignOut() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(LEARN_SIGN_OUT_PENDING_KEY, "1");
        } catch {
          // ignore
        }
      }
      // Leave /learn before session clears, otherwise LearnInner briefly renders GuestLearn (word flash).
      router.replace("/");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      toast.error("Failed to sign out");
      clearLearnSignOutPending();
      setIsSigningOut(false);
    } finally {
      if (typeof window !== "undefined") {
        window.setTimeout(clearLearnSignOutPending, 2000);
      }
    }
  };

  return { signOut, isSigningOut };
}
