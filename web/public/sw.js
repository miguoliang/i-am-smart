/* Minimal offline shell for standalone / home-screen use. */
const CACHE = 'cititu-v1'
const BASE = '/i-am-smart/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        BASE,
        `${BASE}manifest.webmanifest`,
        `${BASE}icons/icon-192.png`,
        `${BASE}icons/icon-512.png`,
        `${BASE}icons/apple-touch-icon.png`,
      ]),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
