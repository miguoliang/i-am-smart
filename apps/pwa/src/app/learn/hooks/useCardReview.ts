import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewCard as reviewCardAPI } from "@/lib/api/cards";
import type { DueCardsResponse } from "@/lib/api/cards";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { nowISO } from "@/lib/utils/dateUtils";
import { useLevel } from "./useLevel";
import { useProfile } from "@/hooks/useProfile";
import type { Card } from "../types";

interface UseCardReviewParams {
  cards: Card[];
  currentIndex: number;
  setCurrentIndex: (updater: (i: number) => number) => void;
  setCards: (cards: Card[] | ((prev: Card[] | null) => Card[] | null)) => void;
  resetFlip: () => void;
}

export function useCardReview({
  cards,
  currentIndex,
  setCurrentIndex,
  setCards,
  resetFlip,
}: UseCardReviewParams) {
  const queryClient = useQueryClient();
  const { level } = useLevel();
  const { activeProfile } = useProfile();

  const { mutate: reviewCard, isPending } = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: number }) =>
      reviewCardAPI(cardId, quality, activeProfile?.id),
    // Optimistic update: mark card as reviewed today
    onMutate: async ({ cardId }) => {
      // Snapshot the previous value for rollback
      const previousCards = cards;
      // Capture currentIndex from closure to use in the update
      const currentIdx = currentIndex;

      // Mark the card as reviewed and set last_reviewed_at to now (today)
      const now = nowISO();
      const updatedCards = cards.map((card) =>
        card.id === cardId
          ? { ...card, reviewed: true, last_reviewed_at: now }
          : card
      );

      // Find the next unreviewed card
      const nextUnreviewedIndex = updatedCards.findIndex(
        (card, index) => index > currentIdx && !card.reviewed
      );

      // Update index to next unreviewed card, or stay at current if no more unreviewed cards
      if (nextUnreviewedIndex !== -1) {
        setCurrentIndex(() => nextUnreviewedIndex);
        resetFlip();
      } else {
        // No more unreviewed cards, stay at current or move to last card
        if (currentIdx < updatedCards.length - 1) {
          setCurrentIndex(() => updatedCards.length - 1);
        }
        resetFlip();
      }

      // Update cards array
      setCards(updatedCards);

      return { previousCards };
    },
    // Sync React Query cache so navigating away and back shows correct state
    // (reviewed cards are removed from cache; otherwise stale cache would show them again)
    onSuccess: (_data, { cardId }) => {
      const queryKey = ["cards", "due", level, activeProfile?.id];
      queryClient.setQueryData<DueCardsResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          reviewedCount: old.reviewedCount + 1,
          cards: old.cards.filter((c) => c.id !== cardId),
        };
      });
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousCards) {
        setCards(context.previousCards);
      }
      toast.error(getErrorMessage(error) || "复习失败");
    },
  });

  const handleRate = (quality: number) => {
    const card = cards[currentIndex];
    if (card) {
      reviewCard({ cardId: card.id, quality });
    }
  };

  return { handleRate, isPending };
}
