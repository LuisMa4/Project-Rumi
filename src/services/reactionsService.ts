import type { Post, PublicUser, ReactionTipo } from '../types'
import { REACTIONS_BY_POST_TYPE } from '../utils/reactions'
import { getPosts, getReactions, getUsers, setReactions, toPublic } from './db'
import { NotFoundError, ValidationError } from './errors'
import { newId } from './storage'

function findPost(postId: string): Post {
  const post = getPosts().find((p) => p.id === postId)
  if (!post) throw new NotFoundError('No encontramos esta publicación')
  return post
}

const tiposDe = (post: Post): ReactionTipo[] => REACTIONS_BY_POST_TYPE[post.tipo].map((r) => r.tipo)

/** Marca la reacción o la quita si ya estaba. Devuelve true si quedó marcada. */
export async function toggle(postId: string, userId: string, tipo: ReactionTipo): Promise<boolean> {
  const post = findPost(postId)
  if (!tiposDe(post).includes(tipo)) throw new ValidationError({ tipo: 'Esa reacción no aplica a esta publicación' })
  const reactions = getReactions()
  const existente = reactions.find((r) => r.postId === postId && r.userId === userId && r.tipo === tipo)
  if (existente) {
    setReactions(reactions.filter((r) => r !== existente))
    return false
  }
  setReactions([...reactions, { id: newId(), postId, userId, tipo, creadoEn: new Date().toISOString() }])
  return true
}

/** Cuántas hay de cada reacción del tipo de la publicación y cuáles marcó `userId`. */
export async function summary(postId: string, userId: string): Promise<{ tipo: ReactionTipo; count: number; mine: boolean }[]> {
  const post = findPost(postId)
  const deEste = getReactions().filter((r) => r.postId === postId)
  return tiposDe(post).map((tipo) => {
    const del = deEste.filter((r) => r.tipo === tipo)
    return { tipo, count: del.length, mine: del.some((r) => r.userId === userId) }
  })
}

/** Quién reaccionó, agrupado por reacción (de la más antigua a la más nueva). */
export async function listUsers(postId: string): Promise<{ tipo: ReactionTipo; users: PublicUser[] }[]> {
  const post = findPost(postId)
  const users = new Map(getUsers().map((u) => [u.id, toPublic(u)]))
  const deEste = getReactions()
    .filter((r) => r.postId === postId)
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
  return tiposDe(post).map((tipo) => ({
    tipo,
    users: deEste.filter((r) => r.tipo === tipo && users.has(r.userId)).map((r) => users.get(r.userId)!),
  }))
}
