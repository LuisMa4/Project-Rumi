// Hashtags de las publicaciones: se guardan sin '#', máximo 10, sin duplicados
// (sin importar mayúsculas ni tildes).
import { ValidationError } from '../services/errors'
import { MSG } from '../services/validation'
import type { LugarCategoria, PostType } from '../types'
import { normalizeText } from './text'

export const MAX_HASHTAGS = 10

const VALID = /^[\p{L}\p{N}_]{2,30}$/u

export const TYPE_HASHTAG: Record<PostType, string> = {
  'busco-roomie': 'BuscoRoomie',
  'ofrezco-cuarto': 'OfrezcoCuarto',
  lugar: 'LugarRecomendado',
  viaje: 'Viaje',
}

export const LUGAR_CATEGORIAS: Record<LugarCategoria, { label: string; hashtag?: string }> = {
  restaurante: { label: 'Restaurante', hashtag: 'Restaurante' },
  cafe: { label: 'Café', hashtag: 'Café' },
  zona: { label: 'Zona bonita', hashtag: 'ZonaBonita' },
  bar: { label: 'Bar', hashtag: 'Bar' },
  museo: { label: 'Museo', hashtag: 'Museo' },
  tienda: { label: 'Tienda', hashtag: 'Tienda' },
  otro: { label: 'Otro' },
}

export const SUGGESTED_HASHTAGS: Record<PostType, string[]> = {
  'busco-roomie': ['NoFumador', 'Ordenado', 'Mascotas', 'Estudiante', 'Tranquilo'],
  'ofrezco-cuarto': ['Amoblado', 'GastosIncluidos', 'Mascotas', 'CercaDelMetro', 'BañoPrivado'],
  lugar: ['Barato', 'ParaEstudiar', 'Vegano', 'FinDeSemana', 'Vistas'],
  viaje: ['Mochilero', 'FinDeSemana', 'CompartirGastos', 'Naturaleza'],
}

/** 'Ciudad de México' → 'CiudadDeMéxico': sin espacios ni signos, cada palabra con mayúscula. */
export function hashtagFrom(texto: string): string {
  return texto
    .split(/[^\p{L}\p{N}_]+/u)
    .filter(Boolean)
    .map((w) => w[0].toLocaleUpperCase('es') + w.slice(1))
    .join('')
}

export const hashtagKey = (tag: string): string => normalizeText(tag)

export const isValidHashtag = (tag: string): boolean => VALID.test(tag)

/** Quita los '#' y espacios de lo que escribió la persona. */
export const parseHashtagInput = (raw: string): string => raw.trim().replace(/^#+/, '').trim()

/** Agrega `tag` si no está; lanza ValidationError si es inválido o ya hay 10. */
export function addHashtag(list: string[], tag: string): string[] {
  const clean = parseHashtagInput(tag)
  if (!isValidHashtag(clean)) throw new ValidationError({ hashtags: MSG.hashtag })
  if (list.some((t) => hashtagKey(t) === hashtagKey(clean))) return list
  if (list.length >= MAX_HASHTAGS) throw new ValidationError({ hashtags: MSG.hashtagsMax })
  return [...list, clean]
}

/** Campos del formulario que generan un hashtag automático. */
export type AutoHashtagSource = 'tipo' | 'ciudad' | 'zona' | 'categoria'

type AutoHashtagInput = { tipo: PostType; ciudad: string; zona?: string; categoria?: LugarCategoria }

/** El hashtag que propone cada campo, sin validar ni deduplicar. */
function candidatos(f: AutoHashtagInput): [AutoHashtagSource, string | undefined][] {
  return [
    ['tipo', TYPE_HASHTAG[f.tipo]],
    ['ciudad', hashtagFrom(f.ciudad)],
    ['zona', hashtagFrom(f.zona ?? '')],
    ['categoria', f.categoria ? LUGAR_CATEGORIAS[f.categoria].hashtag : undefined],
  ]
}

/**
 * Hashtags que salen solos del tipo, la ciudad, la zona y la categoría, en ese orden.
 * `omitir`: los campos cuyo hashtag quitó la persona.
 */
export function buildAutoHashtags(f: AutoHashtagInput, omitir: AutoHashtagSource[] = []): string[] {
  const result: string[] = []
  for (const [fuente, tag] of candidatos(f)) {
    if (omitir.includes(fuente)) continue
    if (tag && isValidHashtag(tag) && !result.some((t) => hashtagKey(t) === hashtagKey(tag))) result.push(tag)
  }
  return result
}

/** Los campos que generan `tag` como hashtag automático (puede ser más de uno: ciudad y zona). */
export function autoHashtagSources(f: AutoHashtagInput, tag: string): AutoHashtagSource[] {
  return candidatos(f)
    .filter(([, t]) => t !== undefined && hashtagKey(t) === hashtagKey(tag))
    .map(([fuente]) => fuente)
}
