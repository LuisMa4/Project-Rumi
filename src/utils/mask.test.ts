import { expect, it } from 'vitest'
import { lastChars, maskEmail, maskPhone } from './mask'

it('enmascara celular, correo y documento', () => {
  expect(maskPhone('+51', '987654321')).toBe('+51 ••• ••• 321')
  expect(maskEmail('ana.perez@ulima.edu.pe')).toBe('a•••@ulima.edu.pe')
  expect(lastChars('45678912', 3)).toBe('912')
})
