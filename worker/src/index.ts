// Asistente Rumi: único lugar donde vive la clave de Gemini.
// La app (GitHub Pages) manda la conversación y las publicaciones que ve; este Worker
// valida el pedido, arma el prompt, llama a Gemini y devuelve { texto, postIds }.
import { instruccionSistema, turnoConPublicaciones } from './prompt'

export interface Env {
  /** Secret: `npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml`. */
  GEMINI_API_KEY: string
  /** Rate limiting nativo de Workers (ver wrangler.toml). */
  LIMITADOR: { limit(o: { key: string }): Promise<{ success: boolean }> }
}

export interface Mensaje {
  rol: 'usuario' | 'asistente'
  texto: string
}

/** Lo que la app manda de cada publicación. Sin autores: a Gemini no van nombres de nadie. */
export interface PostResumen {
  id: string
  tipo: string
  texto: string
  ciudad: string
  zona?: string
  precioMin?: number
  precioMax?: number
  moneda?: string
  fechaDesde?: string
  fechaHasta?: string
  personas?: number
  categoria?: string
  nombreLugar?: string
  hashtags: string[]
  conUbicacion: boolean
}

export interface Pedido {
  mensajes: Mensaje[]
  publicaciones: PostResumen[]
  usuario: { ciudadDestino?: string; paisDestino?: string }
}

export const ORIGENES = ['https://luisma4.github.io', 'http://localhost:5173', 'http://localhost:4173']
export const MODELO = 'gemini-2.5-flash'
const MAX_BYTES = 100 * 1024
const MAX_MENSAJES = 20
const MAX_PUBLICACIONES = 200
const MAX_TEXTO_MENSAJE = 2000
const MAX_TEXTO_POST = 600

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, origin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(origin ? cors(origin) : {}) },
  })
}

const texto = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' ? v.slice(0, max) : undefined
const numero = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

/** Copia solo los campos conocidos (descarta autor u otros datos personales) y recorta textos. */
function limpiarPost(p: unknown): PostResumen | null {
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const id = texto(o.id, 64)
  if (!id) return null
  return {
    id,
    tipo: texto(o.tipo, 32) ?? '',
    texto: texto(o.texto, MAX_TEXTO_POST) ?? '',
    ciudad: texto(o.ciudad, 80) ?? '',
    zona: texto(o.zona, 80),
    precioMin: numero(o.precioMin),
    precioMax: numero(o.precioMax),
    moneda: texto(o.moneda, 8),
    fechaDesde: texto(o.fechaDesde, 10),
    fechaHasta: texto(o.fechaHasta, 10),
    personas: numero(o.personas),
    categoria: texto(o.categoria, 32),
    nombreLugar: texto(o.nombreLugar, 80),
    hashtags: Array.isArray(o.hashtags) ? o.hashtags.filter((h) => typeof h === 'string').slice(0, 10).map((h) => h.slice(0, 30)) : [],
    conUbicacion: o.conUbicacion === true,
  }
}

/** Valida la forma del pedido. Devuelve null si no sirve. */
export function leerPedido(raw: unknown): Pedido | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.mensajes) || o.mensajes.length === 0 || o.mensajes.length > MAX_MENSAJES) return null
  const mensajes: Mensaje[] = []
  for (const m of o.mensajes) {
    const r = m as Record<string, unknown> | null
    if (!r || (r.rol !== 'usuario' && r.rol !== 'asistente') || typeof r.texto !== 'string') return null
    mensajes.push({ rol: r.rol, texto: r.texto.slice(0, MAX_TEXTO_MENSAJE) })
  }
  if (mensajes[mensajes.length - 1].rol !== 'usuario') return null
  const lista = o.publicaciones ?? []
  if (!Array.isArray(lista) || lista.length > MAX_PUBLICACIONES) return null
  const publicaciones = lista.map(limpiarPost).filter((p): p is PostResumen => p !== null)
  const u = (o.usuario ?? {}) as Record<string, unknown>
  return {
    mensajes,
    publicaciones,
    usuario: { ciudadDestino: texto(u.ciudadDestino, 80), paisDestino: texto(u.paisDestino, 80) },
  }
}

async function preguntarAGemini(pedido: Pedido, apiKey: string): Promise<{ texto: string; postIds: string[] } | null> {
  const contents = pedido.mensajes.map((m, i) => ({
    role: m.rol === 'usuario' ? 'user' : 'model',
    parts: [{ text: i === pedido.mensajes.length - 1 ? turnoConPublicaciones(m.texto, pedido) : m.texto }],
  }))
  const body = {
    systemInstruction: { parts: [{ text: instruccionSistema(pedido.usuario) }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          texto: { type: 'STRING' },
          postIds: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['texto', 'postIds'],
      },
    },
  }
  let res: Response
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  try {
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const salida = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    const parsed = JSON.parse(salida) as { texto?: unknown; postIds?: unknown }
    if (typeof parsed.texto !== 'string') return null
    const postIds = Array.isArray(parsed.postIds) ? parsed.postIds.filter((x): x is string => typeof x === 'string') : []
    return { texto: parsed.texto, postIds }
  } catch {
    return null
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    if (!ORIGENES.includes(origin)) return json({ error: 'origen' }, 403)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/chat') return json({ error: 'no-existe' }, 404, origin)

    const raw = await request.text()
    if (new TextEncoder().encode(raw).length > MAX_BYTES) return json({ error: 'grande' }, 413, origin)

    let pedido: Pedido | null = null
    try {
      pedido = leerPedido(JSON.parse(raw))
    } catch {
      pedido = null
    }
    if (!pedido) return json({ error: 'invalido' }, 400, origin)

    const ip = request.headers.get('CF-Connecting-IP') ?? 'sin-ip'
    const { success } = await env.LIMITADOR.limit({ key: ip })
    if (!success) return json({ error: 'limite' }, 429, origin)

    const respuesta = await preguntarAGemini(pedido, env.GEMINI_API_KEY)
    if (!respuesta) return json({ error: 'no-disponible' }, 502, origin)

    // Nunca se devuelve un id que la app no mandó: la IA no puede inventar publicaciones.
    const validos = new Set(pedido.publicaciones.map((p) => p.id))
    return json({ texto: respuesta.texto, postIds: respuesta.postIds.filter((id) => validos.has(id)) }, 200, origin)
  },
}
