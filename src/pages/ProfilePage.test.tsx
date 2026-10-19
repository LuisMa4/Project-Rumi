import { cleanup, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { create } from '../services/postsService'
import { MSG } from '../services/validation'
import { renderApp } from '../test/renderApp'

it('edita la biografía e instagram', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Alex Romero' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Biografía'))
  await user.type(screen.getByLabelText('Biografía'), 'Me gusta cocinar')
  await user.type(screen.getByLabelText('Instagram'), '@alex')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByText('Me gusta cocinar')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '@alex' })).toHaveAttribute('href', 'https://instagram.com/alex')
})

it('muestra error de biografía larga', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Biografía'))
  await user.click(screen.getByLabelText('Biografía'))
  await user.paste('a'.repeat(301))
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByLabelText('Biografía')).toHaveAccessibleDescription(MSG.bio)
  await waitFor(() => expect(screen.getByLabelText('Biografía')).toHaveFocus())
})

it('muestra error de presupuesto no positivo', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Presupuesto mensual'))
  await user.type(screen.getByLabelText('Presupuesto mensual'), '0')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByLabelText('Presupuesto mensual')).toHaveAccessibleDescription(MSG.presupuesto)
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
})

it('cancelar descarta los cambios', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Nombre completo'))
  await user.type(screen.getByLabelText('Nombre completo'), 'Otra Persona')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(await screen.findByRole('heading', { name: 'Alex Romero' })).toBeInTheDocument()
})

it('perfil ajeno, propio por id y no encontrado', async () => {
  await renderApp('/perfil/u-01', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Valeria Ríos' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Editar perfil' })).toBeNull()

  cleanup()
  await renderApp('/perfil/u-demo', { session: 'demo' })
  expect(await screen.findByRole('button', { name: 'Editar perfil' })).toBeInTheDocument()

  cleanup()
  await renderApp('/perfil/nope', { session: 'demo' })
  expect(await screen.findByText('No encontramos este perfil o conversación')).toBeInTheDocument()
})

it('cierra sesión', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
  expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
})

it('restablece la demo', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const { user } = await renderApp('/perfil', { session: 'demo' }) // renderApp ya llama a resetDemo
  await create('u-demo', { tipo: 'viaje', texto: 'temporal', ciudad: 'X' })
  await user.click(await screen.findByRole('button', { name: 'Restablecer datos de demo' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(await screen.findAllByRole('article')).toHaveLength(12)
})
