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
  
  const { answerRevealed, revealAnswer, resetReveal, getResponseTimeMs } = useAnswerReveal();
  const { speak } = useSpeech();

  // 2. Progress Calculation
  const locallyReviewedCount = cards.filter((card: Card & { reviewed?: boolean }) => card.reviewed).length;
  const reviewedCount = apiReviewedCount + locallyReviewedCount;
  const totalCount = apiReviewedCount + cards.length;

  // 3. Review Handler
  const { handleRate: rawHandleRate } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip: resetReveal,
  });

  // Adjust quality based on response time:
  // If user said "会了" (quality 4) but took >5s, downgrade to 3 (borderline)
  const handleRate = (quality: number) => {
    const responseTime = getResponseTimeMs();
    let adjustedQuality = quality;
    if (quality >= 4 && responseTime > 5000) {
      adjustedQuality = 3;
    }
    rawHandleRate(adjustedQuality);
  };

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
    },
    auth: {
      handleSignOut: signOut,
      isSigningOut,
    },
  };
}
