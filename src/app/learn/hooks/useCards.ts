import { useState, useMemo } from "react";
import type { Card } from "../types";
import { useDueCardsQuery } from "./useDueCardsQuery";

export function useCards() {
  const [localCards, setLocalCards] = useState<Card[] | null>(null);

  const { 
    data,
    isLoading: loading 
  } = useDueCardsQuery();

  const apiReviewedCount = data?.reviewedCount || 0;

  // Initialize cards with reviewed status
  // Due cards from API are not reviewed (they haven't been reviewed today)
  const initializedCards = useMemo(() => {
    if (localCards !== null) {
      return localCards;
    }
    
    const fetchedCards = data?.cards || [];
    // All cards from API are due cards (unreviewed), so reviewed: false
    return fetchedCards.map((card: Card) => ({
      ...card,
      reviewed: false,
    }));
  }, [data?.cards, localCards]);

  return { 
    cards: initializedCards, 
    setCards: setLocalCards, 
    reviewedCount: apiReviewedCount,
    loading 
  };
}

