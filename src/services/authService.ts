import type { PublicUser, RegisterInput, User } from '../types'
import { hashPassword } from './crypto'
import { getSession, getUsers, setSession, setUsers, toPublic } from './db'
import { AuthError, ValidationError } from './errors'
import { DEMO_EMAIL, DEMO_PASSWORD } from './seed'
import { newId } from './storage'
import { MSG, normalizeEmail, normalizeUsername, validateProfileFields } from './validation'

export async function register(input: RegisterInput): Promise<PublicUser> {
  const users = getUsers()
  const email = normalizeEmail(input.email)
  const usuario = normalizeUsername(input.usuario)
  const errors = validateProfileFields(input)
  if (!errors.email && users.some((u) => u.email === email)) {
    errors.email = MSG.emailDuplicado
  }
  if (!errors.usuario && users.some((u) => u.usuario === usuario)) {
    errors.usuario = MSG.usuarioDuplicado
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  // El destino, las fechas y la universidad se completan después, desde el perfil.
  const user: User = {
    id: newId(),
    nombre: input.nombre.trim(),
    usuario,
    email,
    passwordHash: await hashPassword(input.password),
    bio: '',
    intereses: [],
    verificacion: {},
    creadoEn: new Date().toISOString(),
  }
  setUsers([...users, user])
  setSession(user.id)
  return toPublic(user)
}

/** `identificador` es el correo (si lleva '@' en medio) o el nombre de usuario, con o sin '@'. */
export async function login(identificador: string, password: string): Promise<PublicUser> {
  const id = identificador.trim()
  const esCorreo = id.indexOf('@') > 0
  const user = esCorreo
    ? getUsers().find((u) => u.email === normalizeEmail(id))
    : getUsers().find((u) => u.usuario === normalizeUsername(id))
  // Mismo mensaje para todo: no revelamos qué usuarios o correos existen.
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new AuthError(MSG.login)
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
