import { useCallback } from "react";

interface UseFlipCardInteractionsProps {
  flipped: boolean;
  onFlip: () => void;
}

interface UseFlipCardInteractionsReturn {
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleKeyUp: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
}

/**
 * Hook to handle flip card interactions (keyboard and accessibility)
 * Extracted to follow Single Responsibility Principle
 */
export function useFlipCardInteractions({
  flipped,
  onFlip,
}: UseFlipCardInteractionsProps): UseFlipCardInteractionsReturn {
  // Handle keyboard events to match native button semantics
  // Per WAI-ARIA: Enter activates on keydown, Space activates on keyup
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter activates on keydown (matches native button behavior)
      if (e.key === "Enter") {
        e.preventDefault();
        onFlip();
      }
      // Space prevents scrolling on keydown, but activates on keyup
      if (e.key === " ") {
        e.preventDefault(); // Prevent scrolling
      }
    },
    [onFlip]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      // Space activates on keyup (matches native button behavior per WAI-ARIA)
      if (e.key === " ") {
        e.preventDefault();
        onFlip();
      }
    },
    [onFlip]
  );

  const ariaLabel = flipped
    ? "卡片显示答案。按 Enter 或 Space 键翻回问题。"
    : "卡片显示问题。按 Enter 或 Space 键翻转查看答案。";

  return {
    handleKeyDown,
    handleKeyUp,
    ariaLabel,
  };
}
