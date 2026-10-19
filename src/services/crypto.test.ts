import { expect, it } from 'vitest'
import { hashPassword } from './crypto'

it('calcula SHA-256 en hex', async () => {
  expect(await hashPassword('abc')).toBe(
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  )
})
