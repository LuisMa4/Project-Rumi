import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('muestra el nombre de la app', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Rumi' })).toBeInTheDocument()
})
