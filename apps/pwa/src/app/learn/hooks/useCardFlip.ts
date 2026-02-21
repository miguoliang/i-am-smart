import { useState, useRef } from "react";

export function useCardFlip() {
  const [flipped, setFlipped] = useState(false);
  const flipTimeRef = useRef<number>(0);

  const toggleFlip = () => {
    setFlipped((f) => {
      if (!f) {
        // Flipping to back (revealing answer)
        flipTimeRef.current = Date.now();
      }
      return !f;
    });
  };

  const resetFlip = () => {
    setFlipped(false);
    flipTimeRef.current = 0;
  };

  /** Milliseconds since the answer was revealed, or 0 if not flipped */
  const getResponseTimeMs = () => {
    if (flipTimeRef.current === 0) return 0;
    return Date.now() - flipTimeRef.current;
  };

  return { flipped, toggleFlip, resetFlip, getResponseTimeMs };
}
