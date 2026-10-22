import type { Conversation, ConversationSummary, Message, PublicUser } from '../types'
import { getConversations, getMessages as getAllMessages, getUsers, setConversations, setMessages, toPublic } from './db'
import { NotFoundError, StorageFullError, ValidationError } from './errors'
import { AUTO_REPLIES } from './seed'
import { newId } from './storage'
import { MSG } from './validation'

type Listener = (m: Message) => void
const listeners = new Map<string, Set<Listener>>()

function findUser(id: string): PublicUser | undefined {
  const user = getUsers().find((u) => u.id === id)
  return user && toPublic(user)
}

const otherId = (c: Conversation, userId: string) => c.participantes.find((p) => p !== userId)!

const byDate = (a: Message, b: Message) => a.enviadoEn.localeCompare(b.enviadoEn)

/** Sin leer: el último mensaje es del otro y es posterior a lo que `userId` ya leyó. */
function isUnread(conversation: Conversation, ultimo: Message, userId: string): boolean {
  if (ultimo.autorId === userId) return false
  const leido = conversation.leidoHasta?.[userId]
  return !leido || leido < ultimo.enviadoEn
}

/** Ids de las personas que te escribieron mensajes que aún no leíste. */
export async function unreadFrom(userId: string): Promise<Set<string>> {
  const summaries = await listConversations(userId)
  return new Set(summaries.filter((s) => s.noLeidos).map((s) => s.otro.id))
}

/** Marca como leída la conversación hasta su último mensaje. */
export async function markRead(conversacionId: string, userId: string): Promise<void> {
  const conversations = getConversations()
  const conversation = conversations.find((c) => c.id === conversacionId)
  if (!conversation || !conversation.participantes.includes(userId)) return
  const ultimo = getAllMessages()
    .filter((m) => m.conversacionId === conversacionId)
    .sort(byDate)
    .at(-1)
  if (!ultimo || conversation.leidoHasta?.[userId] === ultimo.enviadoEn) return
  setConversations(
    conversations.map((c) =>
      c.id === conversacionId ? { ...c, leidoHasta: { ...c.leidoHasta, [userId]: ultimo.enviadoEn } } : c,
    ),
  )
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const messages = getAllMessages()
  const summaries: ConversationSummary[] = []
  for (const conversation of getConversations()) {
    if (!conversation.participantes.includes(userId)) continue
    const otro = findUser(otherId(conversation, userId))
    if (!otro) continue
    const ultimoMensaje = messages
      .filter((m) => m.conversacionId === conversation.id)
      .sort(byDate)
      .at(-1)
    // Abrir un chat y no escribir no debe dejar una conversación vacía en la bandeja.
    if (!ultimoMensaje) continue
    summaries.push({ conversation, otro, ultimoMensaje, noLeidos: isUnread(conversation, ultimoMensaje, userId) })
  }
  return summaries.sort((a, b) => b.conversation.actualizadoEn.localeCompare(a.conversation.actualizadoEn))
}

export async function getOrCreateConversation(a: string, b: string): Promise<Conversation> {
  if (a === b) throw new ValidationError({ usuario: 'No puedes escribirte a ti mismo' })
  if (!findUser(a) || !findUser(b)) throw new NotFoundError()

  const conversations = getConversations()
  const existing = conversations.find((c) => c.participantes.includes(a) && c.participantes.includes(b))
  if (existing) return existing

  const conversation: Conversation = {
    id: newId(),
    participantes: [a, b],
    actualizadoEn: new Date().toISOString(),
    leidoHasta: {},
  }
  setConversations([...conversations, conversation])
  return conversation
}

export async function getConversation(
  id: string,
  userId: string,
): Promise<{ conversation: Conversation; otro: PublicUser }> {
  const conversation = getConversations().find((c) => c.id === id)
  if (!conversation || !conversation.participantes.includes(userId)) throw new NotFoundError()
  const otro = findUser(otherId(conversation, userId))
  if (!otro) throw new NotFoundError()
  return { conversation, otro }
}

export async function getMessages(conversacionId: string): Promise<Message[]> {
  return getAllMessages()
    .filter((m) => m.conversacionId === conversacionId)
    .sort(byDate)
}

function appendMessage(conversation: Conversation, autorId: string, texto: string): Message {
  const message: Message = {
    id: newId(),
    conversacionId: conversation.id,
    autorId,
    texto,
    enviadoEn: new Date().toISOString(),
  }
  setMessages([...getAllMessages(), message])
  setConversations(
    getConversations().map((c) => (c.id === conversation.id ? { ...c, actualizadoEn: message.enviadoEn } : c)),
  )
  listeners.get(conversation.id)?.forEach((cb) => cb(message))
  return message
}

export async function send(conversacionId: string, autorId: string, texto: string): Promise<Message> {
  const conversation = getConversations().find((c) => c.id === conversacionId)
  if (!conversation || !conversation.participantes.includes(autorId)) throw new NotFoundError()

  const clean = texto.trim()
  if (clean === '') throw new ValidationError({ texto: MSG.mensajeVacio })
  if (clean.length > 1000) throw new ValidationError({ texto: MSG.mensajeLargo })

  const message = appendMessage(conversation, autorId, clean)

  // Solo para la demo: el otro estudiante responde a los 1.5–2.5 s.
  const replier = otherId(conversation, autorId)
  setTimeout(() => {
    // Si el mensaje ya no existe (se restablecieron los datos), no hay a quién responder.
    if (!getAllMessages().some((m) => m.id === message.id)) return
    const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]
    try {
      appendMessage(conversation, replier, reply)
    } catch (e) {
      // Sin espacio en el navegador: la respuesta de la demo simplemente no llega.
      if (!(e instanceof StorageFullError)) throw e
    }
  }, 1500 + Math.random() * 1000)

  return message
}

export function subscribe(conversacionId: string, cb: Listener): () => void {
  const set = listeners.get(conversacionId) ?? new Set<Listener>()
  set.add(cb)
  listeners.set(conversacionId, set)
  return () => {
    set.delete(cb)
  }
}
