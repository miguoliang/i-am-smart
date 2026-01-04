import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDueCards } from "@/lib/api/cards";
import { hasErrorMessage } from "@/lib/utils/errorUtils";

export interface UseDueCardsQueryParams {
  level?: string;
}

export function useDueCardsQuery(params?: UseDueCardsQueryParams) {
  const router = useRouter();

  // Always default to A1 level if not specified
  const queryParams = { level: 'A1', ...params };

  const queryResult = useQuery({
    queryKey: ["cards", "due", queryParams.level],
    queryFn: () => fetchDueCards(queryParams),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { error } = queryResult;

  useEffect(() => {
    if (error && hasErrorMessage(error, "未登录")) {
      router.push("/");
    }
  }, [error, router]);

  return queryResult;
}
