import { beforeEach, expect, it } from 'vitest'
import { getUsers, setUsers } from './db'
import { StorageFullError } from './errors'
import { PHOTO_BUDGET_BYTES, assertPhotoBudget, photoBytesInUse } from './photoBudget'
import { resetDemo } from './seed'

beforeEach(async () => {
  await resetDemo()
})

it('cuenta solo data URLs', () => {
  setUsers(
    getUsers().map((u) =>
      u.id === 'u-demo' ? { ...u, avatarUrl: 'data:' + 'a'.repeat(95), portadaUrl: './demo/x.jpg' } : u,
    ),
  )
  expect(photoBytesInUse()).toBe(100)
})

it('rechaza lo que supera 3 MB y descuenta lo liberado', () => {
  const grande = 'data:' + 'a'.repeat(PHOTO_BUDGET_BYTES)
  expect(() => assertPhotoBudget([grande])).toThrow(StorageFullError)
  expect(() => assertPhotoBudget([grande], [grande])).not.toThrow()
})

it('el error de fotos se distingue del general', () => {
  try {
    assertPhotoBudget(['data:' + 'a'.repeat(PHOTO_BUDGET_BYTES)])
  } catch (e) {
    expect((e as StorageFullError).kind).toBe('fotos')
  }
})
