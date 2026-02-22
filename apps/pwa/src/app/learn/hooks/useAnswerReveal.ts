import { useState, useRef } from "react";

export function useAnswerReveal() {
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const revealTimeRef = useRef<number>(0);

  const revealAnswer = () => {
    if (!answerRevealed) {
      revealTimeRef.current = Date.now();
      setAnswerRevealed(true);
    }
  };

  const resetReveal = () => {
    setAnswerRevealed(false);
    revealTimeRef.current = 0;
  };

  /** Milliseconds since the answer was revealed, or 0 if not revealed */
  const getResponseTimeMs = () => {
    if (revealTimeRef.current === 0) return 0;
    return Date.now() - revealTimeRef.current;
  };

  return { answerRevealed, revealAnswer, resetReveal, getResponseTimeMs };
}
