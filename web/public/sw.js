/* Minimal offline shell for standalone / home-screen use. */
const CACHE = 'cititu-v3'
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

function shouldBypass(url) {
  // Card art must not be cache-first — a failed/partial response would stick
  // as broken tile images until the site data is cleared.
  return url.pathname.includes('/cards/')
}

function shouldNetworkFirst(request, url) {
  return (
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (shouldBypass(url)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone()).catch(() => {})
          }
          return response
        })
        .catch(() => cached)

      if (shouldNetworkFirst(request, url)) {
        return network.then((response) => response || cached)
      }
      return cached || network
    }),
  )
})
