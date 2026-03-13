import { useQuery } from "@tanstack/react-query";

async function fetchSubscription(): Promise<{ isPro: boolean }> {
  const res = await fetch("/api/user/subscription");
  if (!res.ok) return { isPro: false };
  const { data } = await res.json();
  return data;
}

export function useSubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ["user", "subscription"],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return {
    isPro: data?.isPro ?? false,
    isLoading,
  };
}
