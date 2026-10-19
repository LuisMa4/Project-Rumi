import { screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

it('sin sesión redirige a login', async () => {
  await renderApp('/')
  expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
})

it('con sesión, login redirige a inicio', async () => {
  await renderApp('/login', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
})

it('marca la sección activa y navega', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  const nav = await screen.findByRole('navigation', { name: 'Principal' })
  expect(within(nav).getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
  await user.click(within(nav).getByRole('link', { name: 'Buscar' }))
  expect(await screen.findByRole('heading', { name: 'Buscar' })).toBeInTheDocument()
})

it('el perfil de otra persona no marca "Perfil" como activo', async () => {
  await renderApp('/perfil/u-01', { session: 'demo' })
  const nav = await screen.findByRole('navigation', { name: 'Principal' })
  await screen.findByRole('heading', { name: 'Valeria Ríos' })
  expect(within(nav).getByRole('link', { name: 'Perfil' })).not.toHaveAttribute('aria-current')
})

it('una ruta desconocida lleva a inicio', async () => {
  await renderApp('/xyz', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
})
