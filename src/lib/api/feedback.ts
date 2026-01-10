import { Feedback } from "@/lib/types/feedback";
import { t } from "@/lib/i18n";

export interface FeedbacksResponse {
  data: Feedback[];
  total: number;
}

export async function fetchFeedbacks(page: number = 1, limit: number = 10): Promise<FeedbacksResponse> {
  const res = await fetch(`/api/feedback?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || data.error || "Failed to fetch feedbacks");
  }
  const json = await res.json();
  return json.data;
}
