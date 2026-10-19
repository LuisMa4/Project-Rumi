import type { NewPostInput, Post, PostType, PostWithAuthor, PublicUser } from '../types'
import { includesNormalized } from '../utils/text'
import { getPosts, getUsers, setPosts, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { newId } from './storage'
import { MSG } from './validation'

const CON_PRECIO: PostType[] = ['busco-roomie', 'ofrezco-cuarto']

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

export async function searchRentals(f: { ciudad?: string; precioMax?: number }): Promise<PostWithAuthor[]> {
  return withAuthors(
    getPosts()
      .filter((p) => p.tipo === 'ofrezco-cuarto')
      .filter((p) => includesNormalized(p.ciudad, f.ciudad ?? ''))
      .filter((p) => f.precioMax === undefined || (p.precio !== undefined && p.precio <= f.precioMax)),
  )
}

export async function create(autorId: string, input: NewPostInput): Promise<PostWithAuthor> {
  const author = getUsers().find((u) => u.id === autorId)
  if (!author) throw new NotFoundError()

  const texto = input.texto.trim()
  const ciudad = input.ciudad.trim()
  const conPrecio = CON_PRECIO.includes(input.tipo)

  const errors: Record<string, string> = {}
  if (texto === '') errors.texto = MSG.postVacio
  else if (texto.length > 500) errors.texto = MSG.postLargo
  if (ciudad === '') errors.ciudad = MSG.requerido
  if (conPrecio && input.precio !== undefined && !(input.precio > 0)) errors.precio = MSG.precio
  if (input.fechaDesde && input.fechaHasta && input.fechaHasta < input.fechaDesde) {
    errors.fechaHasta = MSG.fechasPost
  }
  if (Object.keys(errors).length > 0) throw new ValidationError(errors)

  const post: Post = {
    id: newId(),
    autorId,
    tipo: input.tipo,
    texto,
    ciudad,
    creadoEn: new Date().toISOString(),
  }
  if (input.fechaDesde) post.fechaDesde = input.fechaDesde
  if (input.fechaHasta) post.fechaHasta = input.fechaHasta
  if (conPrecio && input.precio !== undefined) {
    post.precio = input.precio
    post.moneda = input.moneda || 'EUR'
  }
  if (input.tipo === 'ofrezco-cuarto' && input.zona?.trim()) post.zona = input.zona.trim()

  setPosts([...getPosts(), post])
  return { ...post, autor: toPublic(author) }
}
