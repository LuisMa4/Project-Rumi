// Datos de ejemplo de la demo. Los ids, usuarios, nombres y fechas son fijos
// porque las pruebas dependen de ellos.
import type { Conversation, FriendRequest, Message, Post, User, Verificacion } from '../types'
import { hashPassword } from './crypto'
import { setConversations, setFriendRequests, setMessages, setPosts, setSession, setUsers } from './db'
import { clearAll, read, write } from './storage'

export const SEED_VERSION = '4'
export const DEMO_USER_ID = 'u-demo'
export const DEMO_EMAIL = 'demo@rumi.app'
export const DEMO_PASSWORD = 'rumidemo123'

export const AUTO_REPLIES: string[] = [
  '¡Qué bueno! Cuéntame más.',
  'Me parece perfecto, ¿cuándo llegas?',
  'Genial, te escribo con más detalles en un rato.',
  '¡Suena bien! ¿Hablamos por videollamada esta semana?',
  'Gracias por escribir. Yo también estoy buscando, así que coordinemos.',
  '¡Claro! Pásame tu Instagram y seguimos por ahí.',
]

type SeedUser = Omit<User, 'passwordHash' | 'creadoEn' | 'verificacion'> & {
  verifica: { dni?: string; celular?: string; universidad?: string }
}

/** Universidad verificada: se guarda el nombre y el correo institucional enmascarado. */
const uni = (correoEnmascarado: string) => ({ universidad: correoEnmascarado })

const USERS: SeedUser[] = [
  {
    id: DEMO_USER_ID,
    nombre: 'Alex Romero',
    usuario: 'alex.romero',
    email: DEMO_EMAIL,
    paisOrigen: 'Perú',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-02-01',
    fechaSalida: '2027-07-15',
    bio: 'Estudio Administración y me voy de intercambio a Madrid. Busco roomie para compartir piso cerca de la universidad.',
    intereses: ['Cocina', 'Museos', 'Running'],
    // Sin universidad verificada: así se puede mostrar el paso 3 en la presentación.
    verifica: { dni: '482', celular: '+51 ••• ••• 321' },
  },
  {
    id: 'u-01',
    nombre: 'Valeria Ríos',
    usuario: 'valeria.rios',
    email: 'valeria.rios@mail.com',
    universidad: 'PUCP',
    paisOrigen: 'Perú',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-01-28',
    fechaSalida: '2027-07-10',
    bio: 'Estudiante de Comunicaciones. Me encanta cocinar y descubrir cafés nuevos.',
    intereses: ['Cocina', 'Fotografía', 'Cafés'],
    instagram: 'valeria.rios',
    verifica: { dni: '731', celular: '+51 ••• ••• 908', ...uni('v•••@pucp.edu.pe') },
  },
  {
    id: 'u-02',
    nombre: 'Mateo Fernández',
    usuario: 'mateo.fernandez',
    email: 'mateo.fernandez@mail.com',
    universidad: 'Universidad de Chile',
    paisOrigen: 'Chile',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-02-15',
    fechaSalida: '2027-06-30',
    bio: 'Ingeniería Civil. Tengo una habitación libre en Moncloa.',
    intereses: ['Fútbol', 'Viajes'],
    verifica: { dni: '205', ...uni('m•••@ug.uchile.cl') },
  },
  {
    id: 'u-03',
    nombre: 'Lucía Gómez',
    usuario: 'lucia.gomez',
    email: 'lucia.gomez@mail.com',
    universidad: 'UNAM',
    paisOrigen: 'México',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2026-09-01',
    fechaSalida: '2026-12-20',
    bio: 'Ya estoy en Madrid y termino mi intercambio en diciembre. Pregúntame lo que quieras.',
    intereses: ['Arte', 'Mercados', 'Teatro'],
    verifica: { celular: '+52 ••• ••• 114', ...uni('l•••@comunidad.unam.mx') },
  },
  {
    id: 'u-04',
    nombre: 'Diego Paredes',
    usuario: 'diego.paredes',
    email: 'diego.paredes@mail.com',
    universidad: 'UPC',
    paisOrigen: 'Perú',
    ciudadDestino: 'Barcelona',
    paisDestino: 'España',
    fechaLlegada: '2027-02-01',
    fechaSalida: '2027-07-01',
    bio: 'Arquitectura. Me gusta organizar viajes los fines de semana.',
    intereses: ['Arquitectura', 'Senderismo', 'Viajes'],
    verifica: uni('d•••@upc.edu.pe'),
  },
  {
    id: 'u-05',
    nombre: 'Sofía Castro',
    usuario: 'sofia.castro',
    email: 'sofia.castro@mail.com',
    universidad: 'Universidad de los Andes',
    paisOrigen: 'Colombia',
    ciudadDestino: 'Buenos Aires',
    paisDestino: 'Argentina',
    fechaLlegada: '2027-03-01',
    fechaSalida: '2027-07-31',
    bio: 'Diseño gráfico. Busco roomie en Palermo o Villa Crespo.',
    intereses: ['Diseño', 'Música', 'Mate'],
    verifica: { dni: '557', ...uni('s•••@uniandes.edu.co') },
  },
  {
    id: 'u-06',
    nombre: 'Andrés Molina',
    usuario: 'andres.molina',
    email: 'andres.molina@mail.com',
    universidad: 'Tec de Monterrey',
    paisOrigen: 'México',
    ciudadDestino: 'Lisboa',
    paisDestino: 'Portugal',
    fechaLlegada: '2027-02-10',
    fechaSalida: '2027-06-20',
    bio: 'Economía. Fan del surf y de los miradores de Lisboa.',
    intereses: ['Surf', 'Fotografía'],
    verifica: uni('a•••@tec.mx'),
  },
  {
    id: 'u-07',
    nombre: 'Isabella Rojas',
    usuario: 'isabella.rojas',
    email: 'isabella.rojas@mail.com',
    universidad: 'UBA',
    paisOrigen: 'Argentina',
    ciudadDestino: 'Ciudad de México',
    paisDestino: 'México',
    fechaLlegada: '2027-01-15',
    fechaSalida: '2027-06-15',
    bio: 'Psicología, de intercambio en la UNAM. Amo la comida mexicana.',
    intereses: ['Comida', 'Yoga', 'Cine'],
    verifica: { celular: '+54 ••• ••• 662', ...uni('i•••@uba.ar') },
  },
  {
    id: 'u-08',
    nombre: 'Joaquín Herrera',
    usuario: 'joaquin.herrera',
    email: 'joaquin.herrera@mail.com',
    paisOrigen: 'Perú',
    ciudadDestino: 'Montreal',
    paisDestino: 'Canadá',
    fechaLlegada: '2027-01-05',
    fechaSalida: '2027-04-30',
    bio: 'Negocios Internacionales. Quiero practicar francés en Montreal.',
    intereses: ['Idiomas', 'Hockey', 'Café'],
    verifica: {},
  },
]

