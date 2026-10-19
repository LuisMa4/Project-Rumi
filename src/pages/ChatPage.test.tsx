import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

it('muestra el historial, envía y recibe la respuesta automática', async () => {
  const { user } = await renderApp('/mensajes/c-01', { session: 'demo' })
  const list = await screen.findByRole('list', { name: 'Mensajes' })
  await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(3))
  await user.type(screen.getByLabelText('Mensaje'), 'Hola Valeria')
  await user.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(await within(list).findByText('Hola Valeria')).toBeInTheDocument()
  expect(screen.getByLabelText('Mensaje')).toHaveValue('')
  await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(5), { timeout: 3000 })
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
