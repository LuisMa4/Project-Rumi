import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { PriceRangeFilter } from './PriceRangeFilter'

// En las pruebas, Vite no procesa el CSS: se lee como texto.
it('el pulgar marca el foco con el anillo naranja oscuro en Chrome, Safari y Firefox', () => {
  const css = readFileSync('src/components/PriceRangeFilter.module.css', 'utf8')
  for (const pulgar of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
    expect(css).toMatch(new RegExp(`input:focus-visible${pulgar}\\s*\\{[^}]*var\\(--naranja-oscuro\\)`))
  }
})

it('con "desde" en el tope, su control queda por encima para poder bajarlo', () => {
  const { rerender } = render(<PriceRangeFilter max={600} value={[100, 600]} onChange={vi.fn()} />)
  expect(screen.getByLabelText('Precio desde')).not.toHaveAttribute('data-arriba')
  rerender(<PriceRangeFilter max={600} value={[600, 600]} onChange={vi.fn()} />)
  expect(screen.getByLabelText('Precio desde')).toHaveAttribute('data-arriba')
})
