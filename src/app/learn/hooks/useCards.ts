import { useMemo, useEffect, useRef, useReducer } from "react";
import type { Card } from "../types";
import { useDueCardsQuery } from "./useDueCardsQuery";
import { useLevel } from "./useLevel";

// State management with useReducer for complex logic
interface CardsState {
  localCards: Card[] | null;
  lastValidLevel: string | null;
  initialReviewedCount: number;
}

type CardsAction =
  | { type: 'SET_LEVEL'; level: string }
  | { type: 'SET_CARDS'; cards: Card[] | null }
  | { type: 'INIT_CARDS'; cards: Card[]; reviewedCount: number }
  | { type: 'UPDATE_CARDS'; updater: (prev: Card[] | null) => Card[] | null };

function cardsReducer(state: CardsState, action: CardsAction): CardsState {
  switch (action.type) {
    case 'SET_LEVEL':
      return {
        ...state,
        lastValidLevel: action.level,
        localCards: null, // Reset local cards on level change
        initialReviewedCount: 0,
      };
    case 'SET_CARDS':
      return {
        ...state,
        localCards: action.cards,
      };
    case 'INIT_CARDS':
      return {
        ...state,
        localCards: action.cards,
        initialReviewedCount: action.reviewedCount,
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

  const [{ localCards, lastValidLevel, initialReviewedCount }, dispatch] = useReducer(cardsReducer, {
    localCards: null,
    lastValidLevel: level,
    initialReviewedCount: 0,
  });

  // Handle level changes
  useEffect(() => {
    if (prevLevelRef.current !== level) {
      prevLevelRef.current = level;
      dispatch({ type: 'SET_LEVEL', level });
    }
  }, [level]);

  // Initialize cards when data loads for current level
  // Only set localCards from API data when localCards is null (initial load or after level change).
  // Once localCards is initialized, local state (optimistic updates) takes precedence
  // to prevent cache mutations (e.g., onSuccess removing reviewed cards) from
  // overwriting local state and shifting card indices mid-session.
  useEffect(() => {
    if (data && !loading && lastValidLevel === level && localCards === null) {
      const cardsWithReviewed = data.cards.map((card: Card) => ({
        ...card,
        reviewed: false,
      }));
      dispatch({ type: 'INIT_CARDS', cards: cardsWithReviewed, reviewedCount: data.reviewedCount });
    }
  }, [data, loading, level, lastValidLevel, localCards]);

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
    reviewedCount: initialReviewedCount,
    loading
  };
}

