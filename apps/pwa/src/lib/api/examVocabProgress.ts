import type { ApiResponse } from "@/lib/utils/apiError";
import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface ExamVocabProgressItem {
  examId: string;
  name: string;
  total: number;
  brushed: number;
}

export async function fetchExamVocabProgress(
  profileId: string
): Promise<ExamVocabProgressItem[]> {
  const res = await fetch(`/api/profiles/${profileId}/exam-vocab-progress`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "获取词库进度失败");
    throw new Error(message);
  }
  const json: ApiResponse<ExamVocabProgressItem[]> = await res.json();
  return json.data ?? [];
}
