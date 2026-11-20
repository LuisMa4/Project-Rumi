// Asistente Rumi: habla con el Worker de Cloudflare (worker/), que es quien guarda la clave
// de Gemini. Aquí nunca hay claves: VITE_AI_URL es solo la dirección pública del Worker.
import type { Post, PostWithAuthor, PublicUser } from '../types'
import { list } from './postsService'

export interface AiMensaje {
  rol: 'usuario' | 'asistente'
  texto: string
}

export interface AiRespuesta {
  texto: string
  posts: PostWithAuthor[]
}

/** El Worker no responde, falla, o el asistente no está configurado. */
export class AiUnavailableError extends Error {
  constructor() {
    super('El asistente no está disponible ahora, intenta en un rato')
    this.name = 'AiUnavailableError'
  }
}

/** Demasiadas consultas seguidas (límite por IP del Worker). */
export class AiRateLimitError extends Error {
  constructor() {
    super('Vas muy rápido, espera un minuto')
    this.name = 'AiRateLimitError'
  }
}

const MAX_PUBLICACIONES = 200

const url = (): string => (import.meta.env.VITE_AI_URL ?? '').trim()

export const isConfigured = (): boolean => url() !== ''

/**
 * Lo que se manda de cada publicación (misma forma que PostResumen en worker/src/index.ts).
 * Sin autor: a Gemini no van nombres ni usuarios de nadie.
 */
function resumir(p: Post) {
  return {
    id: p.id,
    tipo: p.tipo,
    texto: p.texto.slice(0, 600),
    ciudad: p.ciudad,
    zona: p.zona,
    precioMin: p.precioMin,
    precioMax: p.precioMax,
    moneda: p.moneda,
    fechaDesde: p.fechaDesde,
    fechaHasta: p.fechaHasta,
    personas: p.personas,
    categoria: p.categoria,
    nombreLugar: p.nombreLugar,
    hashtags: p.hashtags,
    conUbicacion: !!p.ubicacion,
  }
}

export async function ask(mensajes: AiMensaje[], usuario: PublicUser): Promise<AiRespuesta> {
  if (!isConfigured()) throw new AiUnavailableError()
  const todas = (await list()).slice(0, MAX_PUBLICACIONES)

  let res: Response
  try {
    res = await fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensajes,
        publicaciones: todas.map(resumir),
        usuario: { ciudadDestino: usuario.ciudadDestino, paisDestino: usuario.paisDestino },
      }),
    })
  } catch {
    throw new AiUnavailableError()
  }
  if (res.status === 429) throw new AiRateLimitError()
  if (!res.ok) throw new AiUnavailableError()

  let data: { texto?: unknown; postIds?: unknown }
  try {
    data = await res.json()
  } catch {
    throw new AiUnavailableError()
  }
  if (typeof data.texto !== 'string') throw new AiUnavailableError()

  // Solo publicaciones que existen de verdad, en el orden que eligió el asistente.
  const porId = new Map(todas.map((p) => [p.id, p]))
  const ids = Array.isArray(data.postIds) ? data.postIds.filter((x): x is string => typeof x === 'string') : []
  const posts = [...new Set(ids)].map((id) => porId.get(id)).filter((p): p is PostWithAuthor => !!p)
  return { texto: data.texto, posts }
}
