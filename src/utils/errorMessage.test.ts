import { expect, it } from 'vitest'
import { StorageFullError } from '../services/errors'
import { MSG } from '../services/validation'
import { errorMessage } from './errorMessage'

it('traduce la falta de espacio y usa el texto de respaldo para lo demás', () => {
  expect(errorMessage(new StorageFullError('general'), 'Intenta de nuevo')).toBe(MSG.espacioGeneral)
  expect(errorMessage(new StorageFullError('fotos'), 'Intenta de nuevo')).toBe(MSG.espacioFotos)
  expect(errorMessage(new Error('x'), 'Intenta de nuevo')).toBe('Intenta de nuevo')
})
