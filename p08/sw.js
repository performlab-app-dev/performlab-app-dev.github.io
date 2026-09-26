// Service worker de la preuve 0.8 : la page, son module et ses vecteurs restent disponibles
// hors ligne (les images de test, elles, vivent dans le cache « pl3-p08-images », géré par la page).
const CACHE = 'pl3-p08-20260926-184838'
const FICHIERS = ['./', 'index.html', 'enveloppe.js', 'vecteurs.json', 'manifest.webmanifest', 'icone-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) =>
    Promise.all(cles.filter((k) => k.startsWith('pl3-p08-') && k !== CACHE && k !== 'pl3-p08-images').map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || caches.match('index.html'))))
})
