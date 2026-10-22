import type { ProfileChanges, RegisterInput } from '../types'

export const MSG = {
  requerido: 'Este campo es obligatorio',
  email: 'Ingresa un correo válido',
  emailDuplicado: 'Ya existe una cuenta con este correo',
  password: 'La contraseña debe tener al menos 8 caracteres',
  fechas: 'La fecha de salida debe ser posterior a la de llegada',
  fechasPost: 'La fecha "Hasta" no puede ser anterior a "Desde"',
  bio: 'La biografía puede tener hasta 300 caracteres',
  postVacio: 'Escribe algo para publicar',
  postLargo: 'La publicación puede tener hasta 500 caracteres',
  precio: 'El precio debe ser mayor que 0',
  mensajeVacio: 'Escribe un mensaje',
  mensajeLargo: 'El mensaje puede tener hasta 1000 caracteres',
  usuario: 'Usa de 3 a 20 letras minúsculas, números, punto o guion bajo',
  usuarioDuplicado: 'Ese nombre de usuario ya está en uso',
  confirmar: 'Las contraseñas no coinciden',
  login: 'Usuario, correo o contraseña incorrectos',
  documento: 'Ingresa de 6 a 12 letras o números',
  fotoDocumento: 'Sube una foto del frente de tu documento',
  celular: 'Ingresa un número de 6 a 12 dígitos',
  codigo: 'El código no es correcto',
  codigoPendiente: 'Primero pide el código',
  correoPersonal: 'Usa el correo de tu universidad, no uno personal',
  fechasPar: 'Completa las dos fechas o ninguna',
  precioRango: "El precio 'desde' no puede ser mayor que 'hasta'",
  personas: 'Indica entre 1 y 6 personas',
  enlace: 'Ingresa un enlace que empiece con https://',
  categoria: 'Elige qué tipo de lugar es',
  nombreLugar: 'El nombre puede tener hasta 80 caracteres',
  fotosMax: 'Puedes subir hasta 4 fotos',
  hashtag: 'Usa de 2 a 30 letras, números o _',
  hashtagsMax: 'Máximo 10 hashtags',
  imagen: 'No pudimos leer esa imagen. Prueba con otra (JPG o PNG)',
  espacioFotos: 'Ya no hay espacio en este navegador para más fotos. Usa menos fotos o imágenes más livianas',
  espacioGeneral: 'No hay espacio en este navegador. Restablece los datos de demo desde tu perfil',
} as const

export const USERNAME_RE = /^(?!\.)[a-z0-9._]{3,20}(?<!\.)$/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const REQUIRED_TEXT = ['nombre', 'usuario', 'email', 'password'] as const

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
  if (f.usuario !== undefined && !errors.usuario && !USERNAME_RE.test(normalizeUsername(f.usuario))) {
    errors.usuario = MSG.usuario
  }
  if (f.password !== undefined && !errors.password && f.password.length < 8) {
    errors.password = MSG.password
  }
  if (f.confirmPassword !== undefined && f.confirmPassword !== f.password) {
    errors.confirmPassword = MSG.confirmar
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

/** '  @Ana.Perez ' → 'ana.perez' */
export function normalizeUsername(usuario: string): string {
  return usuario.trim().replace(/^@+/, '').toLowerCase()
}
