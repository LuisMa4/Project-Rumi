import { beforeEach, describe, expect, it } from 'vitest'
import type { PublicUser } from '../types'
import { NotFoundError } from './errors'
import { resetDemo } from './seed'
import { getById, search, update } from './usersService'
import { MSG } from './validation'

const ids = (us: PublicUser[]) => us.map((u) => u.id)

beforeEach(async () => {
  await resetDemo()
})

it('getById', async () => {
  const u = await getById('u-01')
  expect(u.nombre).toBe('Valeria Ríos')
  expect(u).not.toHaveProperty('passwordHash')
  await expect(getById('nope')).rejects.toBeInstanceOf(NotFoundError)
})

describe('search', () => {
  it('busca por nombre sin tildes', async () => {
    expect(ids(await search({ texto: 'rios' }, 'u-demo'))).toEqual(['u-01'])
  })

  it('busca por ciudad, ordena y excluye al usuario actual', async () => {
    expect(ids(await search({ ciudadDestino: 'madrid' }, 'u-demo'))).toEqual(['u-03', 'u-02', 'u-01'])
  })

  it('filtra por fechas que coinciden', async () => {
    expect(ids(await search({ ciudadDestino: 'Madrid', coincideCon: 'u-demo' }, 'u-demo'))).toEqual([
      'u-02',
      'u-01',
    ])
  })

  it('busca por universidad', async () => {
    expect(ids(await search({ universidad: 'chile' }, 'u-demo'))).toEqual(['u-02'])
  })

  it('sin filtros devuelve a todos menos al usuario actual', async () => {
    expect(await search({}, 'u-demo')).toHaveLength(8)
  })
})

describe('update', () => {
  it('actualiza y quita la @ de instagram', async () => {
    await update('u-demo', { bio: 'Hola', instagram: '@cami.t' })
    expect(await getById('u-demo')).toMatchObject({ bio: 'Hola', instagram: 'cami.t' })
  })

  it('valida bio, nombre y fechas combinadas', async () => {
    await expect(update('u-demo', { bio: 'a'.repeat(301), nombre: '  ' })).rejects.toMatchObject({
      fieldErrors: { bio: MSG.bio, nombre: MSG.requerido },
    })
    await expect(update('u-demo', { fechaSalida: '2027-01-01' })).rejects.toMatchObject({
      fieldErrors: { fechaSalida: MSG.fechas },
    })
  })

  it('falla con un id inexistente', async () => {
    await expect(update('nope', { bio: 'x' })).rejects.toBeInstanceOf(NotFoundError)
  })
})
