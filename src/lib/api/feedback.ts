import { Feedback } from "@/lib/types/feedback";
import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface FeedbacksResponse {
  data: Feedback[];
  total: number;
}

export async function fetchFeedbacks(page: number = 1, limit: number = 10): Promise<FeedbacksResponse> {
  const res = await fetch(`/api/feedback?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "Failed to fetch feedbacks");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}
