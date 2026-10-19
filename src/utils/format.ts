const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

/** Lee 'YYYY-MM-DD' como fecha local (new Date('2027-02-03') sería UTC y puede cambiar de día). */
function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const diff = now.getTime() - date.getTime()
  if (diff < MINUTO) return 'ahora'
  if (diff < HORA) return `hace ${Math.floor(diff / MINUTO)} min`
  if (diff < DIA) return `hace ${Math.floor(diff / HORA)} h`
  if (diff < 2 * DIA) return 'ayer'
  const dia = `${date.getDate()} ${MESES[date.getMonth()]}`
  return date.getFullYear() === now.getFullYear() ? dia : `${dia} ${date.getFullYear()}`
}

export function formatDate(iso: string): string {
  const d = parseDay(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateRange(desde?: string, hasta?: string): string {
  if (!desde) return ''
  const a = parseDay(desde)
  if (!hasta) return `desde ${MESES[a.getMonth()]} ${a.getFullYear()}`
  const b = parseDay(hasta)
  if (a.getFullYear() === b.getFullYear()) {
    return `${MESES[a.getMonth()]}–${MESES[b.getMonth()]} ${b.getFullYear()}`
  }
  return `${MESES[a.getMonth()]} ${a.getFullYear()}–${MESES[b.getMonth()]} ${b.getFullYear()}`
}

export function formatPrice(precio: number, moneda = 'EUR'): string {
  return new Intl.NumberFormat('es', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio)
}
