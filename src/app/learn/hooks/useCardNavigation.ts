import { useState, useEffect, useRef } from "react";
import { Card } from "../types";

export function useCardNavigation(cards: Card[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isAdjustingRef = useRef(false);

  // Auto-advance logic: Ensure we point to a valid, unreviewed card if possible
  // This effect synchronizes the index with card state changes (reviewed status, array length)
  // This is a legitimate use case: synchronizing component state based on prop changes
  useEffect(() => {
    if (isAdjustingRef.current) {
      isAdjustingRef.current = false;
      return;
    }

    if (cards.length === 0) {
      if (currentIndex !== 0) {
        isAdjustingRef.current = true;
        setCurrentIndex(0);
      }
      return;
    }

    const validIndex = Math.min(currentIndex, cards.length - 1);
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
        isAdjustingRef.current = true;
        setCurrentIndex(nextUnreviewed);
      }
    } else if (currentIndex >= cards.length) {
      // Index is out of bounds, adjust to last valid index
      isAdjustingRef.current = true;
      setCurrentIndex(Math.max(0, cards.length - 1));
    }
  }, [cards, currentIndex]);

  return {
    currentIndex,
    setCurrentIndex,
    currentCard: cards.length > 0 ? cards[Math.min(currentIndex, cards.length - 1)] : undefined,
  };
}
