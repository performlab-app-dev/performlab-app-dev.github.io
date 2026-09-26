// Service worker de la preuve 0.7 : page disponible hors ligne, mise à jour sur demande.
// Le nom du cache porte la version : une nouvelle publication = un nouveau fichier sw.js,
// détecté par le navigateur, installé en attente jusqu'au clic « Mettre à jour ».
const CACHE = 'pl3-preuve-07-sans start_url-20260926-171123'
const FICHIERS = ['./', 'index.html', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) =>
    Promise.all(cles.filter((k) => k.startsWith('pl3-preuve-07-sans start_url-') && k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()))
})

self.addEventListener('message', (e) => {
  if (e.data === 'activer') self.skipWaiting()
})

// Réseau d'abord pour la page (voir une nouvelle version dès qu'elle existe), cache en repli
// (hors ligne) ; cache d'abord pour le reste.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('index.html')))
    return
  }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
})
