import { expect, it } from 'vitest'
import { CITY_COORDS, coordsForCity } from './cities'

it('coordsForCity ignora tildes y mayúsculas', () => {
  expect(coordsForCity('ciudad de mexico')).toEqual(CITY_COORDS['Ciudad de México'])
  expect(coordsForCity('  MADRID ')).toEqual(CITY_COORDS.Madrid)
  expect(coordsForCity('Tokio')).toBeUndefined()
})
