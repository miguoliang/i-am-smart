import { useQuery } from "@tanstack/react-query";
import { fetchExamVocabProgress } from "@/lib/api/examVocabProgress";

export function useExamVocabProgress(profileId: string | undefined) {
  return useQuery({
    queryKey: ["exam-vocab-progress", profileId],
    queryFn: () => fetchExamVocabProgress(profileId!),
    enabled: Boolean(profileId),
    staleTime: 60_000,
  });
}
