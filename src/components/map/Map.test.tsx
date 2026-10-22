import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DEFAULT_COORDS } from '../../services/cities'
import { MapPicker } from './MapPicker'
import { MapView } from './MapView'

vi.mock('./LeafletMap', () => ({
  default: ({ onPick }: { onPick?: (p: { lat: number; lng: number }) => void }) => (
    <div data-testid="leaflet">
      <button type="button" onClick={() => onPick?.({ lat: 1, lng: 2 })}>
        Elegir punto de prueba
      </button>
    </div>
  ),
}))

it('MapView muestra el mapa y el enlace a Google Maps', async () => {
  render(<MapView lat={40.435} lng={-3.719} />)
  expect(await screen.findByTestId('leaflet')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps?q=40.435,-3.719',
  )
})

it('MapPicker elige y quita la ubicación', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<MapPicker center={DEFAULT_COORDS} onChange={onChange} />)
  expect(screen.queryByRole('button', { name: 'Quitar ubicación' })).toBeNull()
  await userEvent.click(await screen.findByRole('button', { name: 'Elegir punto de prueba' }))
  expect(onChange).toHaveBeenCalledWith({ lat: 1, lng: 2 })
  rerender(<MapPicker center={DEFAULT_COORDS} value={{ lat: 1, lng: 2 }} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Quitar ubicación' }))
  expect(onChange).toHaveBeenLastCalledWith(undefined)
})
