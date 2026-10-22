import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MapView } from './MapView'

vi.mock('./LeafletMap', () => ({
  default: () => {
    throw new Error('Sin internet')
  },
}))

it('si el mapa falla se ve el aviso y el enlace sigue', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {}) // React registra el error capturado
  render(<MapView lat={1} lng={2} />)
  expect(await screen.findByText('No pudimos cargar el mapa')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir en Google Maps' })).toBeInTheDocument()
})
