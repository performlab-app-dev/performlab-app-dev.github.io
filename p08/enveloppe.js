// Enveloppe chiffrée et signée — ÉBAUCHE de preuve (0.8), préfiguration de l'étape 3.2.
// Même fichier pour la page iPhone et pour la vérification Node sur le poste : WebCrypto
// standard seulement (globalThis.crypto.subtle), aucune dépendance.
//
// Schéma :
// - clé ECDH P-256 ÉPHÉMÈRE par message (côté expéditeur), accord avec la clé ECDH du
//   destinataire → 32 octets ;
// - HKDF-SHA256 (sel = clé publique éphémère brute, info = « PL3 enveloppe v1 ») → clé AES-256 ;
// - AES-GCM, nonce de 12 octets, en-tête (JSON, tel que transmis) en données associées ;
// - signature ECDSA P-256 / SHA-256 de l'expéditeur sur en-tête ‖ clé éphémère ‖ nonce ‖
//   chiffré, au format brut r‖s de 64 octets (celui de WebCrypto ; Python convertit du DER).
// La signature est vérifiée AVANT tout déchiffrement.

const subtle = globalThis.crypto.subtle
const INFO = new TextEncoder().encode('PL3 enveloppe v1')
const ECDH = { name: 'ECDH', namedCurve: 'P-256' }
const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' }

export function b64u(octets) {
  let s = ''
  for (const o of new Uint8Array(octets)) s += String.fromCharCode(o)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function deB64u(texte) {
  const s = atob(texte.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texte.length + 3) % 4))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

function concat(...parties) {
  const total = parties.reduce((n, p) => n + p.length, 0)
  const sortie = new Uint8Array(total)
  let i = 0
  for (const p of parties) { sortie.set(p, i); i += p.length }
  return sortie
}

// Clés d'un appareil : privées NON extractibles.
export async function genererCles() {
  const ecdh = await subtle.generateKey(ECDH, false, ['deriveBits'])
  const ecdsa = await subtle.generateKey(ECDSA, false, ['sign', 'verify'])
  return { ecdh, ecdsa }
}

export async function publiqueBrute(cle) {
  return new Uint8Array(await subtle.exportKey('raw', cle))
}

async function cleAes(ephPrive, destPublique, sel) {
  const partage = await subtle.deriveBits({ name: 'ECDH', public: destPublique }, ephPrive, 256)
  const hk = await subtle.importKey('raw', partage, 'HKDF', false, ['deriveKey'])
  return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: sel, info: INFO }, hk,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function sceller({ entete, clair, ecdsaPrive, destEcdhPubBrute }) {
  const destPublique = await subtle.importKey('raw', destEcdhPubBrute, ECDH, false, [])
  const eph = await subtle.generateKey(ECDH, false, ['deriveBits'])
  const epk = await publiqueBrute(eph.publicKey)
  const cle = await cleAes(eph.privateKey, destPublique, epk)
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const aad = new TextEncoder().encode(entete)
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad },
    cle, new TextEncoder().encode(clair)))
  const sig = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, ecdsaPrive, concat(aad, epk, nonce, ct))
  return { entete, epk: b64u(epk), nonce: b64u(nonce), ct: b64u(ct), sig: b64u(sig) }
}

export async function ouvrir({ enveloppe, ecdhPrive, expEcdsaPubBrute }) {
  const expPublique = await subtle.importKey('raw', expEcdsaPubBrute, ECDSA, false, ['verify'])
  const aad = new TextEncoder().encode(enveloppe.entete)
  const epk = deB64u(enveloppe.epk)
  const nonce = deB64u(enveloppe.nonce)
  const ct = deB64u(enveloppe.ct)
  const valide = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, expPublique,
    deB64u(enveloppe.sig), concat(aad, epk, nonce, ct))
  if (!valide) throw new Error('signature invalide')
  const ephPublique = await subtle.importKey('raw', epk, ECDH, false, [])
  const cle = await cleAes(ecdhPrive, ephPublique, epk)
  const clair = await subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: aad }, cle, ct)
  return new TextDecoder().decode(clair)
}

// Clé privée de TEST fournie en JWK (vecteurs Python) : importée NON extractible, comme le
// ferait une clé réelle.
export async function importerEcdhPriveJwk(jwk) {
  return subtle.importKey('jwk', jwk, ECDH, false, ['deriveBits'])
}
