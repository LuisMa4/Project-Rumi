import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// Se lee como texto (ruta desde la raíz del proyecto): en las pruebas, Vite no procesa el CSS.
const tokens = readFileSync('src/styles/tokens.css', 'utf8')

function token(name: string): string {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!match) throw new Error(`Falta el token --${name}`)
  return match[1]
}

/** Luminancia relativa según WCAG 2. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// WCAG 1.4.11: los bordes de los campos y el indicador de foco necesitan 3:1.
it('el borde de los campos contrasta al menos 3:1 con los fondos', () => {
  expect(contrast(token('borde-campo'), token('blanco'))).toBeGreaterThanOrEqual(3)
  expect(contrast(token('borde-campo'), token('celeste-suave'))).toBeGreaterThanOrEqual(3)
})

it('los estilos solo usan colores de tokens.css', () => {
  const css = readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.css') && !f.endsWith('tokens.css'))
    .map((f) => `src/${f.replaceAll('\\', '/')}`)
  expect(css.length).toBeGreaterThan(10)
  const sueltos = css.filter((f) => /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/i.test(readFileSync(f, 'utf8')))
  expect(sueltos).toEqual([])
})

it('el anillo de foco contrasta al menos 3:1 con los fondos', () => {
  expect(contrast(token('naranja-oscuro'), token('blanco'))).toBeGreaterThanOrEqual(3)
  expect(contrast(token('naranja-oscuro'), token('celeste-suave'))).toBeGreaterThanOrEqual(3)
})
