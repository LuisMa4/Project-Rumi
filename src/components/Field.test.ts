import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// Se lee como texto (ruta desde la raíz del proyecto): en las pruebas, Vite no procesa el CSS.
const css = readFileSync('src/components/Field.module.css', 'utf8')

/** Declaraciones de la regla con ese selector exacto. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.:]/g, '\\$&')
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

it('los campos usan el borde con contraste suficiente', () => {
  expect(rule('.control')).toMatch(/border:\s*1px solid var\(--borde-campo\)/)
})

it('los campos no quitan el anillo de foco', () => {
  const focus = rule('.control:focus-visible')
  expect(focus).not.toBe('')
  expect(focus).not.toMatch(/outline:\s*none/)
})
