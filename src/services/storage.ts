// Única puerta de la app hacia localStorage. Si el navegador lo bloquea
// (modo privado), la sesión sigue funcionando en memoria. Si se llena,
// se avisa con StorageFullError en vez de seguir en memoria y perder datos al recargar.
import { StorageFullError } from './errors'

const PREFIX = 'rumi:'

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error) && !(e instanceof DOMException)) return false
  const { name } = e as { name?: string }
  const { code } = e as { code?: number }
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014
}

let useMemory = false
const memory = new Map<string, string>()

/** Pasa a memoria llevándose las claves de Rumi que todavía se puedan leer. */
function switchToMemory(): void {
  useMemory = true
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = key?.startsWith(PREFIX) ? localStorage.getItem(key) : null
      if (key && value !== null) memory.set(key.slice(PREFIX.length), value)
    }
  } catch {
    // Si tampoco se puede leer, seguimos con lo que se haya copiado.
  }
}

function getRaw(key: string): string | null {
  if (!useMemory) {
    try {
      return localStorage.getItem(PREFIX + key)
    } catch {
      switchToMemory()
    }
  }
  return memory.get(key) ?? null
}

function setRaw(key: string, value: string): void {
  if (!useMemory) {
    try {
      localStorage.setItem(PREFIX + key, value)
      return
    } catch (e) {
      if (isQuotaError(e)) throw new StorageFullError('general')
      switchToMemory()
    }
  }
  memory.set(key, value)
}

export function read<T>(key: string, fallback: T): T {
  const raw = getRaw(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function write<T>(key: string, value: T): void {
  setRaw(key, JSON.stringify(value))
}

export function remove(key: string): void {
  if (!useMemory) {
    try {
      localStorage.removeItem(PREFIX + key)
      return
    } catch {
      switchToMemory()
    }
  }
  memory.delete(key)
}

export function clearAll(): void {
  if (!useMemory) {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(PREFIX)) keys.push(key)
      }
      keys.forEach((key) => localStorage.removeItem(key))
      return
    } catch {
      switchToMemory()
    }
  }
  memory.clear()
}

export function newId(): string {
  // crypto.randomUUID solo existe con HTTPS o en localhost; getRandomValues, siempre.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function __resetStorageForTests(): void {
  useMemory = false
  memory.clear()
}
