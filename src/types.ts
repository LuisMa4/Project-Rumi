export type PostType = 'busco-roomie' | 'ofrezco-cuarto' | 'lugar' | 'viaje'

export const POST_TYPE_LABELS: Record<PostType, string> = {
  'busco-roomie': 'Busco roomie',
  'ofrezco-cuarto': 'Ofrezco cuarto',
  lugar: 'Lugar recomendado',
  viaje: 'Viaje',
}

export interface User {
  id: string
  nombre: string
  /** Se guarda en minúsculas; es único. */
  email: string
  /** SHA-256 en hex; nunca sale de los servicios. */
  passwordHash: string
  universidad: string
  paisOrigen: string
  ciudadDestino: string
  paisDestino: string
  /** ISO 'YYYY-MM-DD' */
  fechaLlegada: string
  /** ISO 'YYYY-MM-DD', posterior a fechaLlegada */
  fechaSalida: string
  bio: string
  intereses: string[]
  /** Mensual */
  presupuesto?: number
  moneda?: string
  /** Usuario sin '@' */
  instagram?: string
  creadoEn: string
}

export type PublicUser = Omit<User, 'passwordHash'>

export interface Post {
  id: string
  autorId: string
  tipo: PostType
  texto: string
  ciudad: string
  fechaDesde?: string
  fechaHasta?: string
  /** Solo 'ofrezco-cuarto' y 'busco-roomie' */
  precio?: number
  moneda?: string
  /** Barrio o zona, solo 'ofrezco-cuarto' */
  zona?: string
  creadoEn: string
}

export interface Conversation {
  id: string
  participantes: [string, string]
  actualizadoEn: string
}

export interface Message {
  id: string
  conversacionId: string
  autorId: string
  texto: string
  enviadoEn: string
}

export type RegisterInput = Pick<
  User,
  | 'nombre'
  | 'email'
  | 'universidad'
  | 'paisOrigen'
  | 'ciudadDestino'
  | 'paisDestino'
  | 'fechaLlegada'
  | 'fechaSalida'
> & { password: string }

export type ProfileChanges = Partial<
  Pick<
    User,
    | 'nombre'
    | 'universidad'
    | 'paisOrigen'
    | 'ciudadDestino'
    | 'paisDestino'
    | 'fechaLlegada'
    | 'fechaSalida'
    | 'bio'
    | 'intereses'
    | 'presupuesto'
    | 'moneda'
    | 'instagram'
  >
>

export type NewPostInput = Pick<Post, 'tipo' | 'texto' | 'ciudad'> &
  Partial<Pick<Post, 'fechaDesde' | 'fechaHasta' | 'precio' | 'moneda' | 'zona'>>

export type PostWithAuthor = Post & { autor: PublicUser }

export interface UserSearchFilters {
  texto?: string
  ciudadDestino?: string
  universidad?: string
  /** Id de un usuario cuyas fechas deben solaparse con las del resultado. */
  coincideCon?: string
}

export interface ConversationSummary {
  conversation: Conversation
  otro: PublicUser
  ultimoMensaje?: Message
}
