import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
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
        router.replace("/operator/login");
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
        router.replace("/operator/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkOperator();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const user = session?.user;
          if (!user) {
            router.replace("/operator/login");
            return;
          }

          const role = user.app_metadata?.role;
          
          if (role === "operator") {
            setUser(user);
            setLoading(false);
          } else {
            router.replace("/operator/login");
          }
        }
        if (event === "SIGNED_OUT") {
          router.replace("/operator/login");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  return { user, loading, supabase };
}

