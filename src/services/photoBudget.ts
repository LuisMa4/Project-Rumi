// Las fotos se guardan como data URLs en localStorage (unos 5 MB por sitio).
// Les damos 3 MB en total para que nunca dejen sin espacio al chat, las
// solicitudes o el perfil.
import { getPosts, getUsers } from './db'
import { StorageFullError } from './errors'

export const PHOTO_BUDGET_BYTES = 3 * 1024 * 1024

const sizeOf = (url: unknown) => (typeof url === 'string' && url.startsWith('data:') ? url.length : 0)

export function photoBytesInUse(): number {
  let total = 0
  for (const u of getUsers() as Array<{ avatarUrl?: string; portadaUrl?: string }>) {
    total += sizeOf(u.avatarUrl) + sizeOf(u.portadaUrl)
  }
  for (const p of getPosts() as Array<{ fotos?: unknown }>) {
    if (Array.isArray(p.fotos)) for (const f of p.fotos) total += sizeOf(f)
  }
  return total
}

/** Lanza StorageFullError('fotos') si guardar `nuevas` (liberando `liberadas`) supera el presupuesto. */
export function assertPhotoBudget(nuevas: string[], liberadas: string[] = []): void {
  const sum = (urls: string[]) => urls.reduce((acc, u) => acc + sizeOf(u), 0)
  if (photoBytesInUse() - sum(liberadas) + sum(nuevas) > PHOTO_BUDGET_BYTES) {
    throw new StorageFullError('fotos')
  }
}
