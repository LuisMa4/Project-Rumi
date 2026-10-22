import { beforeEach, describe, expect, it } from 'vitest'
import type { PublicUser } from '../types'
import { NotFoundError } from './errors'
import { resetDemo } from './seed'
import { getById, searchByUsername, update } from './usersService'
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

describe('searchByUsername', () => {
  it('busca por usuario parcial, con @ y sin tildes, excluyendo al actual', async () => {
    expect(ids(await searchByUsername('@RIOS', 'u-demo'))).toEqual(['u-01'])
    expect(ids(await searchByUsername('lucía', 'u-demo'))).toEqual(['u-03'])
    expect(await searchByUsername('  ', 'u-demo')).toEqual([])
    expect(await searchByUsername('alex', 'u-demo')).toEqual([])
  })

  it('ordena por usuario', async () => {
    expect(ids(await searchByUsername('a', 'u-demo'))).toEqual(
      ['u-06', 'u-04', 'u-07', 'u-08', 'u-03', 'u-02', 'u-05', 'u-01'],
    )
  })
})

describe('update', () => {
  it('actualiza y quita la @ de instagram', async () => {
    await update('u-demo', { bio: 'Hola', instagram: '@alex.r' })
    expect(await getById('u-demo')).toMatchObject({ bio: 'Hola', instagram: 'alex.r' })
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
