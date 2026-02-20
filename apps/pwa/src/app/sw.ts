/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "聪明的背单词工具", body: "该复习啦！" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa-icon.svg", // Replace with PNG for better compatibility if you have one
      badge: "/pwa-icon.svg",
      data: data.url || "/", // Url to open on click
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If app is already open, focus it
        for (const client of windowClients) {
          if (client.url === event.notification.data && "focus" in client) {
            return client.focus();
          }
        }
        // If not open, open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data);
        }
      })
  );
});
