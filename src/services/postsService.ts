import type { NewPostInput, Post, PostType, PostWithAuthor, PublicUser } from '../types'
import { MAX_HASHTAGS, hashtagKey, isValidHashtag, parseHashtagInput } from '../utils/hashtags'
import { getPosts, getUsers, setPosts, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { assertPhotoBudget } from './photoBudget'
import { newId } from './storage'
import { MSG } from './validation'

const MAX_FOTOS = 4

type Campos = { zona: boolean; fechas: boolean; precio: boolean; personas: boolean; lugar: boolean; ubicacion: boolean }

/** Qué campos opcionales usa cada tipo; el resto se descarta al guardar. */
const CAMPOS: Record<PostType, Campos> = {
  'busco-roomie': { zona: true, fechas: true, precio: true, personas: true, lugar: false, ubicacion: false },
  'ofrezco-cuarto': { zona: true, fechas: true, precio: true, personas: false, lugar: false, ubicacion: true },
  lugar: { zona: true, fechas: false, precio: false, personas: false, lugar: true, ubicacion: true },
  viaje: { zona: false, fechas: true, precio: false, personas: false, lugar: false, ubicacion: false },
}

function withAuthors(posts: Post[]): PostWithAuthor[] {
  const authors = new Map<string, PublicUser>(getUsers().map((u) => [u.id, toPublic(u)]))
  return posts
    .filter((p) => authors.has(p.autorId))
    .map((p) => ({ ...p, autor: authors.get(p.autorId)! }))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

export async function list(filter: { tipo?: PostType } = {}): Promise<PostWithAuthor[]> {
  return withAuthors(getPosts().filter((p) => !filter.tipo || p.tipo === filter.tipo))
}

export async function listByAuthor(autorId: string): Promise<PostWithAuthor[]> {
  return withAuthors(getPosts().filter((p) => p.autorId === autorId))
}

/** Rango de una publicación: con un solo precio, desde y hasta son el mismo. */
function rango(p: Post): [number, number] | null {
  const min = p.precioMin ?? p.precioMax
  const max = p.precioMax ?? p.precioMin
  return min === undefined || max === undefined ? null : [min, max]
}

/** Alquileres cuyo rango de precio se cruza con [precioDesde, precioHasta]. Sin límites, todos. */
export async function searchRentals(f: { precioDesde?: number; precioHasta?: number }): Promise<PostWithAuthor[]> {
  const conLimite = f.precioDesde !== undefined || f.precioHasta !== undefined
  return withAuthors(
    getPosts()
      .filter((p) => p.tipo === 'ofrezco-cuarto')
      .filter((p) => {
        if (!conLimite) return true
        const r = rango(p)
        if (!r) return false
        return r[0] <= (f.precioHasta ?? Infinity) && r[1] >= (f.precioDesde ?? -Infinity)
      }),
  )
}

/** Precio más alto publicado en alquileres, redondeado a la centena siguiente (mínimo 100). */
export async function maxRentalPrice(): Promise<number> {
  const precios = getPosts()
    .filter((p) => p.tipo === 'ofrezco-cuarto')
    .map((p) => rango(p)?.[1] ?? 0)
  return Math.max(100, Math.ceil(Math.max(0, ...precios) / 100) * 100)
}

function isHttpUrl(texto: string): boolean {
  if (!/^https?:\/\//i.test(texto)) return false
  try {
    new URL(texto)
    return true
  } catch {
    return false
  }
}

function cleanHashtags(tags: string[]): string[] {
  const result: string[] = []
  for (const raw of tags) {
    const tag = parseHashtagInput(raw)
    if (!isValidHashtag(tag) || result.some((t) => hashtagKey(t) === hashtagKey(tag))) continue
    result.push(tag)
  }
  return result.slice(0, MAX_HASHTAGS)
}

export async function create(autorId: string, input: NewPostInput): Promise<PostWithAuthor> {
  const author = getUsers().find((u) => u.id === autorId)
  if (!author) throw new NotFoundError()

  const campos = CAMPOS[input.tipo]
  const texto = input.texto.trim()
  const ciudad = input.ciudad.trim()
  const nombreLugar = input.nombreLugar?.trim() ?? ''
  const enlace = input.enlace?.trim() ?? ''
  const fotos = input.fotos ?? []
  const personas = campos.personas ? (input.personas ?? 1) : undefined
  const precioMin = campos.precio ? input.precioMin : undefined
  const precioMax = campos.precio ? input.precioMax : undefined

  const errors: Record<string, string> = {}
  if (texto === '') errors.texto = MSG.postVacio
  else if (texto.length > 500) errors.texto = MSG.postLargo
  if (ciudad === '') errors.ciudad = MSG.requerido
  if (precioMin !== undefined && !(precioMin > 0)) errors.precioMin = MSG.precio
  if (precioMax !== undefined && !(precioMax > 0)) errors.precioMax = MSG.precio
  if (!errors.precioMin && !errors.precioMax && precioMin !== undefined && precioMax !== undefined && precioMin > precioMax) {
    errors.precioMin = MSG.precioRango
  }
  if (personas !== undefined && !(Number.isInteger(personas) && personas >= 1 && personas <= 6)) {
    errors.personas = MSG.personas
  }
  if (campos.fechas && input.fechaDesde && input.fechaHasta && input.fechaHasta < input.fechaDesde) {
    errors.fechaHasta = MSG.fechasPost
  }
  if (enlace && !isHttpUrl(enlace)) errors.enlace = MSG.enlace
  if (campos.lugar) {
    if (!input.categoria) errors.categoria = MSG.categoria
    if (nombreLugar === '') errors.nombreLugar = MSG.requerido
    else if (nombreLugar.length > 80) errors.nombreLugar = MSG.nombreLugar
  }
  if (fotos.length > MAX_FOTOS) errors.fotos = MSG.fotosMax
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  // Antes de guardar: que las fotos entren en el presupuesto de espacio.
  assertPhotoBudget(fotos)

  const post: Post = {
    id: newId(),
    autorId,
    tipo: input.tipo,
    texto,
    ciudad,
    hashtags: cleanHashtags(input.hashtags ?? []),
    fotos,
    creadoEn: new Date().toISOString(),
  }
  if (campos.zona && input.zona?.trim()) post.zona = input.zona.trim()
  if (campos.fechas && input.fechaDesde) post.fechaDesde = input.fechaDesde
  if (campos.fechas && input.fechaHasta) post.fechaHasta = input.fechaHasta
  if (precioMin !== undefined) post.precioMin = precioMin
  if (precioMax !== undefined) post.precioMax = precioMax
  if (precioMin !== undefined || precioMax !== undefined) post.moneda = input.moneda || 'EUR'
  if (personas !== undefined) post.personas = personas
  if (campos.lugar) {
    post.categoria = input.categoria
    post.nombreLugar = nombreLugar
  }
  if (enlace) post.enlace = enlace
  if (campos.ubicacion && input.ubicacion) post.ubicacion = input.ubicacion

  setPosts([...getPosts(), post])
  return { ...post, autor: toPublic(author) }
}
