import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for countdown timer
 * @param initialSeconds - Initial countdown seconds
 * @param onComplete - Callback when countdown reaches 0
 * @returns Object with countdown seconds, isActive status, and reset function
 */
export function useCountdown(
  initialSeconds: number,
  onComplete?: () => void
): {
  seconds: number;
  isActive: boolean;
  reset: () => void;
  start: () => void;
} {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, seconds, onComplete]);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  return {
    seconds,
    isActive,
    reset,
    start,
  };
}
