import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PriceRangeFilter } from './PriceRangeFilter'

it('con "desde" en el tope, su control queda por encima para poder bajarlo', () => {
  const { rerender } = render(<PriceRangeFilter max={600} value={[100, 600]} onChange={vi.fn()} />)
  expect(screen.getByLabelText('Precio desde')).not.toHaveAttribute('data-arriba')
  rerender(<PriceRangeFilter max={600} value={[600, 600]} onChange={vi.fn()} />)
  expect(screen.getByLabelText('Precio desde')).toHaveAttribute('data-arriba')
})
