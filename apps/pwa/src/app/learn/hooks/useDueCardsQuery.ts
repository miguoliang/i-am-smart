import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDueCards } from "@/lib/api/cards";
import { hasErrorMessage } from "@/lib/utils/errorUtils";
import { useLevel } from "./useLevel";
import { useProfile } from "@/hooks/useProfile";

export interface UseDueCardsQueryParams {
  level?: string;
}

export function useDueCardsQuery(params?: UseDueCardsQueryParams) {
  const router = useRouter();
  const { level: currentLevel } = useLevel();
  const { activeProfile } = useProfile();

  const profileId = activeProfile?.id;
  const queryParams = { level: currentLevel, ...params, profileId };

  const queryResult = useQuery({
    queryKey: ["cards", "due", queryParams.level, profileId],
    queryFn: () => fetchDueCards(queryParams),
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
