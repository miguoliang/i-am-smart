import { useReducer, useLayoutEffect, useMemo } from "react";
import { Card } from "../types";

type NavigationAction =
  | { type: "SET_INDEX"; index: number }
  | { type: "ADJUST_FOR_CARDS"; cards: Card[] };

interface NavigationState {
  index: number;
}

function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case "SET_INDEX":
      if (state.index === action.index) {
        return state; // No change, return same reference
      }
      return { index: action.index };
    case "ADJUST_FOR_CARDS": {
      const { cards } = action;
      
      if (cards.length === 0) {
        if (state.index === 0) {
          return state; // No change
        }
        return { index: 0 };
      }

      const validIndex = Math.min(state.index, cards.length - 1);
      const currentCard = cards[validIndex];

      // If current card is reviewed, find the next unreviewed card
      if (currentCard?.reviewed) {
        // Look for next unreviewed card from current index
        let nextUnreviewed = cards.findIndex(
          (card, index) => index > validIndex && !card.reviewed
        );
        // If not found after current, look from the beginning
        if (nextUnreviewed === -1) {
          nextUnreviewed = cards.findIndex((card) => !card.reviewed);
        }

        if (nextUnreviewed !== -1 && nextUnreviewed !== validIndex) {
          if (state.index === nextUnreviewed) {
            return state; // No change
          }
          return { index: nextUnreviewed };
        }
      } else if (state.index >= cards.length) {
        // Index is out of bounds, adjust to last valid index
        const newIndex = Math.max(0, cards.length - 1);
        if (state.index === newIndex) {
          return state; // No change
        }
        return { index: newIndex };
      }

      // If validIndex equals current state.index, return same reference
      if (state.index === validIndex) {
        return state; // No change
      }
      return { index: validIndex };
    }
    default:
      return state;
  }
}

export function useCardNavigation(cards: Card[]) {
  const [state, dispatch] = useReducer(navigationReducer, { index: 0 });

  // Adjust index when cards change
  // Using useLayoutEffect for synchronous updates to avoid visual glitches
  // This is a legitimate use case: synchronizing state with prop changes
  // The reducer ensures we only update state when necessary, avoiding unnecessary renders
  useLayoutEffect(() => {
    dispatch({ type: "ADJUST_FOR_CARDS", cards });
  }, [cards]);

  const currentIndex = useMemo(() => {
    // Recalculate valid index based on current state and cards
    if (cards.length === 0) return 0;
    return Math.min(state.index, cards.length - 1);
  }, [state.index, cards.length]);

  const setCurrentIndex = (updater: number | ((prev: number) => number)) => {
    const newIndex = typeof updater === "function" ? updater(currentIndex) : updater;
    dispatch({ type: "SET_INDEX", index: newIndex });
    // After manual set, adjust for cards to ensure we're on a valid unreviewed card
    dispatch({ type: "ADJUST_FOR_CARDS", cards });
  };

  return {
    currentIndex,
    setCurrentIndex,
    currentCard: cards.length > 0 ? cards[currentIndex] : undefined,
  };
}
