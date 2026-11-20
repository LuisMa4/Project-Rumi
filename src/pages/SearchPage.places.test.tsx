import { screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { renderApp } from '../test/renderApp'

vi.mock('../components/map/LeafletMap', () => ({
  default: ({ markers = [], onMarkerClick }: { markers?: { id: string; label: string }[]; onMarkerClick?: (id: string) => void }) => (
    <div data-testid="leaflet">
      {markers.map((m) => (
        <button key={m.id} type="button" onClick={() => onMarkerClick?.(m.id)}>
          pin {m.id}
        </button>
      ))}
    </div>
  ),
}))

const ai = vi.hoisted(() => ({ ask: vi.fn(async () => ({ texto: 'Te recomiendo estos', posts: [] })) }))
vi.mock('../services/aiService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/aiService')>()),
  ask: ai.ask,
  isConfigured: () => true,
}))

async function lugares() {
  const r = await renderApp('/buscar', { session: 'demo' })
  await r.user.click(await screen.findByRole('tab', { name: 'Lugares' }))
  return r
}

it('tiene pestañas Personas y Lugares; Personas es la inicial', async () => {
  await renderApp('/buscar', { session: 'demo' })
  expect(await screen.findByRole('tab', { name: 'Personas' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Lugares' })).toHaveAttribute('aria-selected', 'false')
  expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument()
})

it('las flechas cambian de pestaña', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  ;(await screen.findByRole('tab', { name: 'Personas' })).focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Lugares' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Lugares' })).toHaveFocus()
})

it('Lugares arranca en la ciudad de destino y muestra mapa y lista', async () => {
  await lugares()
  expect(screen.getByLabelText('¿Dónde?')).toHaveValue('Madrid')
  const lista = await screen.findByRole('list', { name: 'Cuartos y lugares' })
  await waitFor(() => expect(within(lista).getAllByRole('article')).toHaveLength(6))
  expect(await screen.findByTestId('leaflet')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /^pin / })).toHaveLength(6)
})

it('una ciudad sin resultados lo dice', async () => {
  const { user } = await lugares()
  await user.clear(screen.getByLabelText('¿Dónde?'))
  await user.type(screen.getByLabelText('¿Dónde?'), 'Narnia')
  expect(await screen.findByText('Todavía no hay cuartos ni lugares en Narnia')).toBeInTheDocument()
  expect(screen.queryByTestId('leaflet')).toBeNull()
})

it('tocar un pin resalta su publicación', async () => {
  const { user } = await lugares()
  await user.click(await screen.findByRole('button', { name: 'pin p-14' }))
  const item = screen.getByRole('list', { name: 'Cuartos y lugares' }).querySelector('[aria-current="true"]')
  expect(item).not.toBeNull()
  expect(item).toHaveTextContent('Café tranquilo con wifi')
})

it('Pídele a la IA los mejores abre el asistente con la pregunta enviada', async () => {
  const { user } = await lugares()
  await user.click(await screen.findByRole('button', { name: 'Pídele a la IA los mejores' }))
  const panel = await screen.findByRole('dialog', { name: 'Asistente Rumi' })
  expect(within(panel).getByText('¿Cuáles son los mejores lugares y cuartos en Madrid?')).toBeInTheDocument()
  expect(await within(panel).findByText('Te recomiendo estos')).toBeInTheDocument()
})
