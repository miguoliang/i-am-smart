import { useCards } from "./useCards";
import { useCardFlip } from "./useCardFlip";
import { useSpeech } from "./useSpeech";
import { useTouchSwipe } from "./useTouchSwipe";
import { useCardReview } from "./useCardReview";
import { useCardNavigation } from "./useCardNavigation";
import { useSignOut } from "@/hooks/useSignOut";

export function useLearnSession() {
  const { signOut, isSigningOut } = useSignOut();
  
  // 1. Data & State
  const { cards, setCards, reviewedCount: apiReviewedCount, loading } = useCards();
  const { currentIndex, setCurrentIndex, currentCard } = useCardNavigation(cards);
  
  const { flipped, toggleFlip, resetFlip } = useCardFlip();
  const { speak } = useSpeech();
  const { handleTouchStart, handleTouchEnd } = useTouchSwipe(toggleFlip);

  // 2. Progress Calculation
  const locallyReviewedCount = cards.filter((card) => card.reviewed).length;
  const reviewedCount = apiReviewedCount + locallyReviewedCount;
  const totalCount = apiReviewedCount + cards.length;

  // 3. Review Handler
  const { handleRate } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip,
  });

  // 4. Auth Handler
  // Handled by useSignOut hook

  return {
    loading,
    cards, // Needed for empty check
    currentCard,
    progress: {
      reviewed: reviewedCount,
      total: totalCount,
    },
    flip: {
      isFlipped: flipped,
      toggle: toggleFlip,
      reset: resetFlip,
    },
    speech: {
      speak,
    },
    touch: {
      handleTouchStart,
      handleTouchEnd,
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