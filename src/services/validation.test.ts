import { describe, expect, it } from 'vitest'
import { MSG, normalizeEmail, normalizeUsername, validateProfileFields } from './validation'

describe('validateProfileFields', () => {
  it('marca obligatorios vacíos o con espacios', () => {
    expect(validateProfileFields({ nombre: '   ', usuario: '' })).toEqual({
      nombre: MSG.requerido,
      usuario: MSG.requerido,
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

  it('el destino y las fechas ya no son obligatorios', () => {
    expect(validateProfileFields({ ciudadDestino: '', fechaLlegada: '' })).toEqual({})
  })

  it('valida el formato del usuario y la confirmación', () => {
    expect(validateProfileFields({ usuario: 'Ana Perez' })).toEqual({ usuario: MSG.usuario })
    expect(validateProfileFields({ usuario: 'ana_perez.2' })).toEqual({})
    expect(validateProfileFields({ password: 'clave-segura-1', confirmPassword: 'otra' })).toEqual({
      confirmPassword: MSG.confirmar,
    })
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

it('normaliza usuarios', () => {
  expect(normalizeUsername('  @@Ana.Perez ')).toBe('ana.perez')
})
