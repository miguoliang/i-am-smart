import { useCards } from "./useCards";
import { useAnswerReveal } from "./useAnswerReveal";
import { useSpeech } from "./useSpeech";
import { useCardReview } from "./useCardReview";
import { useCardNavigation } from "./useCardNavigation";
import { useSignOut } from "@/hooks/useSignOut";
import type { Card } from "../types";

export function useLearnSession() {
  const { signOut, isSigningOut } = useSignOut();
  
  // 1. Data & State
  const { cards, setCards, reviewedCount: apiReviewedCount, loading } = useCards();
  const { currentIndex, setCurrentIndex, currentCard } = useCardNavigation(cards);
  
  const { answerRevealed, revealAnswer, resetReveal } = useAnswerReveal();
  const { speak } = useSpeech();

  // 2. Progress Calculation
  const locallyReviewedCount = cards.filter((card: Card & { reviewed?: boolean }) => card.reviewed).length;
  const reviewedCount = apiReviewedCount + locallyReviewedCount;
  const totalCount = apiReviewedCount + cards.length;

  // 3. Review Handler
  const { handleRate, isPending: isReviewPending, isSubmittingCurrentCard } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip: resetReveal,
  });

  return {
    loading,
    cards,
    currentCard,
    progress: {
      reviewed: reviewedCount,
      total: totalCount,
    },
    answer: {
      isRevealed: answerRevealed,
      reveal: revealAnswer,
      reset: resetReveal,
    },
    speech: {
      speak,
    },
    review: {
      handleRate,
      isPending: isReviewPending,
      isSubmittingCurrentCard,
    },
    auth: {
      handleSignOut: signOut,
      isSigningOut,
    },
  };
}
