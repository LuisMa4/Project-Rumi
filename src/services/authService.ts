import type { PublicUser, RegisterInput, User } from '../types'
import { hashPassword } from './crypto'
import { getSession, getUsers, setSession, setUsers, toPublic } from './db'
import { AuthError, ValidationError } from './errors'
import { DEMO_EMAIL, DEMO_PASSWORD } from './seed'
import { newId } from './storage'
import { MSG, normalizeEmail, validateProfileFields } from './validation'

const LOGIN_ERROR = 'Correo o contraseña incorrectos'

export async function register(input: RegisterInput): Promise<PublicUser> {
  const users = getUsers()
  const email = normalizeEmail(input.email)
  const errors = validateProfileFields(input)
  if (!errors.email && users.some((u) => u.email === email)) {
    errors.email = MSG.emailDuplicado
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  const user: User = {
    id: newId(),
    nombre: input.nombre.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    universidad: input.universidad.trim(),
    paisOrigen: input.paisOrigen.trim(),
    ciudadDestino: input.ciudadDestino.trim(),
    paisDestino: input.paisDestino.trim(),
    fechaLlegada: input.fechaLlegada,
    fechaSalida: input.fechaSalida,
    bio: '',
    intereses: [],
    creadoEn: new Date().toISOString(),
  }
  setUsers([...users, user])
  setSession(user.id)
  return toPublic(user)
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const user = getUsers().find((u) => u.email === normalizeEmail(email))
  // Mismo mensaje para correo o contraseña: no revelamos qué correos existen.
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new AuthError(LOGIN_ERROR)
  }
  setSession(user.id)
  return toPublic(user)
}

export function loginDemo(): Promise<PublicUser> {
  return login(DEMO_EMAIL, DEMO_PASSWORD)
}

export async function logout(): Promise<void> {
  setSession(null)
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const id = getSession()
  if (!id) return null
  const user = getUsers().find((u) => u.id === id)
  if (!user) {
    setSession(null)
    return null
  }
  return toPublic(user)
}