/** Todos los usuarios de ejemplo menos la cuenta demo: son los que aceptan solicitudes solos. */
export const SEED_USER_IDS: string[] = USERS.map((u) => u.id).filter((id) => id !== DEMO_USER_ID)

export const isSeedUser = (id: string): boolean => SEED_USER_IDS.includes(id)

type SeedPost = Omit<Post, 'id' | 'creadoEn' | 'fotos'> & { horas: number }

const POSTS: SeedPost[] = [
  {
    autorId: 'u-01',
    tipo: 'busco-roomie',
    ciudad: 'Madrid',
    texto:
      'Llego a Madrid en febrero para el semestre en la Complutense. Busco con quién compartir piso cerca de Moncloa o Argüelles. Soy ordenada y me encanta cocinar.',
    fechaDesde: '2027-02-01',
    fechaHasta: '2027-07-10',
    precioMax: 450,
    moneda: 'EUR',
    personas: 1,
    hashtags: ['BuscoRoomie', 'Madrid', 'Ordenado', 'NoFumador'],
    horas: 2,
  },
  {
    autorId: 'u-02',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Madrid',
    zona: 'Moncloa',
    texto:
      'Tengo una habitación libre en un piso compartido en Moncloa, a 10 minutos de Ciudad Universitaria. Somos dos estudiantes, el piso es luminoso y tiene lavadora.',
    fechaDesde: '2027-02-01',
    fechaHasta: '2027-06-30',
    precioMin: 450,
    precioMax: 500,
    moneda: 'EUR',
    hashtags: ['OfrezcoCuarto', 'Madrid', 'Moncloa', 'Amoblado'],
    ubicacion: { lat: 40.435, lng: -3.719 },
    horas: 5,
  },
  {
    autorId: 'u-04',
    tipo: 'viaje',
    ciudad: 'Montserrat',
    texto:
      'Organizo un viaje a Montserrat el primer sábado de marzo. Vamos en tren desde Plaça Espanya, ¿quién se apunta?',
    fechaDesde: '2027-03-06',
    hashtags: ['Viaje', 'Montserrat', 'Naturaleza', 'CompartirGastos'],
    horas: 7,
  },
  {
    autorId: 'u-05',
    tipo: 'busco-roomie',
    ciudad: 'Buenos Aires',
    zona: 'Palermo',
    texto:
      'Busco dos roomies para un departamento en Palermo o Villa Crespo, de marzo a julio. Estudio Diseño, soy tranquila y fan del mate.',
    fechaDesde: '2027-03-01',
    fechaHasta: '2027-07-31',
    precioMax: 400,
    moneda: 'USD',
    personas: 2,
    hashtags: ['BuscoRoomie', 'BuenosAires', 'Palermo', 'Tranquilo'],
    horas: 9,
  },
  {
    autorId: 'u-03',
    tipo: 'lugar',
    ciudad: 'Madrid',
    zona: 'Lavapiés',
    categoria: 'restaurante',
    nombreLugar: 'Mercado de San Fernando',
    texto: 'Buenísimo para comer barato y conocer gente los fines de semana. Prueben los puestos de comida peruana.',
    hashtags: ['LugarRecomendado', 'Madrid', 'Lavapiés', 'Restaurante', 'Barato'],
    ubicacion: { lat: 40.4086, lng: -3.7006 },
    horas: 12,
  },
  {
    autorId: 'u-06',
    tipo: 'lugar',
    ciudad: 'Lisboa',
    zona: 'Alcântara',
    categoria: 'zona',
    nombreLugar: 'LX Factory',
    texto: 'Librerías, cafés y mercado los domingos. Perfecta para una tarde con amigos del intercambio.',
    hashtags: ['LugarRecomendado', 'Lisboa', 'Alcântara', 'ZonaBonita', 'FinDeSemana'],
    ubicacion: { lat: 38.7034, lng: -9.1786 },
    horas: 28,
  },
  {
    autorId: 'u-08',
    tipo: 'busco-roomie',
    ciudad: 'Montreal',
    texto:
      '¿Alguien más va a Montreal en enero? Busco compartir departamento cerca de McGill, ideal con alguien que quiera practicar francés.',
    fechaDesde: '2027-01-05',
    fechaHasta: '2027-04-30',
    precioMax: 700,
    moneda: 'CAD',
    personas: 1,
    hashtags: ['BuscoRoomie', 'Montreal', 'Estudiante'],
    horas: 30,
  },
  {
    autorId: 'u-06',
    tipo: 'viaje',
    ciudad: 'Sintra',
    texto:
      'Escapada de fin de semana a Sintra y Cascais en febrero. Busco 2 o 3 personas para compartir los gastos del alojamiento.',
    fechaDesde: '2027-02-20',
    fechaHasta: '2027-02-21',
    hashtags: ['Viaje', 'Sintra', 'FinDeSemana', 'CompartirGastos'],
    horas: 46,
  },
  {
    autorId: 'u-03',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Madrid',
    zona: 'Chamberí',
    texto:
      'Dejo mi habitación en Chamberí desde enero: amplia, exterior y con escritorio. Gastos incluidos. Ideal para el intercambio de primavera.',
    fechaDesde: '2027-01-01',
    fechaHasta: '2027-06-30',
    precioMin: 600,
    precioMax: 600,
    moneda: 'EUR',
    hashtags: ['OfrezcoCuarto', 'Madrid', 'Chamberí', 'GastosIncluidos'],
    ubicacion: { lat: 40.434, lng: -3.703 },
    horas: 50,
  },
  {
    autorId: 'u-04',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Barcelona',
    zona: 'Gràcia',
    texto:
      'Habitación disponible en Gràcia, cerca del metro Fontana. Piso con terraza y buen ambiente; compartes con dos estudiantes.',
    fechaDesde: '2027-02-01',
    precioMin: 520,
    precioMax: 560,
    moneda: 'EUR',
    hashtags: ['OfrezcoCuarto', 'Barcelona', 'Gràcia', 'CercaDelMetro'],
    ubicacion: { lat: 41.4036, lng: 2.1567 },
    horas: 75,
  },
  {
    autorId: 'u-07',
    tipo: 'lugar',
    ciudad: 'Ciudad de México',
    zona: 'San Rafael',
    categoria: 'restaurante',
    nombreLugar: 'Taquería El Califa de León',
    texto: 'Pidan el taco de bistec, no se van a arrepentir. Hay fila, pero avanza rápido.',
    hashtags: ['LugarRecomendado', 'CiudadDeMéxico', 'SanRafael', 'Restaurante'],
    ubicacion: { lat: 19.438, lng: -99.159 },
    horas: 98,
  },
  {
    autorId: 'u-02',
    tipo: 'viaje',
    ciudad: 'Toledo',
    texto:
      '¿Alguien para ir a Toledo un domingo? Son 30 minutos en tren desde Atocha y la catedral tiene descuento con carné de estudiante.',
    hashtags: ['Viaje', 'Toledo', 'FinDeSemana'],
    horas: 118,
  },
]

