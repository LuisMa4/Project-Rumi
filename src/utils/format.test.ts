import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatPrice, formatRelative } from './format'

describe('formatRelative', () => {
  const now = new Date(2026, 9, 18, 12, 0)

  it('da tiempos relativos en español', () => {
    expect(formatRelative(new Date(2026, 9, 18, 11, 59, 30).toISOString(), now)).toBe('ahora')
    expect(formatRelative(new Date(2026, 9, 18, 11, 15).toISOString(), now)).toBe('hace 45 min')
    expect(formatRelative(new Date(2026, 9, 18, 9, 0).toISOString(), now)).toBe('hace 3 h')
    expect(formatRelative(new Date(2026, 9, 17, 8, 0).toISOString(), now)).toBe('ayer')
    expect(formatRelative(new Date(2026, 9, 12, 8, 0).toISOString(), now)).toBe('12 oct')
  })
})

describe('fechas', () => {
  it('formatDate', () => {
    expect(formatDate('2027-02-03')).toBe('3 feb 2027')
  })

  it('formatDateRange', () => {
    expect(formatDateRange('2027-02-01', '2027-07-15')).toBe('feb–jul 2027')
    expect(formatDateRange('2026-12-01', '2027-02-15')).toBe('dic 2026–feb 2027')
    expect(formatDateRange('2027-02-01')).toBe('desde feb 2027')
    expect(formatDateRange()).toBe('')
  })
})

it('formatPrice', () => {
  expect(formatPrice(450).replace(/\s/g, ' ')).toBe('450 €')
})
