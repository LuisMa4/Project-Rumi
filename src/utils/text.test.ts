import { expect, it } from 'vitest'
import { includesNormalized, normalizeText } from './text'

it('ignora tildes y mayúsculas', () => {
  expect(includesNormalized('Valeria Ríos', 'RIOS')).toBe(true)
  expect(includesNormalized('Valeria Ríos', 'mateo')).toBe(false)
})

it('una búsqueda vacía coincide con todo', () => {
  expect(includesNormalized('Lisboa', '   ')).toBe(true)
})

it('normaliza texto', () => {
  expect(normalizeText('  Ciudad de MÉXICO ')).toBe('ciudad de mexico')
})
