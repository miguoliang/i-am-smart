"use client";

import { useEffect, useState } from "react";

/**
 * True when the primary input is a fine pointer (e.g. mouse on PC).
 * Touch-first devices typically report false so we keep tap targets like「显示答案」.
 */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return fine;
}
