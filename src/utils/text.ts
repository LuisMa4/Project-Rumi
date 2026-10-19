/** Minúsculas, sin espacios en los extremos y sin tildes: "Ríos" → "rios". */
export function normalizeText(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Una búsqueda vacía coincide con todo. */
export function includesNormalized(haystack: string, needle: string): boolean {
  const n = normalizeText(needle)
  return n === '' || normalizeText(haystack).includes(n)
}
