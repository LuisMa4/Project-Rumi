// Colecciones tipadas sobre storage.ts. Cuando haya backend, estas funciones
// son las que se reemplazan por llamadas a la API.
import type { Conversation, Message, Post, PublicUser, User } from '../types'
import { read, write } from './storage'

export const getUsers = (): User[] => read<User[]>('users', [])
export const setUsers = (users: User[]): void => write('users', users)

export const getPosts = (): Post[] => read<Post[]>('posts', [])
export const setPosts = (posts: Post[]): void => write('posts', posts)

export const getConversations = (): Conversation[] => read<Conversation[]>('conversations', [])
export const setConversations = (conversations: Conversation[]): void =>
  write('conversations', conversations)

export const getMessages = (): Message[] => read<Message[]>('messages', [])
export const setMessages = (messages: Message[]): void => write('messages', messages)

export const getSession = (): string | null => read<string | null>('session', null)
export const setSession = (id: string | null): void => write('session', id)

export function toPublic(user: User): PublicUser {
  const { passwordHash: _omit, ...rest } = user
  return rest
}