type SeedMessage = { autorId: string; texto: string; horas: number }

const CONVERSATIONS: { id: string; con: string; mensajes: SeedMessage[]; demoLeyoHasta: number }[] = [
  {
    id: 'c-01',
    con: 'u-01',
    mensajes: [
      { autorId: 'u-01', texto: '¡Hola Alex! Vi que también vas a Madrid en febrero.', horas: 3 },
      { autorId: DEMO_USER_ID, texto: '¡Hola Valeria! Sí, llego el 1 de febrero. ¿Ya tienes piso?', horas: 2.8 },
      { autorId: 'u-01', texto: 'Todavía no, estoy mirando por Moncloa. ¿Te animas a buscar piso conmigo?', horas: 2.5 },
    ],
    // Alex leyó hasta su propio mensaje: el último de Valeria queda sin leer.
    demoLeyoHasta: 1,
  },
  {
    id: 'c-02',
    con: 'u-04',
    mensajes: [
      { autorId: DEMO_USER_ID, texto: 'Hola Diego, ¿la habitación en Gràcia sigue disponible?', horas: 30 },
      { autorId: 'u-04', texto: '¡Hola! Sí, hasta febrero. Si te interesa te paso fotos.', horas: 26 },
    ],
    demoLeyoHasta: 1,
  },
]

