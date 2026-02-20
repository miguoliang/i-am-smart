import { useState } from "react";

export function useCardFlip() {
  const [flipped, setFlipped] = useState(false);

  const toggleFlip = () => setFlipped((f) => !f);
  const resetFlip = () => setFlipped(false);

  return { flipped, toggleFlip, resetFlip };
}

