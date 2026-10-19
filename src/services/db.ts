// Colecciones tipadas sobre storage.ts. Cuando haya backend, estas funciones
// son las que se reemplazan por llamadas a la API.
import type { Conversation, Message, Post, PublicUser, User } from '../types'
import { read, write } from './storage'

/** Si lo guardado no es una lista (datos dañados o de otra versión), se trata como vacío. */
function readList<T>(key: string): T[] {
  const value = read<unknown>(key, [])
  return Array.isArray(value) ? (value as T[]) : []
}

export const getUsers = (): User[] => readList<User>('users')
export const setUsers = (users: User[]): void => write('users', users)

export const getPosts = (): Post[] => readList<Post>('posts')
export const setPosts = (posts: Post[]): void => write('posts', posts)

export const getConversations = (): Conversation[] => readList<Conversation>('conversations')
export const setConversations = (conversations: Conversation[]): void =>
  write('conversations', conversations)

export const getMessages = (): Message[] => readList<Message>('messages')
export const setMessages = (messages: Message[]): void => write('messages', messages)

export function getSession(): string | null {
  const value = read<unknown>('session', null)
  return typeof value === 'string' ? value : null
}
export const setSession = (id: string | null): void => write('session', id)

export function toPublic(user: User): PublicUser {
  const { passwordHash: _omit, ...rest } = user
  return rest
}
