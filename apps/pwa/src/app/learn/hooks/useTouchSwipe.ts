import { useRef } from "react";

export function useTouchSwipe(onSwipe: () => void) {
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (Math.abs(touchEndX - touchStartX.current) > 50) {
      onSwipe();
    }
  };

  return { handleTouchStart, handleTouchEnd };
}

