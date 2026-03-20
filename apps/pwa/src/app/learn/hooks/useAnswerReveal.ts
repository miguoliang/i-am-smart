import { useState } from "react";

export function useAnswerReveal() {
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const revealAnswer = () => {
    if (!answerRevealed) {
      setAnswerRevealed(true);
    }
  };

  const resetReveal = () => {
    setAnswerRevealed(false);
  };

  return { answerRevealed, revealAnswer, resetReveal };
}
