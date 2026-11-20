import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { renderApp } from '../test/renderApp'

vi.mock('../components/map/LeafletMap', () => ({ default: () => <div data-testid="leaflet" /> }))

it('muestra una publicación completa, con sus reacciones', async () => {
  await renderApp('/publicacion/p-02', { session: 'demo' })
  expect(await screen.findByText(/Tengo una habitación libre en un piso compartido en Moncloa/)).toBeInTheDocument()
  expect(await screen.findByRole('group', { name: 'Reacciones' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
})

it('una publicación que no existe muestra un aviso', async () => {
  await renderApp('/publicacion/p-99', { session: 'demo' })
  expect(await screen.findByText('No encontramos esta publicación')).toBeInTheDocument()
})
