import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

export function useOperatorAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOperator = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        router.replace("/learn");
        return;
      }

      const user = data.user;
      const appMetadataRole = user.app_metadata?.role;
      const userMetadataRole = user.user_metadata?.role;
      
      logger.debug("Operator auth check", {
        userId: user.id,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        app_metadata_role: appMetadataRole,
        user_metadata_role: userMetadataRole,
      });

      // Check both app_metadata and user_metadata for backward compatibility
      // Prefer app_metadata as it's the secure source (users can't modify it)
      const isOperator = appMetadataRole === "operator" || userMetadataRole === "operator";
      
      if (!isOperator) {
        router.replace("/learn");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkOperator();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const user = session?.user;
          if (!user) {
            router.replace("/learn");
            return;
          }

          const appMetadataRole = user.app_metadata?.role;
          const userMetadataRole = user.user_metadata?.role;
          const isOperator = appMetadataRole === "operator" || userMetadataRole === "operator";
          
          if (isOperator) {
            setUser(user);
            setLoading(false);
          } else {
            router.replace("/learn");
          }
        }
        if (event === "SIGNED_OUT") {
          router.replace("/");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  return { user, loading, supabase };
}

