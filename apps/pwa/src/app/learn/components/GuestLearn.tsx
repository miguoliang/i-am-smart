"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WordCard } from "./WordCard";
import { RatingButtons } from "./RatingButtons";
import { GuestEmptyState } from "./GuestEmptyState";
import { SignupPrompt } from "./SignupPrompt";
import { LearnPageBackground } from "./LearnPageBackground";
import { useGuestLearnSession } from "../hooks/useGuestLearnSession";

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 md:mt-12 w-full max-w-md flex gap-4 md:gap-6">
      {children}
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

function getAccentPreference(): "en-US" | "en-GB" {
  if (typeof window === "undefined") return "en-US";
  return (localStorage.getItem("accent_preference") as "en-US" | "en-GB") || "en-US";
}

export function GuestLearn() {
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

  // All guest words completed
  if (cards.length === 0 || !currentCard) {
    return <GuestEmptyState />;
  }

  return (
    <LearnPageBackground>
      {/* Top bar: back | progress | sign-in */}
      <div
        className="absolute left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        {/* Left: back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="返回首页"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">首页</span>
        </Link>

        {/* Center: progress */}
        <span className="text-sm text-muted-foreground">
          试学 {progress.reviewed}/{progress.total}
        </span>

        {/* Right: sign-in link */}
        <Link
          href="/signin?next=/learn"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          注册/登录
        </Link>
      </div>

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

      {/* Signup prompt after 10 words */}
      {showSignupPrompt && (
        <SignupPrompt
          onDismiss={dismissSignupPrompt}
          reviewedCount={progress.reviewed}
        />
      )}
    </LearnPageBackground>
  );
}
