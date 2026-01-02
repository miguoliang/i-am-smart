"use client";

import { useEffect } from "react";
import { Workbox } from "workbox-window";
import { toast } from "sonner";

export function PWAUpdater() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const wb = new Workbox("/sw.js");

      // Add event listeners to handle PWA lifecycle events
      const promptNewVersionAvailable = () => {
        toast("New version available!", {
          action: {
            label: "Refresh",
            onClick: () => {
              wb.addEventListener("controlling", () => {
                window.location.reload();
              });
              wb.messageSkipWaiting();
            },
          },
          duration: Infinity, // Stay open until clicked
        });
      };

      wb.addEventListener("waiting", promptNewVersionAvailable);
      
      wb.register();
    }
  }, []);

  return null;
}
