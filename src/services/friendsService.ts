// Amistades: dos personas son amigas cuando una acepta la solicitud de la otra.
import type { FriendRequest, PublicUser, Relation } from '../types'
import { getFriendRequests, getUsers, setFriendRequests, toPublic } from './db'
import { NotFoundError, StorageFullError, ValidationError } from './errors'
import { isSeedUser } from './seed'
import { newId } from './storage'

type Listener = () => void
const listeners = new Map<string, Set<Listener>>()

function notify(...userIds: string[]): void {
  for (const id of userIds) listeners.get(id)?.forEach((cb) => cb())
}

/** Avisa a `userId` cada vez que cambia una solicitud o amistad suya. */
export function subscribe(userId: string, cb: Listener): () => void {
  const set = listeners.get(userId) ?? new Set<Listener>()
  set.add(cb)
  listeners.set(userId, set)
  return () => {
    set.delete(cb)
  }
}

const between = (r: FriendRequest, a: string, b: string) =>
  (r.de === a && r.para === b) || (r.de === b && r.para === a)

function findUser(id: string): PublicUser | undefined {
  const user = getUsers().find((u) => u.id === id)
  return user && toPublic(user)
}

/**
 * Las solicitudes entre `a` y `b`, en orden de creación (así se guardan). Manda la última:
 * si los dos rechazaron la del otro, cuenta el rechazo más reciente.
 */
const requestsBetween = (a: string, b: string) => getFriendRequests().filter((r) => between(r, a, b))

export async function relation(a: string, b: string): Promise<Relation> {
  const requests = requestsBetween(a, b)
  if (requests.some((r) => r.estado === 'aceptada')) return 'amigos'
  const ultima = requests.at(-1)
  // Una solicitud rechazada se sigue viendo como enviada: quien la envió no se entera del rechazo.
  if (ultima?.de === a) return 'enviada'
  // Quien rechazó la última ve 'ninguna' y puede enviar una nueva.
  return ultima?.estado === 'pendiente' ? 'recibida' : 'ninguna'
}

function respond(requestId: string, userId: string, estado: 'aceptada' | 'rechazada'): FriendRequest {
  const requests = getFriendRequests()
  const request = requests.find((r) => r.id === requestId)
  if (!request || request.para !== userId || request.estado !== 'pendiente') throw new NotFoundError()
  const updated: FriendRequest = { ...request, estado, respondidoEn: new Date().toISOString() }
  setFriendRequests(requests.map((r) => (r.id === requestId ? updated : r)))
  notify(request.de, request.para)
  return updated
}

export async function accept(requestId: string, userId: string): Promise<void> {
  respond(requestId, userId, 'aceptada')
}

export async function reject(requestId: string, userId: string): Promise<void> {
  respond(requestId, userId, 'rechazada')
}

export async function sendRequest(de: string, para: string): Promise<FriendRequest> {
  if (de === para) throw new ValidationError({ amistad: 'No puedes agregarte a ti mismo' })
  if (!findUser(de) || !findUser(para)) throw new NotFoundError()

  const requests = requestsBetween(de, para)
  if (requests.some((r) => r.estado === 'aceptada')) throw new ValidationError({ amistad: 'Ya son amigos' })
  const ultima = requests.at(-1)
  if (ultima?.de === de) throw new ValidationError({ amistad: 'Ya enviaste una solicitud' })
  // La otra persona ya te la había enviado: se acepta directamente.
  if (ultima?.estado === 'pendiente') return respond(ultima.id, de, 'aceptada')

  const request: FriendRequest = { id: newId(), de, para, estado: 'pendiente', creadoEn: new Date().toISOString() }
  setFriendRequests([...getFriendRequests(), request])
  notify(de, para)

  // Solo en la demo: los usuarios de ejemplo aceptan solos entre 2 y 4 s después.
  if (isSeedUser(para)) {
    setTimeout(() => {
      try {
        respond(request.id, para, 'aceptada')
      } catch (e) {
        // Si se restablecieron los datos o ya no hay espacio, no hay nada que aceptar.
        if (!(e instanceof NotFoundError) && !(e instanceof StorageFullError)) throw e
      }
    }, 2000 + Math.random() * 2000)
  }
  return request
}

export async function listIncoming(userId: string): Promise<{ request: FriendRequest; de: PublicUser }[]> {
  return getFriendRequests()
    .filter((r) => r.para === userId && r.estado === 'pendiente')
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .flatMap((request) => {
      const de = findUser(request.de)
      return de ? [{ request, de }] : []
    })
}

export async function listFriends(userId: string): Promise<PublicUser[]> {
  const ids = new Set(
    getFriendRequests()
      .filter((r) => r.estado === 'aceptada' && (r.de === userId || r.para === userId))
      .map((r) => (r.de === userId ? r.para : r.de)),
  )
  return [...ids]
    .flatMap((id) => {
      const u = findUser(id)
      return u ? [u] : []
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
