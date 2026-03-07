"use client";

import { Suspense } from "react";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { WordCard } from "./components/WordCard";
import { RatingButtons } from "./components/RatingButtons";
import { useLearnSession } from "./hooks/useLearnSession";
import { TopBar } from "./components/TopBar";
import { useAuth } from "@/app/(marketing)/hooks/useAuth";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("ref_code", ref);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) return <LoadingState />;

  if (!isAuthenticated) return null;

  return <AuthenticatedLearn />;
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
      />
      {answer.isRevealed ? (
        <ActionRow>
          <SpeakButton onSpeak={() => speech.speak(currentCard.knowledge.name, getAccentPreference())} />
          <RatingButtons onRate={review.handleRate} />
        </ActionRow>
      ) : (
        <ActionRow>
          <SpeakButton onSpeak={() => speech.speak(currentCard.knowledge.name, getAccentPreference())} />
          <RevealButton onReveal={answer.reveal} />
        </ActionRow>
      )}
    </div>
  );
}

function RevealButton({ onReveal }: { onReveal: () => void }) {
  return (
    <button
      onClick={onReveal}
      className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl"
      aria-label="显示答案"
    >
      显示答案
    </button>
  );
}

function SpeakButton({ onSpeak }: { onSpeak: () => void }) {
  return (
    <button
      onClick={onSpeak}
      className="py-5 md:py-8 px-6 md:px-8 text-xl md:text-3xl rounded-2xl transition transform active:scale-95 hover:scale-105 bg-card hover:bg-muted text-foreground shadow-xl border"
      aria-label="播放发音"
    >
      🔊
    </button>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 md:mt-12 w-full max-w-md flex gap-4 md:gap-6">
      {children}
    </div>
  );
}

function getAccentPreference(): "en-US" | "en-GB" {
  if (typeof window === "undefined") return "en-US";
  return (localStorage.getItem("accent_preference") as "en-US" | "en-GB") || "en-US";
}
