"use client";

import { useEffect } from "react";
import type { Workbox } from "workbox-window";

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export function PWAUpdater() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      // Add event listeners to handle PWA lifecycle events
      const promptNewVersionAvailable = () => {
        if (confirm("A new version is available! Refresh to update?")) {
          wb.addEventListener("controlling", () => {
            window.location.reload();
          });
          wb.messageSkipWaiting();
        }
      };

      wb.addEventListener("waiting", promptNewVersionAvailable);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wb.addEventListener("externalwaiting" as any, promptNewVersionAvailable);

      wb.register();
    }
  }, []);

  return null;
}
