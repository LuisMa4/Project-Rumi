export type PostType = 'busco-roomie' | 'ofrezco-cuarto' | 'lugar' | 'viaje'

export const POST_TYPE_LABELS: Record<PostType, string> = {
  'busco-roomie': 'Busco roomie',
  'ofrezco-cuarto': 'Ofrezco cuarto',
  lugar: 'Lugar recomendado',
  viaje: 'Viaje',
}

export type LugarCategoria = 'restaurante' | 'cafe' | 'zona' | 'bar' | 'museo' | 'tienda' | 'otro'

export interface LatLng {
  lat: number
  lng: number
}

export interface Verificacion {
  dni?: { ultimos: string; verificadoEn: string }
  celular?: { enmascarado: string; verificadoEn: string }
  universidad?: { nombre: string; correoEnmascarado: string; verificadoEn: string }
}

export interface User {
  id: string
  nombre: string
  /** Único, en minúsculas y sin '@'. */
  usuario: string
  /** Se guarda en minúsculas; es único. */
  email: string
  /** SHA-256 en hex; nunca sale de los servicios. */
  passwordHash: string
  /** Solo la pone la verificación de universidad. */
  universidad?: string
  paisOrigen?: string
  ciudadDestino?: string
  paisDestino?: string
  /** ISO 'YYYY-MM-DD'; van las dos fechas o ninguna. */
  fechaLlegada?: string
  /** ISO 'YYYY-MM-DD', posterior a fechaLlegada */
  fechaSalida?: string
  bio: string
  intereses: string[]
  /** Usuario sin '@' */
  instagram?: string
  /** Data URL o ruta relativa. */
  avatarUrl?: string
  portadaUrl?: string
  verificacion: Verificacion
  creadoEn: string
}

export type PublicUser = Omit<User, 'passwordHash'>

export interface Post {
  id: string
  autorId: string
  tipo: PostType
  texto: string
  ciudad: string
  /** Zona o barrio. */
  zona?: string
  fechaDesde?: string
  fechaHasta?: string
  /** Solo 'busco-roomie' y 'ofrezco-cuarto'; ambos opcionales. */
  precioMin?: number
  precioMax?: number
  moneda?: string
  /** Solo 'busco-roomie' (1–6). */
  personas?: number
  /** Solo 'lugar'. */
  categoria?: LugarCategoria
  nombreLugar?: string
  /** Sin '#', máximo 10. */
  hashtags: string[]
  enlace?: string
  /** Data URLs o rutas relativas, máximo 4. */
  fotos: string[]
  /** Solo 'ofrezco-cuarto' y 'lugar'. */
  ubicacion?: LatLng
  creadoEn: string
}

export type FriendRequestEstado = 'pendiente' | 'aceptada' | 'rechazada'

export interface FriendRequest {
  id: string
  de: string
  para: string
  estado: FriendRequestEstado
  creadoEn: string
  respondidoEn?: string
}

export type Relation = 'ninguna' | 'enviada' | 'recibida' | 'amigos'

export interface Conversation {
  id: string
  participantes: [string, string]
  actualizadoEn: string
  /** userId → ISO del último mensaje leído. */
  leidoHasta: Record<string, string>
}

export interface Message {
  id: string
  conversacionId: string
  autorId: string
  texto: string
  enviadoEn: string
}

export interface RegisterInput {
  nombre: string
  usuario: string
  email: string
  password: string
  confirmPassword: string
}

export type ProfileChanges = Partial<
  Pick<
    User,
    | 'nombre'
    | 'paisOrigen'
    | 'ciudadDestino'
    | 'paisDestino'
    | 'fechaLlegada'
    | 'fechaSalida'
    | 'bio'
    | 'intereses'
    | 'instagram'
  >
>

export type NewPostInput = Pick<Post, 'tipo' | 'texto' | 'ciudad'> &
  Partial<
    Pick<
      Post,
      | 'zona'
      | 'fechaDesde'
      | 'fechaHasta'
      | 'precioMin'
      | 'precioMax'
      | 'moneda'
      | 'personas'
      | 'categoria'
      | 'nombreLugar'
      | 'hashtags'
      | 'enlace'
      | 'fotos'
      | 'ubicacion'
    >
  >

export type PostWithAuthor = Post & { autor: PublicUser }

export interface ConversationSummary {
  conversation: Conversation
  otro: PublicUser
  ultimoMensaje: Message
  noLeidos: boolean
}
