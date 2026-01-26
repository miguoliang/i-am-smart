import { useMemo, useEffect, useRef, useReducer } from "react";
import type { Card } from "../types";
import { useDueCardsQuery } from "./useDueCardsQuery";
import { useLevel } from "./useLevel";

// State management with useReducer for complex logic
interface CardsState {
  localCards: Card[] | null;
  lastValidLevel: string | null;
}

type CardsAction =
  | { type: 'SET_LEVEL'; level: string }
  | { type: 'SET_CARDS'; cards: Card[] | null }
  | { type: 'UPDATE_CARDS'; updater: (prev: Card[] | null) => Card[] | null };

function cardsReducer(state: CardsState, action: CardsAction): CardsState {
  switch (action.type) {
    case 'SET_LEVEL':
      return {
        ...state,
        lastValidLevel: action.level,
        localCards: null, // Reset local cards on level change
      };
    case 'SET_CARDS':
      return {
        ...state,
        localCards: action.cards,
      };
    case 'UPDATE_CARDS':
      return {
        ...state,
        localCards: action.updater(state.localCards),
      };
    default:
      return state;
  }
}

export function useCards() {
  const { level } = useLevel();
  const { data, isLoading: loading } = useDueCardsQuery();
  const prevLevelRef = useRef(level);

  const [{ localCards, lastValidLevel }, dispatch] = useReducer(cardsReducer, {
    localCards: null,
    lastValidLevel: level,
  });

  const apiReviewedCount = data?.reviewedCount || 0;

  // Handle level changes
  useEffect(() => {
    if (prevLevelRef.current !== level) {
      prevLevelRef.current = level;
      dispatch({ type: 'SET_LEVEL', level });
    }
  }, [level]);

  // Update cards when data loads for current level
  useEffect(() => {
    if (data && !loading && lastValidLevel === level) {
      const cardsWithReviewed = data.cards.map((card: Card) => ({
        ...card,
        reviewed: false,
      }));
      dispatch({ type: 'SET_CARDS', cards: cardsWithReviewed });
    }
  }, [data, loading, level, lastValidLevel]);

  // Use local cards if available, otherwise API cards
  const cards = useMemo(() => {
    if (localCards !== null) {
      return localCards;
    }

    // Return empty array if data is stale (wrong level)
    if (data && lastValidLevel === level) {
      return data.cards.map((card: Card) => ({
        ...card,
        reviewed: false,
      }));
    }

    return [];
  }, [localCards, data, level, lastValidLevel]);

  const setCards = (cardsOrUpdater: Card[] | null | ((prev: Card[] | null) => Card[] | null)) => {
    if (typeof cardsOrUpdater === 'function') {
      dispatch({ type: 'UPDATE_CARDS', updater: cardsOrUpdater });
    } else {
      dispatch({ type: 'SET_CARDS', cards: cardsOrUpdater });
    }
  };

  return {
    cards,
    setCards,
    reviewedCount: apiReviewedCount,
    loading
  };
}

