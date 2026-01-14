"use client";

import { useEffect, useRef } from "react";
import { Workbox } from "workbox-window";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

export function PWAUpdater() {
  const toastShownRef = useRef(false);
  const controllingHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Disable service worker if DISABLE_SW environment variable is set
    if (process.env.NEXT_PUBLIC_DISABLE_SW === "true") {
      return;
    }

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const wb = new Workbox("/sw.js");

      // Add event listeners to handle PWA lifecycle events
      const promptNewVersionAvailable = () => {
        // Prevent multiple toast instances
        if (toastShownRef.current) {
          return;
        }
        toastShownRef.current = true;

        toast("New version available!", {
          action: {
            label: "Refresh",
            onClick: () => {
              // Set up controlling handler BEFORE calling messageSkipWaiting
              // to avoid race condition
              const handleControlling = () => {
                window.location.reload();
              };
              
              // Remove previous handler if it exists
              if (controllingHandlerRef.current) {
                wb.removeEventListener("controlling", controllingHandlerRef.current);
              }
              
              controllingHandlerRef.current = handleControlling;
              wb.addEventListener("controlling", handleControlling);
              
              // Call messageSkipWaiting after listener is registered
              try {
                wb.messageSkipWaiting();
              } catch (error: unknown) {
                logger.error("Failed to skip waiting", { error });
                toast.error("Failed to update. Please refresh manually.");
                // Clean up on error
                if (controllingHandlerRef.current) {
                  wb.removeEventListener("controlling", controllingHandlerRef.current);
                  controllingHandlerRef.current = null;
                }
                toastShownRef.current = false;
              }
            },
          },
          duration: Infinity, // Stay open until clicked
        });
      };

      wb.addEventListener("waiting", promptNewVersionAvailable);
      
      // Register with error handling
      wb.register().catch((error: unknown) => {
        logger.error("Service worker registration failed", { error });
      });

      // Cleanup function
      return () => {
        wb.removeEventListener("waiting", promptNewVersionAvailable);
        if (controllingHandlerRef.current) {
          wb.removeEventListener("controlling", controllingHandlerRef.current);
        }
      };
    }
  }, []);

  return null;
}
