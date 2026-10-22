import type { ProfileChanges, PublicUser, User, Verificacion } from '../types'
import { lastChars, maskEmail, maskPhone } from '../utils/mask'
import { includesNormalized } from '../utils/text'
import { getUsers, setUsers, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { assertPhotoBudget } from './photoBudget'
import { MSG, normalizeUsername, validateProfileFields } from './validation'

export async function getById(id: string): Promise<PublicUser> {
  const user = getUsers().find((u) => u.id === id)
  if (!user) throw new NotFoundError()
  return toPublic(user)
}

function cleanChanges(changes: ProfileChanges): ProfileChanges {
  const clean: ProfileChanges = { ...changes }
  for (const key of ['nombre', 'paisOrigen', 'ciudadDestino', 'paisDestino'] as const) {
    if (clean[key] !== undefined) clean[key] = clean[key].trim()
  }
  if (clean.intereses) clean.intereses = clean.intereses.map((i) => i.trim()).filter(Boolean)
  if (clean.instagram !== undefined) clean.instagram = clean.instagram.trim().replace(/^@+/, '')
  return clean
}

export async function update(id: string, changes: ProfileChanges): Promise<PublicUser> {
  const users = getUsers()
  const current = users.find((u) => u.id === id)
  if (!current) throw new NotFoundError()

  const clean = cleanChanges(changes)
  // Las fechas se validan contra la combinación de lo nuevo y lo guardado: van las dos o ninguna.
  const llegada = clean.fechaLlegada ?? current.fechaLlegada ?? ''
  const salida = clean.fechaSalida ?? current.fechaSalida ?? ''
  const errors = validateProfileFields({ ...clean, fechaLlegada: llegada, fechaSalida: salida })
  if (!errors.fechaSalida && !llegada !== !salida) errors.fechaSalida = MSG.fechasPar
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  const updated: User = { ...current, ...clean }
  // Un campo opcional vacío se borra en vez de guardarse como ''.
  for (const key of ['instagram', 'paisOrigen', 'ciudadDestino', 'paisDestino', 'fechaLlegada', 'fechaSalida'] as const) {
    if (!updated[key]) delete updated[key]
  }
  setUsers(users.map((u) => (u.id === id ? updated : u)))
  return toPublic(updated)
}

/** Busca por nombre de usuario (contiene, sin '@', sin tildes). Con el texto vacío no devuelve nada. */
export async function searchByUsername(texto: string, currentUserId: string): Promise<PublicUser[]> {
  const buscado = normalizeUsername(texto)
  if (!buscado) return []
  return getUsers()
    .filter((u) => u.id !== currentUserId && includesNormalized(u.usuario, buscado))
    .sort((a, b) => a.usuario.localeCompare(b.usuario))
    .map(toPublic)
}

async function setPhoto(id: string, campo: 'avatarUrl' | 'portadaUrl', dataUrl: string): Promise<PublicUser> {
  const users = getUsers()
  const current = users.find((u) => u.id === id)
  if (!current) throw new NotFoundError()
  // La foto anterior deja de contar en el presupuesto.
  assertPhotoBudget([dataUrl], current[campo] ? [current[campo]] : [])
  const updated: User = { ...current, [campo]: dataUrl }
  setUsers(users.map((u) => (u.id === id ? updated : u)))
  return toPublic(updated)
}

export const setAvatar = (id: string, dataUrl: string) => setPhoto(id, 'avatarUrl', dataUrl)
export const setPortada = (id: string, dataUrl: string) => setPhoto(id, 'portadaUrl', dataUrl)

// --- Verificación de cuenta (demo: los códigos se muestran en pantalla) ---

export const PUBLIC_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateDni({ numero }: { numero: string }): Record<string, string> {
  return /^[A-Za-z0-9]{6,12}$/.test(numero.trim()) ? {} : { numero: MSG.documento }
}

export function validateCelular({ numero }: { codigoPais: string; numero: string }): Record<string, string> {
  return /^\d{6,12}$/.test(numero.replace(/\s/g, '')) ? {} : { numero: MSG.celular }
}

export function validateUniversidad({ universidad, correo }: { universidad: string; correo: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  if (universidad.trim() === '') errors.universidad = MSG.requerido
  const email = correo.trim().toLowerCase()
  if (email === '') errors.correo = MSG.requerido
  else if (!EMAIL_RE.test(email)) errors.correo = MSG.email
  else if (PUBLIC_EMAIL_DOMAINS.includes(email.split('@')[1])) errors.correo = MSG.correoPersonal
  return errors
}

/** Código de 6 dígitos para la demo. Vive solo en la pantalla, nunca se guarda. */
export function generateCode(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1))
  return String(n % 1_000_000).padStart(6, '0')
}

function saveVerificacion(id: string, cambio: Partial<Verificacion>, extra: Partial<User> = {}): PublicUser {
  const users = getUsers()
  const current = users.find((u) => u.id === id)
  if (!current) throw new NotFoundError()
  const updated: User = { ...current, ...extra, verificacion: { ...current.verificacion, ...cambio } }
  setUsers(users.map((u) => (u.id === id ? updated : u)))
  return toPublic(updated)
}

/** Guarda solo los últimos 3 caracteres del documento; la foto nunca llega aquí. */
export async function verifyDni(id: string, input: { numero: string }): Promise<PublicUser> {
  const errors = validateDni(input)
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  return saveVerificacion(id, { dni: { ultimos: lastChars(input.numero.trim(), 3), verificadoEn: new Date().toISOString() } })
}

export async function verifyCelular(id: string, input: { codigoPais: string; numero: string }): Promise<PublicUser> {
  const errors = validateCelular(input)
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  const enmascarado = maskPhone(input.codigoPais, input.numero.replace(/\s/g, ''))
  return saveVerificacion(id, { celular: { enmascarado, verificadoEn: new Date().toISOString() } })
}

export async function verifyUniversidad(id: string, input: { universidad: string; correo: string }): Promise<PublicUser> {
  const errors = validateUniversidad(input)
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  const nombre = input.universidad.trim()
  return saveVerificacion(
    id,
    { universidad: { nombre, correoEnmascarado: maskEmail(input.correo), verificadoEn: new Date().toISOString() } },
    { universidad: nombre },
  )
}
