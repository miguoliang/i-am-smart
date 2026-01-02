import { useEffect, useState } from "react";
import { toast } from "sonner";
import { urlBase64ToUint8Array } from "@/lib/utils";

export function usePushNotifications() {
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
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to subscribe: " + message);
    } finally {
      setLoading(false);
    }
  }

  // Not a real unsubscribe from server, but clears local state to toggle UI
  // In a real app, you might want to call an API to remove the subscription from DB
  async function unsubscribe() {
    setLoading(true);
    try {
       setSubscription(null);
       toast.success("Notifications disabled (locally)");
    } catch {
       toast.error("Failed to unsubscribe");
    } finally {
        setLoading(false);
    }
  }

  return {
    isSupported,
    subscription,
    loading,
    subscribe,
    unsubscribe
  };
}
