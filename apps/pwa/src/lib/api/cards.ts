// API functions for cards
import type { Card } from "@/app/learn/types";
import type { ApiResponse } from "@/lib/utils/apiError";
import { parseApiErrorResponse } from "@/lib/utils/apiError";
import { t } from "@/lib/i18n";

export interface DueCardsResponse {
  reviewedCount: number;
  cards: Card[];
}

export interface FetchDueCardsParams {
  level?: string;
  examTarget?: string;
  profileId?: string;
}

export async function fetchDueCards(params?: FetchDueCardsParams): Promise<DueCardsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.examTarget) {
    searchParams.set('examTarget', params.examTarget);
  } else if (params?.level) {
    searchParams.set('level', params.level);
  }
  if (params?.profileId) {
    searchParams.set('profileId', params.profileId);
  }

  const timezoneOffset = new Date().getTimezoneOffset();
  searchParams.set('timezoneOffset', timezoneOffset.toString());

  const url = `/api/cards/due${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(t().auth.unauthorized);
    }
    const message = await parseApiErrorResponse(res, "Failed to fetch cards");
    throw new Error(message);
  }
  const json: ApiResponse<DueCardsResponse> = await res.json();
  return json.data ?? { reviewedCount: 0, cards: [] };
}

export async function reviewCard(cardId: number, quality: number, profileId?: string): Promise<void> {
  const timezoneOffset = new Date().getTimezoneOffset();
  const res = await fetch(`/api/cards/${cardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality, timezoneOffset, profileId }),
  });

  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "Failed to review card");
    throw new Error(message);
  }
}
