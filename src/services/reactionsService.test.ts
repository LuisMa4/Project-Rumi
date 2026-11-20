import { beforeEach, describe, expect, it } from 'vitest'
import { NotFoundError, ValidationError } from './errors'
import { listUsers, summary, toggle } from './reactionsService'
import { setReactions } from './db'
import { resetDemo } from './seed'

// p-05 es un lugar recomendado y p-02 un cuarto en la semilla.
beforeEach(async () => {
  await resetDemo()
  setReactions([])
})

describe('toggle', () => {
  it('marca y desmarca una reacción', async () => {
    expect(await toggle('p-05', 'u-demo', 'like')).toBe(true)
    expect((await summary('p-05', 'u-demo')).find((r) => r.tipo === 'like')).toEqual({ tipo: 'like', count: 1, mine: true })
    expect(await toggle('p-05', 'u-demo', 'like')).toBe(false)
    expect((await summary('p-05', 'u-demo')).find((r) => r.tipo === 'like')).toEqual({ tipo: 'like', count: 0, mine: false })
  })

  it('dos reacciones distintas de la misma persona conviven', async () => {
    await toggle('p-05', 'u-demo', 'like')
    await toggle('p-05', 'u-demo', 'me-encanta')
    const s = await summary('p-05', 'u-demo')
    expect(s.filter((r) => r.mine).map((r) => r.tipo)).toEqual(['like', 'me-encanta'])
  })

  it('rechaza una reacción que no es de ese tipo de publicación', async () => {
    await expect(toggle('p-02', 'u-demo', 'like')).rejects.toBeInstanceOf(ValidationError)
  })

  it('falla si la publicación no existe', async () => {
    await expect(toggle('p-no', 'u-demo', 'like')).rejects.toBeInstanceOf(NotFoundError)
  })
})

it('summary sigue el orden del tipo y cuenta a todos', async () => {
  await toggle('p-02', 'u-01', 'recomendado')
  await toggle('p-02', 'u-03', 'recomendado')
  await toggle('p-02', 'u-demo', 'buen-lugar')
  expect(await summary('p-02', 'u-demo')).toEqual([
    { tipo: 'buen-lugar', count: 1, mine: true },
    { tipo: 'lo-conozco', count: 0, mine: false },
    { tipo: 'recomendado', count: 2, mine: false },
  ])
})

it('listUsers agrupa a las personas por reacción', async () => {
  await toggle('p-02', 'u-01', 'recomendado')
  await toggle('p-02', 'u-03', 'buen-lugar')
  const grupos = await listUsers('p-02')
  expect(grupos.map((g) => [g.tipo, g.users.map((u) => u.id)])).toEqual([
    ['buen-lugar', ['u-03']],
    ['lo-conozco', []],
    ['recomendado', ['u-01']],
  ])
  expect(grupos[0].users[0]).not.toHaveProperty('passwordHash')
})
