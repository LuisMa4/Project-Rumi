import { act, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

const results = () => within(screen.getByRole('list', { name: 'Resultados' })).getAllByRole('listitem')

it('busca personas por nombre', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre'), 'rios')
  await waitFor(() => expect(results()).toHaveLength(1))
  expect(screen.getByText('Valeria Ríos')).toBeInTheDocument()
})

it('filtra por ciudad y fechas que coinciden', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Ciudad destino'), 'madrid')
  await waitFor(() => expect(results()).toHaveLength(3))
  await user.click(screen.getByLabelText('Fechas que coinciden con las mías'))
  await waitFor(() => expect(screen.queryByText('Lucía Gómez')).toBeNull())
  expect(results()).toHaveLength(2)
})

it('muestra estado vacío', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre'), 'zzz')
  expect(await screen.findByText('No encontramos estudiantes con esos filtros')).toBeInTheDocument()
})

it('busca alquileres por ciudad y precio', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.click(await screen.findByRole('tab', { name: 'Alquileres' }))
  expect(screen.getByRole('tab', { name: 'Alquileres' })).toHaveAttribute('aria-selected', 'true')
  await user.type(screen.getByLabelText('Ciudad'), 'madrid')
  await user.type(screen.getByLabelText('Precio máximo'), '500')
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
})

it('sin alquileres muestra estado vacío', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.click(await screen.findByRole('tab', { name: 'Alquileres' }))
  await user.type(screen.getByLabelText('Precio máximo'), '100')
  expect(await screen.findByText('No encontramos alquileres con esos filtros')).toBeInTheDocument()
})

it('el conteo se anuncia en la misma región también sin resultados', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  const status = await screen.findByRole('status')
  await waitFor(() => expect(status).toHaveTextContent('8 estudiantes'))
  await user.type(screen.getByLabelText('Nombre'), 'zzz')
  await waitFor(() => expect(status).toHaveTextContent('0 estudiantes'))
  expect(screen.getByRole('status')).toBe(status)
})

it('el conteo de alquileres se anuncia también sin resultados', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.click(await screen.findByRole('tab', { name: 'Alquileres' }))
  const status = await screen.findByRole('status')
  await waitFor(() => expect(status).toHaveTextContent('3 alquileres'))
  await user.type(screen.getByLabelText('Precio máximo'), '100')
  await waitFor(() => expect(status).toHaveTextContent('0 alquileres'))
  expect(screen.getByRole('status')).toBe(status)
})

it('las pestañas se recorren con las flechas', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  const personas = await screen.findByRole('tab', { name: 'Personas' })
  const alquileres = screen.getByRole('tab', { name: 'Alquileres' })
  // Solo la pestaña activa entra en el orden de tabulación.
  expect(personas).toHaveAttribute('tabindex', '0')
  expect(alquileres).toHaveAttribute('tabindex', '-1')

  act(() => personas.focus())
  await user.keyboard('{ArrowRight}')
  expect(alquileres).toHaveFocus()
  expect(alquileres).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel', { name: 'Alquileres' })).toBeInTheDocument()

  await user.keyboard('{ArrowRight}')
  expect(personas).toHaveFocus()
  await user.keyboard('{ArrowLeft}')
  expect(alquileres).toHaveFocus()
  await user.keyboard('{Home}')
  expect(personas).toHaveFocus()
  await user.keyboard('{End}')
  expect(alquileres).toHaveFocus()
})
