// API functions for cards
import type { Card } from "@/app/learn/types";
import type { ApiResponse } from "@/lib/utils/apiError";
import { t } from "@/lib/i18n";

export interface DueCardsResponse {
  reviewedCount: number;
  cards: Card[];
}

export interface FetchDueCardsParams {
  level?: string;
}

export async function fetchDueCards(params?: FetchDueCardsParams): Promise<DueCardsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.level) {
    searchParams.set('level', params.level);
  }

  const url = `/api/cards/due${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(t().auth.unauthorized);
    }
    throw new Error("Failed to fetch cards");
  }
  const json: ApiResponse<DueCardsResponse> = await res.json();
  return json.data ?? { reviewedCount: 0, cards: [] };
}

export async function reviewCard(cardId: number, quality: number): Promise<void> {
  const res = await fetch(`/api/cards/${cardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality }),
  });

  if (!res.ok) {
    throw new Error("Failed to review card");
  }
}

