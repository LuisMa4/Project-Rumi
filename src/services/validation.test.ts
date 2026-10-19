import { describe, expect, it } from 'vitest'
import { MSG, normalizeEmail, validateProfileFields } from './validation'

describe('validateProfileFields', () => {
  it('marca obligatorios vacíos o con espacios', () => {
    expect(validateProfileFields({ nombre: '   ', universidad: '' })).toEqual({
      nombre: MSG.requerido,
      universidad: MSG.requerido,
    })
  })

  it('valida correo, contraseña y fechas', () => {
    expect(
      validateProfileFields({
        email: 'ana@',
        password: '1234567',
        fechaLlegada: '2027-02-01',
        fechaSalida: '2027-02-01',
      }),
    ).toEqual({ email: MSG.email, password: MSG.password, fechaSalida: MSG.fechas })
  })

  it('una fecha presente pero vacía es obligatoria', () => {
    expect(validateProfileFields({ fechaLlegada: '' })).toEqual({ fechaLlegada: MSG.requerido })
  })

  it('limita la bio a 300', () => {
    expect(validateProfileFields({ bio: 'a'.repeat(300) })).toEqual({})
    expect(validateProfileFields({ bio: 'a'.repeat(301) })).toEqual({ bio: MSG.bio })
  })

  it('no exige campos ausentes', () => {
    expect(validateProfileFields({})).toEqual({})
  })
})

it('normaliza correos', () => {
  expect(normalizeEmail('  Ana@Mail.COM ')).toBe('ana@mail.com')
})
