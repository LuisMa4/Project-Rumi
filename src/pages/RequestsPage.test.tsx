import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

it('la campana muestra 2 y lleva a solicitudes', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click((await screen.findAllByRole('link', { name: 'Solicitudes de amistad (2)' }))[0])
  expect(await screen.findByRole('heading', { name: 'Solicitudes' })).toBeInTheDocument()
})

it('aceptar y rechazar actualizan la lista y la campana', async () => {
  const { user } = await renderApp('/solicitudes', { session: 'demo' })
  const row = (await screen.findByText('Sofía Castro')).closest('li')!
  expect(within(row).getByText('@sofia.castro')).toBeInTheDocument()
  await user.click(within(row).getByRole('button', { name: 'Aceptar' }))
  await waitFor(() => expect(screen.queryByText('Sofía Castro')).toBeNull())
  expect((await screen.findAllByRole('link', { name: 'Solicitudes de amistad (1)' })).length).toBeGreaterThan(0)
  await user.click(within(screen.getByText('Andrés Molina').closest('li')!).getByRole('button', { name: 'Rechazar' }))
  expect(await screen.findByText('No tienes solicitudes pendientes')).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: 'Solicitudes de amistad' }).length).toBeGreaterThan(0)
})
