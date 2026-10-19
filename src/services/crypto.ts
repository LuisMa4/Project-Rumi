import { sha256Hex } from './sha256'

export async function hashPassword(texto: string): Promise<string> {
  const data = new TextEncoder().encode(texto)
  // crypto.subtle solo existe con HTTPS o en localhost.
  if (!globalThis.crypto?.subtle) return sha256Hex(data)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
