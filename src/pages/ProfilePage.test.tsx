import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { getUsers, setUsers } from '../services/db'
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

it('codifica el usuario de Instagram en el enlace', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.type(screen.getByLabelText('Instagram'), '@alex?ref=1')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByRole('link', { name: '@alex?ref=1' })).toHaveAttribute(
    'href',
    'https://instagram.com/alex%3Fref%3D1',
  )
})

it('muestra intereses repetidos sin claves de React duplicadas', async () => {
  const consoleError = vi.spyOn(console, 'error')
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Intereses'))
  await user.type(screen.getByLabelText('Intereses'), 'Cocina, Cocina')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  const tags = await screen.findByRole('list', { name: 'Intereses' })
  expect(within(tags).getAllByRole('listitem')).toHaveLength(2)
  expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key')
  consoleError.mockRestore()
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


it('un error inesperado al guardar se muestra y deja reintentar', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  setUsers([])
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  const form = screen.getByRole('form', { name: 'Editar perfil' })
  expect(await within(form).findByRole('alert')).toHaveTextContent('No pudimos guardar los cambios. Intenta de nuevo.')
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
})

it('un error inesperado al abrir el chat desde un perfil se muestra', async () => {
  const { user } = await renderApp('/perfil/u-01', { session: 'demo' })
  await screen.findByRole('button', { name: 'Enviar mensaje' })
  expect(screen.queryByRole('alert')).toBeNull()
  setUsers(getUsers().filter((u) => u.id !== 'u-01'))
  await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos abrir la conversación. Intenta de nuevo.')
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
