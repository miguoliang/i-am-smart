"use client";

import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { GuestEmptyState } from "./components/GuestEmptyState";
import { FlipCard } from "@/components/container/FlipCard";
import { CardContent } from "./components/CardContent";
import { RatingButtons } from "./components/RatingButtons";
import { SignupPrompt } from "./components/SignupPrompt";
import { useLearnSession } from "./hooks/useLearnSession";
import { useGuestLearnSession } from "./hooks/useGuestLearnSession";
import { TopBar } from "./components/TopBar";
import { useAuth } from "@/app/(marketing)/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Learn() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("ref_code", ref);
    }
  }, [searchParams]);

  if (authLoading) return <LoadingState />;

  return isAuthenticated ? <AuthenticatedLearn /> : <GuestLearn />;
}

function AuthenticatedLearn() {
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
    <div className="min-h-dvh w-full overscroll-y-none bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <TopBar onSignOut={auth.handleSignOut} isSigningOut={auth.isSigningOut} />
      <FlipCard
        key={currentCard.id}
        front={<CardContent side="front" knowledge={currentCard.knowledge} className="h-full w-full" onSpeak={speech.speak} />}
        back={<CardContent side="back" knowledge={currentCard.knowledge} className="h-full w-full" onSpeak={speech.speak} />}
        flipped={flip.isFlipped}
        onFlip={flip.toggle}
        onTouchStart={touch.handleTouchStart}
        onTouchEnd={touch.handleTouchEnd}
      />
      {flip.isFlipped && <RatingButtons onRate={review.handleRate} />}
    </div>
  );
}

function GuestLearn() {
  const {
    cards,
    currentCard,
    progress,
    flip,
    speech,
    touch,
    review,
    showSignupPrompt,
    dismissSignupPrompt,
  } = useGuestLearnSession();

  const isSessionComplete = progress.total > 0 && progress.reviewed >= progress.total;

  if (cards.length === 0 || !currentCard || isSessionComplete) return <GuestEmptyState />;

  return (
    <div className="min-h-dvh w-full overscroll-y-none bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <FlipCard
        key={currentCard.id}
        front={<CardContent side="front" knowledge={currentCard.knowledge} className="h-full w-full" onSpeak={speech.speak} />}
        back={<CardContent side="back" knowledge={currentCard.knowledge} className="h-full w-full" onSpeak={speech.speak} />}
        flipped={flip.isFlipped}
        onFlip={flip.toggle}
        onTouchStart={touch.handleTouchStart}
        onTouchEnd={touch.handleTouchEnd}
      />
      {flip.isFlipped && <RatingButtons onRate={review.handleRate} />}
      {showSignupPrompt && (
        <SignupPrompt onDismiss={dismissSignupPrompt} reviewedCount={progress.reviewed} />
      )}
    </div>
  );
}
