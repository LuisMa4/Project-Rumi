import { beforeEach, describe, expect, it } from 'vitest'
import type { PublicUser } from '../types'
import { NotFoundError } from './errors'
import { register } from './authService'
import { nuevo } from '../test/fixtures'
import { resetDemo } from './seed'
import { StorageFullError } from './errors'
import { PHOTO_BUDGET_BYTES } from './photoBudget'
import {
  generateCode,
  getById,
  searchByUsername,
  setAvatar,
  setPortada,
  update,
  verifyCelular,
  verifyDni,
  verifyUniversidad,
} from './usersService'
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

describe('fotos', () => {
  it('setAvatar reemplaza y libera la anterior en el presupuesto', async () => {
    const mitad = 'data:' + 'a'.repeat(PHOTO_BUDGET_BYTES / 2)
    await setAvatar('u-demo', mitad)
    await setAvatar('u-demo', mitad) // no suma dos veces
    expect((await getById('u-demo')).avatarUrl).toBe(mitad)
    await expect(setPortada('u-demo', mitad + 'x'.repeat(PHOTO_BUDGET_BYTES))).rejects.toBeInstanceOf(StorageFullError)
    expect((await getById('u-demo')).portadaUrl).toBeUndefined()
  })

  it('setPortada guarda la portada', async () => {
    await setPortada('u-demo', 'data:image/jpeg;base64,AA')
    expect((await getById('u-demo')).portadaUrl).toBe('data:image/jpeg;base64,AA')
  })
})

it('las fechas van juntas', async () => {
  const ana = await register(nuevo())
  await expect(update(ana.id, { fechaLlegada: '2027-02-01' })).rejects.toMatchObject({
    fieldErrors: { fechaSalida: MSG.fechasPar },
  })
  await update(ana.id, { fechaLlegada: '2027-02-01', fechaSalida: '2027-07-01' })
  await expect(update(ana.id, { fechaSalida: '' })).rejects.toMatchObject({ fieldErrors: { fechaSalida: MSG.fechasPar } })
  await update(ana.id, { fechaLlegada: '', fechaSalida: '' })
  expect((await getById(ana.id)).fechaLlegada).toBeFalsy()
})

describe('verificación', () => {
  it('verifyDni guarda solo los últimos 3 caracteres', async () => {
    await verifyDni('u-08', { numero: '45678912' })
    expect(localStorage.getItem('rumi:users')).not.toContain('45678912')
    expect((await getById('u-08')).verificacion.dni?.ultimos).toBe('912')
    await expect(verifyDni('u-08', { numero: '12-34' })).rejects.toMatchObject({ fieldErrors: { numero: MSG.documento } })
  })

  it('verifyCelular guarda el número enmascarado', async () => {
    await verifyCelular('u-08', { codigoPais: '+51', numero: '987654321' })
    expect((await getById('u-08')).verificacion.celular?.enmascarado).toBe('+51 ••• ••• 321')
    expect(localStorage.getItem('rumi:users')).not.toContain('987654321')
    await expect(verifyCelular('u-08', { codigoPais: '+51', numero: '123' })).rejects.toMatchObject({
      fieldErrors: { numero: MSG.celular },
    })
  })

  it('verifyUniversidad rechaza correos personales y guarda la universidad', async () => {
    await expect(
      verifyUniversidad('u-demo', { universidad: 'Universidad de Lima', correo: 'alex@gmail.com' }),
    ).rejects.toMatchObject({ fieldErrors: { correo: MSG.correoPersonal } })
    await verifyUniversidad('u-demo', { universidad: 'Universidad de Lima', correo: 'alex@aloe.ulima.edu.pe' })
    expect(await getById('u-demo')).toMatchObject({
      universidad: 'Universidad de Lima',
      verificacion: { universidad: { nombre: 'Universidad de Lima', correoEnmascarado: 'a•••@aloe.ulima.edu.pe' } },
    })
  })

  it('generateCode da 6 dígitos', () => {
    expect(generateCode()).toMatch(/^\d{6}$/)
  })
})
