import type { ProfileChanges, PublicUser, User } from '../types'
import { includesNormalized } from '../utils/text'
import { getUsers, setUsers, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { validateProfileFields } from './validation'

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

// Se reemplaza en la Task 5 por la búsqueda por nombre de usuario.
export interface UserSearchFilters {
  texto?: string
  ciudadDestino?: string
  universidad?: string
  coincideCon?: string
}

const overlaps = (a: User, b: User) =>
  !!a.fechaLlegada &&
  !!a.fechaSalida &&
  !!b.fechaLlegada &&
  !!b.fechaSalida &&
  a.fechaLlegada <= b.fechaSalida &&
  b.fechaLlegada <= a.fechaSalida

export async function search(filters: UserSearchFilters, currentUserId: string): Promise<PublicUser[]> {
  const users = getUsers()
  const reference = filters.coincideCon ? users.find((u) => u.id === filters.coincideCon) : undefined

  return users
    .filter((u) => u.id !== currentUserId)
    .filter((u) => includesNormalized(u.nombre, filters.texto ?? ''))
    .filter((u) => includesNormalized(u.ciudadDestino ?? '', filters.ciudadDestino ?? ''))
    .filter((u) => includesNormalized(u.universidad ?? '', filters.universidad ?? ''))
    .filter((u) => !reference || overlaps(u, reference))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(toPublic)
}
