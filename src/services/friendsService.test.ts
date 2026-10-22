import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nuevo } from '../test/fixtures'
import { register } from './authService'
import { NotFoundError, ValidationError } from './errors'
import { accept, listFriends, listIncoming, reject, relation, sendRequest, subscribe } from './friendsService'
import { resetDemo } from './seed'

beforeEach(async () => {
  await resetDemo()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('consultas', () => {
  it('lista amigos y solicitudes de la demo', async () => {
    expect((await listFriends('u-demo')).map((u) => u.id)).toEqual(['u-04', 'u-02', 'u-01'])
    expect((await listIncoming('u-demo')).map((r) => r.de.id).sort()).toEqual(['u-05', 'u-06'])
  })

  it('relation en los cuatro estados', async () => {
    expect(await relation('u-demo', 'u-01')).toBe('amigos')
    expect(await relation('u-demo', 'u-05')).toBe('recibida')
    expect(await relation('u-05', 'u-demo')).toBe('enviada')
    expect(await relation('u-demo', 'u-07')).toBe('ninguna')
  })
})

describe('responder', () => {
  it('aceptar y rechazar solo quien recibe', async () => {
    const [r] = await listIncoming('u-demo')
    await expect(accept(r.request.id, 'u-07')).rejects.toBeInstanceOf(NotFoundError)
    await accept(r.request.id, 'u-demo')
    expect(await relation('u-demo', r.de.id)).toBe('amigos')
    await expect(reject(r.request.id, 'u-demo')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('rechazada: quien envió sigue viendo enviada y no puede reenviar', async () => {
    const r = (await listIncoming('u-demo')).find((x) => x.de.id === 'u-05')!
    await reject(r.request.id, 'u-demo')
    expect(await relation('u-05', 'u-demo')).toBe('enviada')
    expect(await relation('u-demo', 'u-05')).toBe('ninguna')
    await expect(sendRequest('u-05', 'u-demo')).rejects.toMatchObject({
      fieldErrors: { amistad: 'Ya enviaste una solicitud' },
    })
  })

  it('quien rechazó puede enviar una solicitud nueva después', async () => {
    const r = (await listIncoming('u-demo')).find((x) => x.de.id === 'u-05')!
    await reject(r.request.id, 'u-demo')
    await sendRequest('u-demo', 'u-05')
    expect(await relation('u-demo', 'u-05')).toBe('enviada')
  })
})

describe('enviar', () => {
  it('solicitud cruzada se acepta directo; a uno mismo, a un amigo y duplicada fallan', async () => {
    await sendRequest('u-demo', 'u-05')
    expect(await relation('u-demo', 'u-05')).toBe('amigos')
    await expect(sendRequest('u-demo', 'u-demo')).rejects.toBeInstanceOf(ValidationError)
    await expect(sendRequest('u-demo', 'u-01')).rejects.toMatchObject({ fieldErrors: { amistad: 'Ya son amigos' } })
    await sendRequest('u-demo', 'u-07')
    await expect(sendRequest('u-demo', 'u-07')).rejects.toMatchObject({
      fieldErrors: { amistad: 'Ya enviaste una solicitud' },
    })
  })

  it('un usuario de ejemplo acepta solo entre 2 y 4 s; una cuenta real no', async () => {
    const cb = vi.fn()
    subscribe('u-demo', cb)
    await sendRequest('u-demo', 'u-07')
    await vi.advanceTimersByTimeAsync(1999)
    expect(await relation('u-demo', 'u-07')).toBe('enviada')
    await vi.advanceTimersByTimeAsync(2001)
    expect(await relation('u-demo', 'u-07')).toBe('amigos')
    expect(cb).toHaveBeenCalled()

    const ana = await register(nuevo())
    await sendRequest('u-demo', ana.id)
    await vi.advanceTimersByTimeAsync(5000)
    expect(await relation('u-demo', ana.id)).toBe('enviada')
  })

  it('la aceptación automática ignora StorageFullError', async () => {
    await sendRequest('u-demo', 'u-07')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    await expect(vi.advanceTimersByTimeAsync(4000)).resolves.not.toThrow()
  })
})
