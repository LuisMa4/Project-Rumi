import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Message } from '../types'
import {
  getConversation,
  getMessages,
  getOrCreateConversation,
  listConversations,
  markRead,
  send,
  subscribe,
  unreadFrom,
} from './chatService'
import { getConversations } from './db'
import { NotFoundError, ValidationError } from './errors'
import { AUTO_REPLIES, resetDemo } from './seed'
import { MSG } from './validation'

beforeEach(async () => {
  await resetDemo()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('no leídos', () => {
  it('noLeidos y markRead', async () => {
    expect((await listConversations('u-demo')).find((c) => c.otro.id === 'u-01')!.noLeidos).toBe(true)
    expect((await listConversations('u-demo')).find((c) => c.otro.id === 'u-04')!.noLeidos).toBe(false)
    expect([...(await unreadFrom('u-demo'))]).toEqual(['u-01'])
    await markRead('c-01', 'u-demo')
    expect((await unreadFrom('u-demo')).size).toBe(0)
  })

  it('un mensaje propio no cuenta como no leído para quien lo escribe', async () => {
    await markRead('c-01', 'u-demo')
    await send('c-01', 'u-demo', 'hola')
    expect((await unreadFrom('u-demo')).size).toBe(0)
    expect([...(await unreadFrom('u-01'))]).toEqual(['u-demo'])
  })
})

describe('conversaciones', () => {
  it('lista conversaciones con el otro y el último mensaje', async () => {
    const cs = await listConversations('u-demo')
    expect(cs.map((c) => c.otro.id)).toEqual(['u-01', 'u-04'])
    expect(cs[0].ultimoMensaje?.texto).toContain('buscar piso conmigo')
  })

  it('no duplica conversaciones', async () => {
    expect((await getOrCreateConversation('u-01', 'u-demo')).id).toBe('c-01')
    const n = await getOrCreateConversation('u-demo', 'u-05')
    expect((await getOrCreateConversation('u-05', 'u-demo')).id).toBe(n.id)
    expect(getConversations()).toHaveLength(3)
    await expect(getOrCreateConversation('u-demo', 'u-demo')).rejects.toBeInstanceOf(ValidationError)
  })

  it('oculta las conversaciones sin mensajes', async () => {
    const vacia = await getOrCreateConversation('u-demo', 'u-05')
    expect((await listConversations('u-demo')).map((c) => c.otro.id)).toEqual(['u-01', 'u-04'])
    await send(vacia.id, 'u-demo', 'hola')
    expect((await listConversations('u-demo')).map((c) => c.otro.id)).toEqual(['u-05', 'u-01', 'u-04'])
  })

  it('getConversation exige ser participante', async () => {
    expect((await getConversation('c-01', 'u-demo')).otro.id).toBe('u-01')
    await expect(getConversation('c-01', 'u-05')).rejects.toBeInstanceOf(NotFoundError)
    await expect(getConversation('nope', 'u-demo')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('send', () => {
  it('envía, valida y reordena', async () => {
    const m = await send('c-02', 'u-demo', '  hola  ')
    expect(m.texto).toBe('hola')
    expect((await getMessages('c-02')).at(-1)!.id).toBe(m.id)
    expect((await listConversations('u-demo'))[0].conversation.id).toBe('c-02')
    await expect(send('c-02', 'u-demo', '   ')).rejects.toMatchObject({
      fieldErrors: { texto: MSG.mensajeVacio },
    })
    await expect(send('c-02', 'u-demo', 'a'.repeat(1001))).rejects.toMatchObject({
      fieldErrors: { texto: MSG.mensajeLargo },
    })
  })

  it('responde automáticamente y notifica', async () => {
    const cb = vi.fn()
    subscribe('c-01', cb)
    await send('c-01', 'u-demo', 'hola')
    expect(cb).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2500)
    expect(cb).toHaveBeenCalledTimes(2)
    const reply = cb.mock.calls[1][0] as Message
    expect(reply.autorId).toBe('u-01')
    expect(AUTO_REPLIES).toContain(reply.texto)
  })

  it('la respuesta automática no genera otra respuesta', async () => {
    await send('c-01', 'u-demo', 'hola')
    await vi.advanceTimersByTimeAsync(10_000)
    const autores = (await getMessages('c-01')).slice(-2).map((m) => m.autorId)
    expect(autores).toEqual(['u-demo', 'u-01'])
  })

  it('al desuscribirse no notifica, pero la respuesta se guarda', async () => {
    const cb = vi.fn()
    const off = subscribe('c-01', cb)
    await send('c-01', 'u-demo', 'hola')
    off()
    await vi.advanceTimersByTimeAsync(2500)
    expect(cb).toHaveBeenCalledTimes(1)
    expect((await getMessages('c-01')).at(-1)!.autorId).toBe('u-01')
  })

  it('descarta la respuesta pendiente si se restablece la demo', async () => {
    await send('c-01', 'u-demo', 'hola')
    await resetDemo()
    await vi.advanceTimersByTimeAsync(2500)
    expect((await getMessages('c-01')).map((m) => m.id)).toEqual(['c-01-m1', 'c-01-m2', 'c-01-m3'])
  })
})
