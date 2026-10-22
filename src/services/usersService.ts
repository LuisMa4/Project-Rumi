import type { ProfileChanges, PublicUser, User } from '../types'
import { includesNormalized } from '../utils/text'
import { getUsers, setUsers, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { normalizeUsername, validateProfileFields } from './validation'

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
  // Las fechas se validan contra la combinación de lo nuevo y lo guardado.
  const errors = validateProfileFields({
    ...clean,
    fechaLlegada: clean.fechaLlegada ?? current.fechaLlegada,
    fechaSalida: clean.fechaSalida ?? current.fechaSalida,
  })
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  const updated: User = { ...current, ...clean }
  if (!updated.instagram) delete updated.instagram
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
