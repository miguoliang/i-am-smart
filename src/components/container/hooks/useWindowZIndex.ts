import { useState, useCallback, useMemo, useRef } from "react";
import React from "react";
import type { ReactNode } from "react";

interface UseWindowZIndexOptions {
  children: ReactNode;
}

interface UseWindowZIndexReturn {
  windowZIndices: Record<string, number>;
  bringToFront: (windowId: string) => void;
  getZIndex: (windowId: string, fallbackIndex: number) => number;
}

export function useWindowZIndex({ children }: UseWindowZIndexOptions): UseWindowZIndexReturn {
  // Initialize z-indices based on children count
  const initialZIndices = useMemo(() => {
    const zIndices: Record<string, number> = {};
    let index = 0;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        zIndices[windowId] = index + 1;
        index += 1;
      }
    });
    return zIndices;
  }, [children]);

  const [windowZIndices, setWindowZIndices] = useState<Record<string, number>>(initialZIndices);
  const maxZIndexRef = useRef(React.Children.count(children));

  const bringToFront = useCallback((windowId: string) => {
    maxZIndexRef.current += 1;
    setWindowZIndices((zIndices) => ({
      ...zIndices,
      [windowId]: maxZIndexRef.current,
    }));
  }, []);

  const getZIndex = useCallback(
    (windowId: string, fallbackIndex: number) => {
      return windowZIndices[windowId] || fallbackIndex;
    },
    [windowZIndices]
  );

  return {
    windowZIndices,
    bringToFront,
    getZIndex,
  };
}
