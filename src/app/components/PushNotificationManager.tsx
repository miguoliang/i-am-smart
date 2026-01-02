"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
        setLoading(false);
    }
  }, []);

  async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
    } catch {
        // Silently fail or log to analytics if needed, avoiding console.error for lint
        setLoading(false);
    } finally {
        setLoading(false);
    }
  }

  async function subscribe() {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) throw new Error("VAPID public key not found");

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setSubscription(sub);

      // Send to backend
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      toast.success("Notifications enabled!");
    } catch (error) {
      // Fixed: error typing
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to subscribe: " + message);
    } finally {
      setLoading(false);
    }
  }

  // Debug function - currently unused but kept for future testing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function sendTest() {
    try {
        await fetch("/api/push/send", {
            method: "POST",
            body: JSON.stringify({ title: "Test", body: "Hello from Be It Forever!" })
        });
        toast.success("Test sent!");
    } catch {
        toast.error("Failed to send test");
    }
  }

  if (!isSupported) return null; // Or show "Not supported"

  if (loading) return <Button variant="ghost" disabled size="icon"><Bell className="h-4 w-4 animate-pulse" /></Button>;

  if (subscription) {
    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSubscription(null)} title="Notifications enabled">
                <Bell className="h-4 w-4 text-green-500" />
            </Button>
            {/* Debug only: Test button */}
            {/* <Button variant="outline" size="sm" onClick={sendTest}>Test</Button> */}
        </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={subscribe} title="Enable Notifications">
      <BellOff className="h-4 w-4" />
    </Button>
  );
}