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
      const role = user.app_metadata?.role;
      
      logger.debug("Operator auth check", {
        userId: user.id,
        app_metadata: user.app_metadata,
        role,
      });

      if (role !== "operator") {
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

          const role = user.app_metadata?.role;
          
          if (role === "operator") {
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

