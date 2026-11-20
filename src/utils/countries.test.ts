import { expect, it } from 'vitest'
import { COUNTRIES, countryCode } from './countries'

it('reconoce países sin importar tildes, mayúsculas ni espacios', () => {
  expect(countryCode('Perú')).toBe('PE')
  expect(countryCode(' peru ')).toBe('PE')
  expect(countryCode('españa')).toBe('ES')
  expect(countryCode('MÉXICO')).toBe('MX')
})

it('devuelve undefined para lo que no es un país conocido', () => {
  expect(countryCode('Narnia')).toBeUndefined()
  expect(countryCode('')).toBeUndefined()
})

it('la lista tiene códigos ISO de 2 letras sin repetir', () => {
  const codes = COUNTRIES.map((c) => c.code)
  expect(new Set(codes).size).toBe(codes.length)
  expect(codes.every((c) => /^[A-Z]{2}$/.test(c))).toBe(true)
  for (const c of ['PE', 'ES', 'PT', 'FR', 'IT', 'DE', 'GB', 'US', 'CA', 'AR', 'CL', 'CO', 'MX']) {
    expect(codes).toContain(c)
  }
})
