// Datos de ejemplo de la demo. Los ids, nombres y fechas de los usuarios
// son fijos porque las pruebas dependen de ellos.
import type { Conversation, Message, Post, User } from '../types'
import { hashPassword } from './crypto'
import { setConversations, setMessages, setPosts, setSession, setUsers } from './db'
import { clearAll, read, write } from './storage'

export const SEED_VERSION = '2'
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

type SeedUser = Omit<User, 'passwordHash' | 'creadoEn'>

const USERS: SeedUser[] = [
  {
    id: DEMO_USER_ID,
    nombre: 'Alex Romero',
    email: DEMO_EMAIL,
    universidad: 'Universidad de Lima',
    paisOrigen: 'Perú',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-02-01',
    fechaSalida: '2027-07-15',
    bio: 'Estudio Administración y me voy de intercambio a Madrid. Busco roomie para compartir piso cerca de la universidad.',
    intereses: ['Cocina', 'Museos', 'Running'],
    presupuesto: 500,
    moneda: 'EUR',
  },
  {
    id: 'u-01',
    nombre: 'Valeria Ríos',
    email: 'valeria.rios@mail.com',
    universidad: 'PUCP',
    paisOrigen: 'Perú',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-01-28',
    fechaSalida: '2027-07-10',
    bio: 'Estudiante de Comunicaciones. Me encanta cocinar y descubrir cafés nuevos.',
    intereses: ['Cocina', 'Fotografía', 'Cafés'],
    presupuesto: 450,
    moneda: 'EUR',
    instagram: 'valeria.rios',
  },
  {
    id: 'u-02',
    nombre: 'Mateo Fernández',
    email: 'mateo.fernandez@mail.com',
    universidad: 'Universidad de Chile',
    paisOrigen: 'Chile',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2027-02-15',
    fechaSalida: '2027-06-30',
    bio: 'Ingeniería Civil. Tengo una habitación libre en Moncloa.',
    intereses: ['Fútbol', 'Viajes'],
  },
  {
    id: 'u-03',
    nombre: 'Lucía Gómez',
    email: 'lucia.gomez@mail.com',
    universidad: 'UNAM',
    paisOrigen: 'México',
    ciudadDestino: 'Madrid',
    paisDestino: 'España',
    fechaLlegada: '2026-09-01',
    fechaSalida: '2026-12-20',
    bio: 'Ya estoy en Madrid y termino mi intercambio en diciembre. Pregúntame lo que quieras.',
    intereses: ['Arte', 'Mercados', 'Teatro'],
  },
  {
    id: 'u-04',
    nombre: 'Diego Paredes',
    email: 'diego.paredes@mail.com',
    universidad: 'UPC',
    paisOrigen: 'Perú',
    ciudadDestino: 'Barcelona',
    paisDestino: 'España',
    fechaLlegada: '2027-02-01',
    fechaSalida: '2027-07-01',
    bio: 'Arquitectura. Me gusta organizar viajes los fines de semana.',
    intereses: ['Arquitectura', 'Senderismo', 'Viajes'],
    presupuesto: 520,
    moneda: 'EUR',
  },
  {
    id: 'u-05',
    nombre: 'Sofía Castro',
    email: 'sofia.castro@mail.com',
    universidad: 'Universidad de los Andes',
    paisOrigen: 'Colombia',
    ciudadDestino: 'Buenos Aires',
    paisDestino: 'Argentina',
    fechaLlegada: '2027-03-01',
    fechaSalida: '2027-07-31',
    bio: 'Diseño gráfico. Busco roomie en Palermo o Villa Crespo.',
    intereses: ['Diseño', 'Música', 'Mate'],
    presupuesto: 400,
    moneda: 'USD',
  },
  {
    id: 'u-06',
    nombre: 'Andrés Molina',
    email: 'andres.molina@mail.com',
    universidad: 'Tec de Monterrey',
    paisOrigen: 'México',
    ciudadDestino: 'Lisboa',
    paisDestino: 'Portugal',
    fechaLlegada: '2027-02-10',
    fechaSalida: '2027-06-20',
    bio: 'Economía. Fan del surf y de los miradores de Lisboa.',
    intereses: ['Surf', 'Fotografía'],
  },
  {
    id: 'u-07',
    nombre: 'Isabella Rojas',
    email: 'isabella.rojas@mail.com',
    universidad: 'UBA',
    paisOrigen: 'Argentina',
    ciudadDestino: 'Ciudad de México',
    paisDestino: 'México',
    fechaLlegada: '2027-01-15',
    fechaSalida: '2027-06-15',
    bio: 'Psicología, de intercambio en la UNAM. Amo la comida mexicana.',
    intereses: ['Comida', 'Yoga', 'Cine'],
  },
  {
    id: 'u-08',
    nombre: 'Joaquín Herrera',
    email: 'joaquin.herrera@mail.com',
    universidad: 'Universidad del Pacífico',
    paisOrigen: 'Perú',
    ciudadDestino: 'Montreal',
    paisDestino: 'Canadá',
    fechaLlegada: '2027-01-05',
    fechaSalida: '2027-04-30',
    bio: 'Negocios Internacionales. Quiero practicar francés en Montreal.',
    intereses: ['Idiomas', 'Hockey', 'Café'],
    presupuesto: 700,
    moneda: 'CAD',
  },
]

type SeedPost = Omit<Post, 'id' | 'creadoEn'> & { horas: number }

