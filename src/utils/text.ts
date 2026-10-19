/** Minúsculas, sin espacios en los extremos y sin tildes: "Ríos" → "rios". */
export function normalizeText(s: string): string {
  // NFD separa la tilde de la letra; luego se quitan las marcas diacríticas combinables.
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Una búsqueda vacía coincide con todo. */
export function includesNormalized(haystack: string, needle: string): boolean {
  const n = normalizeText(needle)
  return n === '' || normalizeText(haystack).includes(n)
}
