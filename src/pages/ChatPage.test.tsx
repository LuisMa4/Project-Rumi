import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { setConversations } from '../services/db'
import { renderApp } from '../test/renderApp'

it('muestra el historial, envía y recibe la respuesta automática', async () => {
  const { user } = await renderApp('/mensajes/c-01', { session: 'demo' })
  const log = await screen.findByRole('log', { name: 'Mensajes' })
  await waitFor(() => expect(within(log).getAllByRole('listitem')).toHaveLength(3))
  await user.type(screen.getByLabelText('Mensaje'), 'Hola Valeria')
  await user.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(await within(log).findByText('Hola Valeria')).toBeInTheDocument()
  expect(screen.getByLabelText('Mensaje')).toHaveValue('')
  await waitFor(() => expect(within(log).getAllByRole('listitem')).toHaveLength(5), { timeout: 3000 })
})

it('un error inesperado al enviar se muestra arriba de la caja de texto', async () => {
  const { user } = await renderApp('/mensajes/c-01', { session: 'demo' })
  await user.type(await screen.findByLabelText('Mensaje'), 'Hola')
  setConversations([])
  await user.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos enviar el mensaje. Intenta de nuevo.')
  expect(screen.getByLabelText('Mensaje')).toHaveValue('Hola')
})

it('los mensajes de días anteriores muestran el día además de la hora', async () => {
  await renderApp('/mensajes/c-02', { session: 'demo' })
  const log = await screen.findByRole('log', { name: 'Mensajes' })
  await waitFor(() => expect(within(log).getAllByText(/^(ayer|\d{1,2} [a-z]{3}), \d{2}:\d{2}$/)).toHaveLength(2))
})

it('id inválido muestra no encontrado', async () => {
  await renderApp('/mensajes/nope', { session: 'demo' })
  expect(await screen.findByText('No encontramos este perfil o conversación')).toBeInTheDocument()
})

it('desde una publicación abre el chat', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  const post = (await screen.findAllByRole('article')).find((a) => within(a).queryByText('Valeria Ríos'))!
  await user.click(within(post).getByRole('button', { name: 'Enviar mensaje' }))
  expect(await screen.findByRole('heading', { name: 'Valeria Ríos' })).toBeInTheDocument()
})

it('volver lleva a la lista de mensajes', async () => {
  const { user } = await renderApp('/mensajes/c-01', { session: 'demo' })
  await user.click(await screen.findByRole('link', { name: 'Volver' }))
  expect(await screen.findByRole('heading', { name: 'Mensajes' })).toBeInTheDocument()
})
