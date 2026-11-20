import { expect, it } from 'vitest'
import type { PublicUser } from '../types'
import { mrz } from './mrz'

const base: PublicUser = {
  id: 'u-demo',
  nombre: 'Alex Romero',
  usuario: 'alex.romero',
  email: 'demo@rumi.app',
  paisOrigen: 'Perú',
  fechaLlegada: '2027-02-01',
  bio: '',
  intereses: [],
  verificacion: {},
  creadoEn: '2026-01-01T00:00:00.000Z',
}

it('arma las dos líneas de 44 caracteres de Alex', () => {
  const [l1, l2] = mrz(base)
  expect(l1).toBe('P<RUMIROMERO<<ALEX<<<<<<<<<<<<<<<<<<<<<<<<<<')
  expect(l1).toHaveLength(44)
  expect(l2).toHaveLength(44)
  expect(l2).toContain('ALEX.ROMERO')
  expect(l2).toContain('PE<')
  expect(l2).toContain('270201')
})

it('quita tildes, cambia lo raro por < y une varios apellidos', () => {
  const [l1] = mrz({ ...base, nombre: 'María José Núñez-Pérez' })
  // El primer nombre es el nombre de pila; el resto, apellidos.
  expect(l1.startsWith('P<RUMIJOSE<NUNEZ<PEREZ<<MARIA<')).toBe(true)
  expect(l1).toHaveLength(44)
})

it('sin país conocido ni fecha usa XXX y relleno', () => {
  const [, l2] = mrz({ ...base, paisOrigen: 'Narnia', fechaLlegada: undefined })
  expect(l2).toContain('XXX')
  expect(l2).not.toMatch(/\d{6}/)
  expect(l2).toHaveLength(44)
})

it('recorta nombres muy largos a 44 caracteres', () => {
  const [l1] = mrz({ ...base, nombre: 'A '.repeat(40) + 'Apellidolarguisimo' })
  expect(l1).toHaveLength(44)
})
