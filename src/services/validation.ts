import type { ProfileChanges, RegisterInput } from '../types'

export const MSG = {
  requerido: 'Este campo es obligatorio',
  email: 'Ingresa un correo válido',
  emailDuplicado: 'Ya existe una cuenta con este correo',
  password: 'La contraseña debe tener al menos 8 caracteres',
  fechas: 'La fecha de salida debe ser posterior a la de llegada',
  bio: 'La biografía puede tener hasta 300 caracteres',
  postVacio: 'Escribe algo para publicar',
  postLargo: 'La publicación puede tener hasta 500 caracteres',
  precio: 'El precio debe ser mayor que 0',
  mensajeVacio: 'Escribe un mensaje',
  mensajeLargo: 'El mensaje puede tener hasta 1000 caracteres',
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const REQUIRED_TEXT = [
  'nombre',
  'email',
  'universidad',
  'paisOrigen',
  'ciudadDestino',
  'paisDestino',
  'fechaLlegada',
  'fechaSalida',
  'password',
] as const

type ProfileFields = Partial<RegisterInput & ProfileChanges>

/** Valida solo las claves presentes en `f`. Devuelve un error por campo. */
export function validateProfileFields(f: ProfileFields): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const key of REQUIRED_TEXT) {
    const value = f[key]
    if (value !== undefined && value.trim() === '') errors[key] = MSG.requerido
  }

  if (f.email !== undefined && !errors.email && !EMAIL_RE.test(f.email.trim())) {
    errors.email = MSG.email
  }
  if (f.password !== undefined && !errors.password && f.password.length < 8) {
    errors.password = MSG.password
  }
  if (f.bio !== undefined && f.bio.length > 300) {
    errors.bio = MSG.bio
  }
  if (f.fechaLlegada && f.fechaSalida && !errors.fechaSalida && f.fechaSalida <= f.fechaLlegada) {
    errors.fechaSalida = MSG.fechas
  }

  return errors
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
