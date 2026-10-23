import { describe, expect, it } from 'vitest'
import { ValidationError } from '../services/errors'
import { MSG } from '../services/validation'
import {
  addHashtag,
  autoHashtagSources,
  buildAutoHashtags,
  hashtagFrom,
  isValidHashtag,
  parseHashtagInput,
} from './hashtags'

describe('hashtags', () => {
  it('hashtagFrom', () => {
    expect(hashtagFrom('Ciudad de México')).toBe('CiudadDeMéxico')
    expect(hashtagFrom('busco roomie!')).toBe('BuscoRoomie')
    expect(hashtagFrom('  ')).toBe('')
  })

  it('valida y limpia lo escrito', () => {
    expect(parseHashtagInput('  ##CercaDeLaUPC ')).toBe('CercaDeLaUPC')
    expect(isValidHashtag('Año_2027')).toBe(true)
    expect(isValidHashtag('a')).toBe(false)
    expect(isValidHashtag('con espacio')).toBe(false)
  })

  it('addHashtag deduplica sin importar tildes ni mayúsculas, valida y limita a 10', () => {
    expect(addHashtag(['Café'], '#cafe')).toEqual(['Café'])
    expect(addHashtag(['Café'], '#Barato')).toEqual(['Café', 'Barato'])
    expect(() => addHashtag([], 'a')).toThrow(ValidationError)
    const diez = Array.from({ length: 10 }, (_, i) => `tag${i}`)
    expect(() => addHashtag(diez, 'otro')).toThrow(ValidationError)
    try {
      addHashtag(diez, 'otro')
    } catch (e) {
      expect((e as ValidationError).fieldErrors.hashtags).toBe(MSG.hashtagsMax)
    }
  })

  it('buildAutoHashtags', () => {
    expect(buildAutoHashtags({ tipo: 'lugar', ciudad: 'Madrid', zona: 'Lavapiés', categoria: 'zona' })).toEqual([
      'LugarRecomendado',
      'Madrid',
      'Lavapiés',
      'ZonaBonita',
    ])
    expect(buildAutoHashtags({ tipo: 'lugar', ciudad: '', categoria: 'otro' })).toEqual(['LugarRecomendado'])
    expect(buildAutoHashtags({ tipo: 'busco-roomie', ciudad: 'Ciudad de México' })).toEqual([
      'BuscoRoomie',
      'CiudadDeMéxico',
    ])
  })

  it('autoHashtagSources dice qué campos generan un hashtag y buildAutoHashtags los puede omitir', () => {
    const f = { tipo: 'ofrezco-cuarto', ciudad: 'Madrid', zona: 'madrid' } as const
    expect(autoHashtagSources(f, 'MADRID')).toEqual(['ciudad', 'zona'])
    expect(autoHashtagSources(f, 'Moncloa')).toEqual([])
    expect(buildAutoHashtags(f, ['ciudad'])).toEqual(['OfrezcoCuarto', 'Madrid'])
    expect(buildAutoHashtags(f, ['ciudad', 'zona'])).toEqual(['OfrezcoCuarto'])
    expect(buildAutoHashtags(f, ['tipo'])).toEqual(['Madrid'])
  })
})
