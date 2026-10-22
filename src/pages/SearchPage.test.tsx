import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

const item = (name: string) =>
  within(screen.getByRole('list', { name: 'Resultados' })).getByText(name).closest('li')!

it('pide escribir un usuario', async () => {
  await renderApp('/buscar', { session: 'demo' })
  expect(await screen.findByText('Escribe un nombre de usuario para buscar')).toBeInTheDocument()
  expect(screen.queryByRole('tab')).toBeNull()
})

it('encuentra y muestra el botón según la relación', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre de usuario'), 'a')
  await waitFor(() => expect(within(item('Valeria Ríos')).getByRole('button', { name: 'Amigos ✓' })).toBeInTheDocument())
  expect(within(item('Valeria Ríos')).getByText('@valeria.rios')).toBeInTheDocument()
  expect(within(item('Sofía Castro')).getByRole('button', { name: 'Aceptar solicitud' })).toBeInTheDocument()
  await user.click(within(item('Isabella Rojas')).getByRole('button', { name: 'Agregar amigo' }))
  expect(await within(item('Isabella Rojas')).findByRole('button', { name: 'Solicitud enviada' })).toBeDisabled()
})

it('aceptar desde el resultado los vuelve amigos', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre de usuario'), 'sofia')
  await user.click(await within(await waitFor(() => item('Sofía Castro'))).findByRole('button', { name: 'Aceptar solicitud' }))
  expect(await within(item('Sofía Castro')).findByRole('button', { name: 'Amigos ✓' })).toBeInTheDocument()
})

it('sin resultados', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre de usuario'), 'zzz')
  expect(await screen.findByText('No encontramos a nadie con ese usuario')).toBeInTheDocument()
})
