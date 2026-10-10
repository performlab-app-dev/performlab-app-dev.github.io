// Service worker de la PWA athlète (chantier serveur/PWA, étapes 6.1 et 6.3).
//
// 0.3.0-mv2gprcy est remplacé à CHAQUE construction (vite.config.ts) : un nouveau sw.js est alors
// détecté par le téléphone, installé en attente, et activé quand l'application le demande
// (message « activer ») — mise à jour forcée de l'étape 6.3.
//
// Hors ligne : la page est servie depuis le cache (réseau d'abord, pour voir toute nouvelle
// version dès qu'elle existe) ; les fichiers construits (noms à empreinte) depuis le cache
// d'abord — ils y sont mis dès l'installation, et au premier passage pour tout autre fichier. Seule l'origine de la PWA est concernée : les
// appels à la boîte Supabase ne passent jamais par ce cache.
const CACHE = 'pl3-pwa-0.3.0-mv2gprcy'
// Polices embarquées (étape 6.4 bis) : en cache DÈS L'INSTALLATION, pour un affichage correct
// hors ligne dès la première ouverture — jamais chargées depuis un autre domaine.
const POLICES = [
  'polices/barlow-latin-400-normal.woff2',
  'polices/barlow-latin-500-normal.woff2',
  'polices/barlow-latin-600-normal.woff2',
  'polices/barlow-condensed-latin-600-normal.woff2',
  'polices/barlow-condensed-latin-700-normal.woff2',
]
const COQUILLE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icone-192.png',
  'icone-512.png',
  ...POLICES,
]
// Fichiers CONSTRUITS (programme et styles, au nom à empreinte) : leur liste est inscrite ici à
// chaque construction (src/construction.ts). En cache dès l'installation eux aussi : à la
// première ouverture ils sont chargés avant que ce service worker n'ait la main, et ne
// passaient donc jamais par son cache — hors ligne, la page s'ouvrait sans son programme.
const CONSTRUITS = ["assets/index-2uS57LEk.js","assets/index-c5T9g7Zo.css"]

self.addEventListener('install', (e) => {
  // « reload » : relus sur le réseau, jamais repris d'un ancien cache du navigateur.
  const fichiers = [...COQUILLE, ...CONSTRUITS].map((url) => new Request(url, { cache: 'reload' }))
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(fichiers)))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles.filter((k) => k.startsWith('pl3-pwa-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'activer') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('index.html')))
    return
  }
  e.respondWith(
    caches.match(e.request).then(
      (trouve) =>
        trouve ||
        fetch(e.request).then((reponse) => {
          if (reponse.ok) {
            const copie = reponse.clone()
            caches.open(CACHE).then((c) => c.put(e.request, copie))
          }
          return reponse
        }),
    ),
  )
})
