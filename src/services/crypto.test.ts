import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hashPassword } from './crypto'
import { newId } from './storage'

it('calcula SHA-256 en hex', async () => {
  expect(await hashPassword('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})

// En HTTP fuera de localhost (por ejemplo, el celular en la red local)
// el navegador no expone crypto.subtle ni crypto.randomUUID.
describe('sin contexto seguro', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function withoutSecureCrypto() {
    const original = globalThis.crypto
    vi.stubGlobal('crypto', { getRandomValues: original.getRandomValues.bind(original) })
  }

  it('calcula el mismo SHA-256 sin crypto.subtle', async () => {
    withoutSecureCrypto()
    const largo = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'
    const utf8 = 'contraseña con ñ y tildes: áéíóú'
    expect(await hashPassword('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(await hashPassword(largo)).toBe(createHash('sha256').update(largo).digest('hex'))
    expect(await hashPassword(utf8)).toBe(createHash('sha256').update(utf8).digest('hex'))
    expect(await hashPassword('')).toBe(createHash('sha256').update('').digest('hex'))
  })

  it('genera ids sin crypto.randomUUID', () => {
    withoutSecureCrypto()
    const a = newId()
    const b = newId()
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(a).not.toBe(b)
  })
})
