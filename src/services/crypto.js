// AES-256-GCM encryption using Web Crypto API
// Data is encrypted before saving to Firestore
// Key is derived from the user's UID — unique per user

async function getKey(uid) {
  const raw = new TextEncoder().encode(uid.padEnd(32, '0').slice(0, 32))
  return await crypto.subtle.importKey(
    'raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
  )
}

export async function encrypt(text, uid) {
  if (!text && text !== 0) return text
  const key = await getKey(uid)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(String(text))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const buf = new Uint8Array(iv.byteLength + ct.byteLength)
  buf.set(iv, 0)
  buf.set(new Uint8Array(ct), iv.byteLength)
  return btoa(String.fromCharCode(...buf))
}

export async function decrypt(cipher, uid) {
  if (!cipher) return cipher
  try {
    const key = await getKey(uid)
    const buf = Uint8Array.from(atob(cipher), c => c.charCodeAt(0))
    const iv = buf.slice(0, 12)
    const ct = buf.slice(12)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return new TextDecoder().decode(pt)
  } catch {
    return cipher
  }
}