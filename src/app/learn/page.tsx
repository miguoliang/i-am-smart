"use client";

import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { StudyCard } from "./components/StudyCard";
import { RatingButtons } from "./components/RatingButtons";
import { useLearnSession } from "./hooks/useLearnSession";
import { TopBar } from "./components/TopBar";

export default function Learn() {
  const {
    loading,
    cards,
    currentCard,
    progress,
    flip,
    speech,
    touch,
    review,
    auth,
  } = useLearnSession();

  const isSessionComplete = progress.total > 0 && progress.reviewed >= progress.total;

  if (loading) return <LoadingState />;
  if (cards.length === 0 || !currentCard || isSessionComplete) return <EmptyState />;

  return (
    <div className="min-h-dvh bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <TopBar onSignOut={auth.handleSignOut} isSigningOut={auth.isSigningOut} />

      <ProgressIndicator reviewed={progress.reviewed} total={progress.total} />

      <StudyCard
        key={currentCard.id}
        card={currentCard}
        flipped={flip.isFlipped}
        onFlip={flip.toggle}
        onSpeak={speech.speak}
        onTouchStart={touch.handleTouchStart}
        onTouchEnd={touch.handleTouchEnd}
      />

      {flip.isFlipped && <RatingButtons onRate={review.handleRate} />}
    </div>
  );
}
