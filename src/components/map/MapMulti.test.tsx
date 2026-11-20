import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { MapMulti, type MapMarker } from './MapMulti'

vi.mock('./LeafletMap', () => ({
  default: ({ markers = [], onMarkerClick }: { markers?: MapMarker[]; onMarkerClick?: (id: string) => void }) => (
    <div data-testid="leaflet">
      {markers.map((m) => (
        <button key={m.id} type="button" data-activo={m.active || undefined} onClick={() => onMarkerClick?.(m.id)}>
          pin {m.label}
        </button>
      ))}
    </div>
  ),
}))

const PINES: MapMarker[] = [
  { id: 'p-02', position: { lat: 40.435, lng: -3.719 }, label: '450 €' },
  { id: 'p-05', position: { lat: 40.4086, lng: -3.7006 }, label: 'Café', active: true },
]

it('sin pines no dibuja el mapa y lo dice', () => {
  render(<MapMulti markers={[]} />)
  expect(screen.getByText('No hay lugares con ubicación en esta ciudad')).toBeInTheDocument()
  expect(screen.queryByTestId('leaflet')).toBeNull()
})

it('con pines dibuja el mapa con todos y avisa el que se toca', async () => {
  const onMarkerClick = vi.fn()
  render(<MapMulti markers={PINES} onMarkerClick={onMarkerClick} />)
  expect(await screen.findByTestId('leaflet')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'pin 450 €' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'pin Café' })).toHaveAttribute('data-activo', 'true')
  await userEvent.click(screen.getByRole('button', { name: 'pin 450 €' }))
  expect(onMarkerClick).toHaveBeenCalledWith('p-02')
})
