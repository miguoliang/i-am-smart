"use client";

import { useSyncExternalStore } from "react";

const PREVIEW_HOST = "preview.iamsmart.top";

function getIsPreviewHostSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase() === PREVIEW_HOST;
}

/**
 * True when the page is served on preview.iamsmart.top (client-only; SSR is false).
 */
export function useIsPreviewHost(): boolean {
  return useSyncExternalStore(() => () => {}, getIsPreviewHostSnapshot, () => false);
}
