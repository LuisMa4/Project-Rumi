export async function hashPassword(texto: string): Promise<string> {
  const data = new TextEncoder().encode(texto)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