const FRIEND_REQUESTS: { id: string; de: string; para: string; estado: FriendRequest['estado']; horas: number }[] = [
  { id: 'fr-01', de: DEMO_USER_ID, para: 'u-01', estado: 'aceptada', horas: 24 * 6 },
  { id: 'fr-02', de: 'u-02', para: DEMO_USER_ID, estado: 'aceptada', horas: 24 * 5 },
  { id: 'fr-03', de: DEMO_USER_ID, para: 'u-04', estado: 'aceptada', horas: 24 * 3 },
  { id: 'fr-04', de: 'u-05', para: DEMO_USER_ID, estado: 'pendiente', horas: 5 },
  { id: 'fr-05', de: 'u-06', para: DEMO_USER_ID, estado: 'pendiente', horas: 20 },
]

const hoursAgo = (now: number, horas: number) => new Date(now - horas * 3_600_000).toISOString()

function buildVerificacion(u: SeedUser, cuando: string): Verificacion {
  const v: Verificacion = {}
  if (u.verifica.dni) v.dni = { ultimos: u.verifica.dni, verificadoEn: cuando }
  if (u.verifica.celular) v.celular = { enmascarado: u.verifica.celular, verificadoEn: cuando }
  if (u.verifica.universidad && u.universidad) {
    v.universidad = { nombre: u.universidad, correoEnmascarado: u.verifica.universidad, verificadoEn: cuando }
  }
  return v
}

async function loadSeed(): Promise<void> {
  const now = Date.now()
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  const users: User[] = USERS.map(({ verifica, ...u }) => ({
    ...u,
    passwordHash,
    verificacion: buildVerificacion({ ...u, verifica }, hoursAgo(now, 24 * 20)),
    creadoEn: hoursAgo(now, 24 * 30),
  }))

  const posts: Post[] = POSTS.map(({ horas, ...p }, i) => ({
    ...p,
    fotos: [],
    id: `p-${String(i + 1).padStart(2, '0')}`,
    creadoEn: hoursAgo(now, horas),
  }))

  const conversations: Conversation[] = []
  const messages: Message[] = []
  for (const c of CONVERSATIONS) {
    c.mensajes.forEach((m, i) => {
      messages.push({
        id: `${c.id}-m${i + 1}`,
        conversacionId: c.id,
        autorId: m.autorId,
        texto: m.texto,
        enviadoEn: hoursAgo(now, m.horas),
      })
    })
    const ultimo = hoursAgo(now, c.mensajes[c.mensajes.length - 1].horas)
    conversations.push({
      id: c.id,
      participantes: [DEMO_USER_ID, c.con],
      actualizadoEn: ultimo,
      leidoHasta: {
        [DEMO_USER_ID]: hoursAgo(now, c.mensajes[c.demoLeyoHasta].horas),
        [c.con]: ultimo,
      },
    })
  }

  const friendRequests: FriendRequest[] = FRIEND_REQUESTS.map(({ horas, ...r }) => ({
    ...r,
    creadoEn: hoursAgo(now, horas),
    ...(r.estado !== 'pendiente' ? { respondidoEn: hoursAgo(now, horas - 1) } : {}),
  }))

  setUsers(users)
  setPosts(posts)
  setConversations(conversations)
  setMessages(messages)
  setFriendRequests(friendRequests)
  setSession(null)
  write('version', SEED_VERSION)
}

/** Carga los datos de ejemplo solo la primera vez (o si cambió la versión). */
export async function ensureSeeded(): Promise<void> {
  if (read<string | null>('version', null) === SEED_VERSION) return
  await resetDemo()
}

/** Borra todo lo de Rumi y vuelve a cargar los datos de ejemplo. */
export async function resetDemo(): Promise<void> {
  clearAll()
  await loadSeed()
}
