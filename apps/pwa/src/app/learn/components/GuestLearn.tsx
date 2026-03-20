"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/form/Button";
import { cn } from "@/lib/utils";
import { WordCard } from "./WordCard";
import { learnTopChromeButtonClassName } from "./learnTopChromeStyles";
import { RatingButtons } from "./RatingButtons";
import { NextCardButton } from "./NextCardButton";
import { MisrememberButton } from "./MisrememberButton";
import { GuestEmptyState } from "./GuestEmptyState";
import { SignupPrompt } from "./SignupPrompt";
import { LearnPageBackground } from "./LearnPageBackground";
import { useGuestLearnSession } from "../hooks/useGuestLearnSession";
import { usePointerFine } from "../hooks/usePointerFine";
import { useLearnKeyboardShortcuts } from "../hooks/useLearnKeyboardShortcuts";
import { toast } from "sonner";

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 md:mt-12 w-full min-w-0 flex gap-4 md:gap-6">
      {children}
    </div>
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

interface GuestLearnActiveProps {
  isPointerFine: boolean;
  /** False while signup modal is open — do not handle A/S/D/W (or Enter/N in review step). */
  keyboardShortcutsEnabled: boolean;
  currentCard: NonNullable<ReturnType<typeof useGuestLearnSession>["currentCard"]>;
  answer: ReturnType<typeof useGuestLearnSession>["answer"];
  speech: ReturnType<typeof useGuestLearnSession>["speech"];
  review: ReturnType<typeof useGuestLearnSession>["review"];
}

function GuestLearnActive({
  isPointerFine,
  keyboardShortcutsEnabled,
  currentCard,
  answer,
  speech,
  review,
}: GuestLearnActiveProps) {
  const [pendingQuality, setPendingQuality] = useState<number | null>(null);

  const speakCurrent = () =>
    speech.speak(currentCard.knowledge.name, getAccentPreference());

  const chooseQuality = useCallback(
    (q: 1 | 4) => {
      answer.reveal();
      setPendingQuality(q);
    },
    [answer]
  );

  const submitNext = useCallback(() => {
    if (pendingQuality === null) return;
    review.handleRate(pendingQuality);
  }, [pendingQuality, review]);

  const submitMisremembered = useCallback(() => {
    review.handleRate(1);
  }, [review]);

  const waitingForNext = pendingQuality !== null;

  const hintLoginForReport = useCallback(() => {
    toast.message("请登录后使用快捷键 W 向运营反馈词条问题");
  }, []);

  useLearnKeyboardShortcuts({
    enabled: keyboardShortcutsEnabled,
    waitingForNext,
    chooseForgot: () => chooseQuality(1),
    chooseKnown: () => chooseQuality(4),
    submitNext,
    submitMisremembered,
    speak: speakCurrent,
    onReportKnowledgeError: hintLoginForReport,
  });

  return (
    <>
      <div className="w-full max-w-2xl mx-auto min-w-0 flex flex-col items-stretch">
        <WordCard
          key={currentCard.id}
          knowledge={currentCard.knowledge}
          answerRevealed={answer.isRevealed}
        />
        {isPointerFine && !waitingForNext ? (
          <span className="sr-only">按 A 不会，D 会了；出示答案后 A 记错了，D、Enter 或 N 下一个</span>
        ) : null}
        {isPointerFine && waitingForNext ? (
          <span className="sr-only">按 A 记错了，或按 D、Enter、N 下一个</span>
        ) : null}
        {isPointerFine ? (
          <span className="sr-only">按 W 可标记本词内容有误（试学请登录后使用）</span>
        ) : null}
        {waitingForNext ? (
          <ActionRow>
            <SpeakButton onSpeak={speakCurrent} />
            <MisrememberButton onClick={submitMisremembered} />
            <NextCardButton onClick={submitNext} />
          </ActionRow>
        ) : (
          <ActionRow>
            <SpeakButton onSpeak={speakCurrent} />
            <RatingButtons onChoose={chooseQuality} />
          </ActionRow>
        )}
      </div>
    </>
  );
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
  const isPointerFine = usePointerFine();

  // All guest words completed
  if (cards.length === 0 || !currentCard) {
    return <GuestEmptyState />;
  }

  return (
    <LearnPageBackground>
      {/* Top bar: aligned with authenticated TopBar (settings) chrome */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-4"
        style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={learnTopChromeButtonClassName}
          asChild
        >
          <Link href="/" aria-label="返回首页">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">首页</span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(learnTopChromeButtonClassName, "max-sm:px-2.5")}
          asChild
        >
          <Link href="/signin?next=/learn">
            <span className="truncate">注册/登录</span>
          </Link>
        </Button>
      </div>

      <GuestLearnActive
        key={currentCard.id}
        isPointerFine={isPointerFine}
        keyboardShortcutsEnabled={isPointerFine && !showSignupPrompt}
        currentCard={currentCard}
        answer={answer}
        speech={speech}
        review={review}
      />

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