const POSTS: SeedPost[] = [
  {
    autorId: 'u-01',
    tipo: 'busco-roomie',
    ciudad: 'Madrid',
    texto:
      'Llego a Madrid en febrero para el semestre en la Complutense. Busco con quién compartir piso cerca de Moncloa o Argüelles. Soy ordenada y me encanta cocinar.',
    fechaDesde: '2027-02-01',
    fechaHasta: '2027-07-10',
    precio: 450,
    moneda: 'EUR',
    horas: 2,
  },
  {
    autorId: 'u-02',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Madrid',
    texto:
      'Tengo una habitación libre en un piso compartido en Moncloa, a 10 minutos de Ciudad Universitaria. Somos dos estudiantes, el piso es luminoso y tiene lavadora.',
    fechaDesde: '2027-02-01',
    fechaHasta: '2027-06-30',
    precio: 450,
    moneda: 'EUR',
    zona: 'Moncloa',
    horas: 5,
  },
  {
    autorId: 'u-04',
    tipo: 'viaje',
    ciudad: 'Barcelona',
    texto:
      'Organizo un viaje a Montserrat el primer sábado de marzo. Vamos en tren desde Plaça Espanya, ¿quién se apunta?',
    fechaDesde: '2027-03-06',
    horas: 7,
  },
  {
    autorId: 'u-05',
    tipo: 'busco-roomie',
    ciudad: 'Buenos Aires',
    texto:
      'Busco roomie para Palermo o Villa Crespo de marzo a julio. Estudio Diseño, soy tranquila y fan del mate.',
    fechaDesde: '2027-03-01',
    fechaHasta: '2027-07-31',
    precio: 400,
    moneda: 'USD',
    horas: 9,
  },
  {
    autorId: 'u-03',
    tipo: 'lugar',
    ciudad: 'Madrid',
    texto:
      'Si llegan a Madrid, el Mercado de San Fernando en Lavapiés es buenísimo para comer barato y conocer gente los fines de semana.',
    horas: 12,
  },
  {
    autorId: 'u-06',
    tipo: 'lugar',
    ciudad: 'Lisboa',
    texto:
      'La LX Factory en Alcântara: librerías, cafés y mercado los domingos. Perfecta para una tarde con amigos del intercambio.',
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
    precio: 700,
    moneda: 'CAD',
    horas: 30,
  },
  {
    autorId: 'u-06',
    tipo: 'viaje',
    ciudad: 'Lisboa',
    texto:
      'Escapada de fin de semana a Sintra y Cascais en febrero. Busco 2 o 3 personas para compartir los gastos del alojamiento.',
    fechaDesde: '2027-02-20',
    fechaHasta: '2027-02-21',
    horas: 46,
  },
  {
    autorId: 'u-03',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Madrid',
    texto:
      'Dejo mi habitación en Chamberí desde enero: amplia, exterior y con escritorio. Gastos incluidos. Ideal para el intercambio de primavera.',
    fechaDesde: '2027-01-01',
    fechaHasta: '2027-06-30',
    precio: 600,
    moneda: 'EUR',
    zona: 'Chamberí',
    horas: 50,
  },
  {
    autorId: 'u-04',
    tipo: 'ofrezco-cuarto',
    ciudad: 'Barcelona',
    texto:
      'Habitación disponible en Gràcia, cerca del metro Fontana. Piso con terraza y buen ambiente; compartes con dos estudiantes.',
    fechaDesde: '2027-02-01',
    fechaHasta: '2027-07-01',
    precio: 520,
    moneda: 'EUR',
    zona: 'Gràcia',
    horas: 75,
  },
  {
    autorId: 'u-07',
    tipo: 'lugar',
    ciudad: 'Ciudad de México',
    texto:
      'Recomiendo los tacos de El Califa de León en la colonia San Rafael. Pidan el de bistec, no se van a arrepentir.',
    horas: 98,
  },
  {
    autorId: 'u-02',
    tipo: 'viaje',
    ciudad: 'Madrid',
    texto:
      '¿Alguien para ir a Toledo un domingo? Son 30 minutos en tren desde Atocha y la catedral tiene descuento con carné de estudiante.',
    horas: 118,
  },
]

type SeedMessage = { autorId: string; texto: string; horas: number }

const CONVERSATIONS: { id: string; con: string; mensajes: SeedMessage[] }[] = [
  {
    id: 'c-01',
    con: 'u-01',
    mensajes: [
      { autorId: 'u-01', texto: '¡Hola Alex! Vi que también vas a Madrid en febrero.', horas: 3 },
      { autorId: DEMO_USER_ID, texto: '¡Hola Valeria! Sí, llego el 1 de febrero. ¿Ya tienes piso?', horas: 2.8 },
      { autorId: 'u-01', texto: 'Todavía no, estoy mirando por Moncloa. ¿Te animas a buscar piso conmigo?', horas: 2.5 },
    ],
  },
  {
    id: 'c-02',
    con: 'u-04',
    mensajes: [
      { autorId: DEMO_USER_ID, texto: 'Hola Diego, ¿la habitación en Gràcia sigue disponible?', horas: 30 },
      { autorId: 'u-04', texto: '¡Hola! Sí, hasta febrero. Si te interesa te paso fotos.', horas: 26 },
    ],
  },
]

const hoursAgo = (now: number, horas: number) => new Date(now - horas * 3_600_000).toISOString()

async function loadSeed(): Promise<void> {
  const now = Date.now()
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  const users: User[] = USERS.map((u) => ({ ...u, passwordHash, creadoEn: hoursAgo(now, 24 * 30) }))

  const posts: Post[] = POSTS.map(({ horas, ...p }, i) => ({
    ...p,
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
    conversations.push({
      id: c.id,
      participantes: [DEMO_USER_ID, c.con],
      actualizadoEn: hoursAgo(now, c.mensajes[c.mensajes.length - 1].horas),
    })
  }

  setUsers(users)
  setPosts(posts)
  setConversations(conversations)
  setMessages(messages)
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
