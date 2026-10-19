import { screen, waitFor, within } from '@testing-library/react'
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
