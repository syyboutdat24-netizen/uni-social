// public/sw.js - Service Worker for Sunway Connect PWA

const CACHE_NAME = 'sunway-connect-v1'

// Install - cache nothing, just activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch - network first, always get latest from server
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})
