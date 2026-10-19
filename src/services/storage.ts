// Única puerta de la app hacia localStorage. Si el navegador lo bloquea
// (modo privado, cuota llena), la sesión sigue funcionando en memoria.
const PREFIX = 'rumi:'

let useMemory = false
const memory = new Map<string, string>()

function getRaw(key: string): string | null {
  if (!useMemory) {
    try {
      return localStorage.getItem(PREFIX + key)
    } catch {
      useMemory = true
    }
  }
  return memory.get(key) ?? null
}

function setRaw(key: string, value: string): void {
  if (!useMemory) {
    try {
      localStorage.setItem(PREFIX + key, value)
      return
    } catch {
      useMemory = true
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
  memory.delete(key)
  if (useMemory) return
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    useMemory = true
  }
}

export function clearAll(): void {
  memory.clear()
  if (useMemory) return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    useMemory = true
  }
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
