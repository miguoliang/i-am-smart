"use client";

import { Suspense } from "react";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { SignOutLockOverlay } from "@/components/overlay/SignOutLockOverlay";
import { WordCard } from "./components/WordCard";
import { RatingButtons } from "./components/RatingButtons";
import { useLearnSession } from "./hooks/useLearnSession";
import { TopBar } from "./components/TopBar";
import { LearnPageBackground } from "./components/LearnPageBackground";
import { getLevelLabelAndPalette } from "./lib/learnBackground";
import { useAuth } from "@/app/(marketing)/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePathname, useSearchParams } from "next/navigation";
import { LEARN_SIGN_OUT_PENDING_KEY } from "@/hooks/useSignOut";
import { useCallback, useEffect, useRef, useState } from "react";
import { GuestLearn } from "./components/GuestLearn";
import { NextCardButton } from "./components/NextCardButton";
import { MisrememberButton } from "./components/MisrememberButton";
import { usePointerFine } from "./hooks/usePointerFine";
import { useLearnKeyboardShortcuts } from "./hooks/useLearnKeyboardShortcuts";
import { submitKnowledgeErrorReport } from "@/lib/api/knowledgeErrorReports";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { toast } from "sonner";
import { SpeakButton } from "./components/SpeakButton";
import { LearnMomentShare } from "./components/LearnMomentShare";

export default function Learn() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LearnInner />
    </Suspense>
  );
}

function LearnInner() {
  const pathname = usePathname();
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

  // Guest mode: unauthenticated users can try learning with built-in words
  if (!isAuthenticated) {
    const signingOutPending =
      typeof window !== "undefined" &&
      pathname === "/learn" &&
      sessionStorage.getItem(LEARN_SIGN_OUT_PENDING_KEY) === "1";
    if (signingOutPending) return <LoadingState />;
    return <GuestLearn />;
  }

  return <AuthenticatedLearn />;
}

interface AuthenticatedLearnActiveProps {
  isPointerFine: boolean;
  currentCard: NonNullable<ReturnType<typeof useLearnSession>["currentCard"]>;
  answer: ReturnType<typeof useLearnSession>["answer"];
  speech: ReturnType<typeof useLearnSession>["speech"];
  review: ReturnType<typeof useLearnSession>["review"];
  auth: ReturnType<typeof useLearnSession>["auth"];
}

function AuthenticatedLearnActive({
  isPointerFine,
  currentCard,
  answer,
  speech,
  review,
  auth,
}: AuthenticatedLearnActiveProps) {
  const [pendingQuality, setPendingQuality] = useState<number | null>(null);
  const reportingRef = useRef(false);

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

  const reportKnowledgeError = useCallback(async () => {
    if (reportingRef.current) return;
    reportingRef.current = true;
    try {
      const result = await submitKnowledgeErrorReport(currentCard.knowledge.code);
      toast.success(result.message ?? "已提交");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      reportingRef.current = false;
    }
  }, [currentCard.knowledge.code]);

  useLearnKeyboardShortcuts({
    enabled: isPointerFine,
    waitingForNext,
    isReviewPending: review.isSubmittingCurrentCard,
    chooseForgot: () => chooseQuality(1),
    chooseKnown: () => chooseQuality(4),
    submitNext,
    submitMisremembered,
    speak: speakCurrent,
    onReportKnowledgeError: reportKnowledgeError,
  });

  return (
    <>
      <TopBar onSignOut={auth.handleSignOut} isSigningOut={auth.isSigningOut} />
      <p
        className="fixed right-3 z-60 text-xs text-muted-foreground/50 sm:right-4 pointer-events-none select-none tabular-nums"
        style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </p>
      <div className="w-full max-w-2xl mx-auto min-w-0 flex flex-col items-stretch">
        <WordCard
          key={currentCard.id}
          knowledge={currentCard.knowledge}
          answerRevealed={answer.isRevealed}
        />
        {waitingForNext ? (
          <ActionRow>
            <SpeakButton onSpeak={speakCurrent} showKeyHint={isPointerFine} />
            <LearnMomentShare
              knowledge={currentCard.knowledge}
            />
            <MisrememberButton
              onClick={submitMisremembered}
              disabled={review.isSubmittingCurrentCard}
              showKeyHint={isPointerFine}
            />
            <NextCardButton
              onClick={submitNext}
              disabled={review.isSubmittingCurrentCard}
              showKeyHint={isPointerFine}
            />
          </ActionRow>
        ) : (
          <ActionRow>
            <SpeakButton onSpeak={speakCurrent} showKeyHint={isPointerFine} />
            <LearnMomentShare
              knowledge={currentCard.knowledge}
            />
            <RatingButtons onChoose={chooseQuality} showKeyHints={isPointerFine} />
          </ActionRow>
        )}
      </div>
    </>
  );
}

function AuthenticatedLearn() {
  const { activeProfile } = useProfile();
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
  const isPointerFine = usePointerFine();
  const { levelLabel, paletteKey } = getLevelLabelAndPalette(
    activeProfile?.exam_target,
    activeProfile?.level
  );

  const isSessionComplete = progress.total > 0 && progress.reviewed >= progress.total;

  return (
    <>
      {auth.isSigningOut ? <SignOutLockOverlay /> : null}
      {loading ? (
        <LoadingState />
      ) : cards.length === 0 || !currentCard || isSessionComplete ? (
        <EmptyState auth={auth} />
      ) : (
        <LearnPageBackground levelLabel={levelLabel} paletteKey={paletteKey}>
          <AuthenticatedLearnActive
            key={currentCard.id}
            isPointerFine={isPointerFine}
            currentCard={currentCard}
            answer={answer}
            speech={speech}
            review={review}
            auth={auth}
          />
        </LearnPageBackground>
      )}
    </>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 md:mt-12 flex w-full min-w-0 flex-wrap justify-center gap-4 gap-y-3 md:gap-6 md:gap-y-4">
      {children}
    </div>
  );
}

function getAccentPreference(): "en-US" | "en-GB" {
  if (typeof window === "undefined") return "en-US";
  return (localStorage.getItem("accent_preference") as "en-US" | "en-GB") || "en-US";
}
