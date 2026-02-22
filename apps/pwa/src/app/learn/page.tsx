"use client";

import { Suspense } from "react";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { GuestEmptyState } from "./components/GuestEmptyState";
import { WordCard } from "./components/WordCard";
import { RatingButtons } from "./components/RatingButtons";
import { SignupPrompt } from "./components/SignupPrompt";
import { useLearnSession } from "./hooks/useLearnSession";
import { useGuestLearnSession } from "./hooks/useGuestLearnSession";
import { TopBar } from "./components/TopBar";
import { useAuth } from "@/app/(marketing)/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Learn() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LearnInner />
    </Suspense>
  );
}

function LearnInner() {
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
    answer,
    speech,
    review,
    auth,
  } = useLearnSession();

  const isSessionComplete = progress.total > 0 && progress.reviewed >= progress.total;

  if (loading) return <LoadingState />;
  if (cards.length === 0 || !currentCard || isSessionComplete) return <EmptyState />;

  return (
    <div className="min-h-dvh w-full overscroll-y-none bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <TopBar onSignOut={auth.handleSignOut} isSigningOut={auth.isSigningOut} />
      <WordCard
        key={currentCard.id}
        knowledge={currentCard.knowledge}
        answerRevealed={answer.isRevealed}
        onSpeak={speech.speak}
      />
      {answer.isRevealed ? (
        <RatingButtons onRate={review.handleRate} />
      ) : (
        <RevealButton onReveal={answer.reveal} />
      )}
    </div>
  );
}

function GuestLearn() {
  const {
    cards,
    currentCard,
    progress,
    answer,
    speech,
    review,
    showSignupPrompt,
    dismissSignupPrompt,
  } = useGuestLearnSession();

  const isSessionComplete = progress.total > 0 && progress.reviewed >= progress.total;

  if (cards.length === 0 || !currentCard || isSessionComplete) return <GuestEmptyState />;

  return (
    <div className="min-h-dvh w-full overscroll-y-none bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <WordCard
        key={currentCard.id}
        knowledge={currentCard.knowledge}
        answerRevealed={answer.isRevealed}
        onSpeak={speech.speak}
      />
      {answer.isRevealed ? (
        <RatingButtons onRate={review.handleRate} />
      ) : (
        <RevealButton onReveal={answer.reveal} />
      )}
      {showSignupPrompt && (
        <SignupPrompt onDismiss={dismissSignupPrompt} reviewedCount={progress.reviewed} />
      )}
    </div>
  );
}

function RevealButton({ onReveal }: { onReveal: () => void }) {
  return (
    <div className="mt-6 md:mt-12 w-full max-w-md">
      <button
        onClick={onReveal}
        className="w-full py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl"
        aria-label="显示答案"
      >
        显示答案
      </button>
    </div>
  );
}
