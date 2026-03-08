import { useState, useCallback, useMemo } from "react";
import { useAnswerReveal } from "./useAnswerReveal";
import { useSpeech } from "./useSpeech";
import {
  getGuestCards,
  markGuestCardReviewed,
  getGuestReviewedCount,
  shouldPromptSignup,
} from "./useGuestCards";
import type { Card } from "../types";

/**
 * Guest learning session — uses built-in word list + localStorage.
 * No API calls, no auth required.
 */
export function useGuestLearnSession() {
  const [cards, setCards] = useState<Card[]>(() => getGuestCards());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(() => getGuestReviewedCount());

  const { answerRevealed, revealAnswer, resetReveal } = useAnswerReveal();
  const { speak } = useSpeech();

  const currentCard = cards[currentIndex] ?? null;
  const totalCount = reviewedCount + cards.length;

  const handleRate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- quality required by rate callback API
    (quality: number) => {
      const card = cards[currentIndex];
      if (!card) return;

      // Mark reviewed in localStorage
      markGuestCardReviewed(card.knowledge.code);

      // Update local state
      const updatedCards = cards.map((c, i) =>
        i === currentIndex ? { ...c, reviewed: true } : c
      );

      // Find next unreviewed
      const nextIdx = updatedCards.findIndex(
        (c, i) => i > currentIndex && !c.reviewed
      );

      setCards(updatedCards);
      setReviewedCount(getGuestReviewedCount());

      if (nextIdx !== -1) {
        setCurrentIndex(nextIdx);
      }
      resetReveal();

      // Check if we should prompt signup
      if (shouldPromptSignup()) {
        setShowSignupPrompt(true);
      }
    },
    [cards, currentIndex, resetReveal]
  );

  const isSessionComplete = useMemo(
    () => cards.every((c) => (c as Card & { reviewed?: boolean }).reviewed),
    [cards]
  );

  return {
    loading: false,
    cards,
    currentCard: isSessionComplete ? null : currentCard,
    progress: {
      reviewed: reviewedCount,
      total: totalCount,
    },
    answer: {
      isRevealed: answerRevealed,
      reveal: revealAnswer,
      reset: resetReveal,
    },
    speech: { speak },
    review: { handleRate },
    auth: {
      handleSignOut: () => {},
      isSigningOut: false,
    },
    isGuest: true,
    showSignupPrompt,
    dismissSignupPrompt: () => setShowSignupPrompt(false),
  };
}
