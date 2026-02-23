import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDueCards } from "@/lib/api/cards";
import { hasErrorMessage } from "@/lib/utils/errorUtils";
import { useProfile } from "@/hooks/useProfile";

export function useDueCardsQuery() {
  const router = useRouter();
  const { activeProfile } = useProfile();

  const profileId = activeProfile?.id;
  const examTarget = activeProfile?.exam_target;
  const level = activeProfile?.level;

  const queryResult = useQuery({
    queryKey: ["cards", "due", examTarget ?? level, profileId],
    queryFn: () => fetchDueCards({
      ...(examTarget ? { examTarget } : { level }),
      profileId,
    }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    enabled: !!profileId,
  });

  const { error } = queryResult;

  useEffect(() => {
    if (error && hasErrorMessage(error, "未登录")) {
      router.push("/signin");
    }
  }, [error, router]);

  return queryResult;
}
