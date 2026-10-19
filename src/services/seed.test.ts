import { beforeEach, expect, it } from 'vitest'
import { nuevo } from '../test/fixtures'
import { register } from './authService'
import { getConversations, getPosts, getSession, getUsers } from './db'
import { ensureSeeded, resetDemo } from './seed'

beforeEach(async () => {
  await resetDemo()
})

it('carga 9 usuarios, 12 publicaciones y 2 conversaciones', () => {
  expect(getUsers()).toHaveLength(9)
  expect(getPosts()).toHaveLength(12)
  expect(getConversations()).toHaveLength(2)
})

it('ensureSeeded no pisa datos existentes', async () => {
  await register(nuevo())
  await ensureSeeded()
  expect(getUsers()).toHaveLength(10)
})

it('resetDemo vuelve al estado inicial', async () => {
  await register(nuevo())
  await resetDemo()
  expect(getUsers()).toHaveLength(9)
  expect(getSession()).toBeNull()
})

it('las publicaciones de ejemplo tienen 3 de cada tipo y ninguna de la cuenta demo', () => {
  const posts = getPosts()
  for (const tipo of ['busco-roomie', 'ofrezco-cuarto', 'lugar', 'viaje']) {
    expect(posts.filter((p) => p.tipo === tipo)).toHaveLength(3)
  }
  expect(posts.some((p) => p.autorId === 'u-demo')).toBe(false)
})
