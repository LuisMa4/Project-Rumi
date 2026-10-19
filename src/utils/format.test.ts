import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatMessageTime, formatPrice, formatRelative } from './format'

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

describe('formatMessageTime', () => {
  const now = new Date(2026, 9, 18, 9, 30)

  it('solo la hora si es de hoy', () => {
    expect(formatMessageTime(new Date(2026, 9, 18, 0, 5).toISOString(), now)).toBe('00:05')
  })

  it('agrega el día si es de un día anterior', () => {
    expect(formatMessageTime(new Date(2026, 9, 17, 23, 50).toISOString(), now)).toBe('ayer, 23:50')
    expect(formatMessageTime(new Date(2026, 9, 12, 14, 5).toISOString(), now)).toBe('12 oct, 14:05')
    expect(formatMessageTime(new Date(2025, 11, 31, 8, 0).toISOString(), now)).toBe('31 dic 2025, 08:00')
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
