import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

it('lista conversaciones y abre una', async () => {
  const { user } = await renderApp('/mensajes', { session: 'demo' })
  const links = await screen.findAllByRole('link', { name: /Valeria Ríos|Diego Paredes/ })
  expect(links).toHaveLength(2)
  expect(links[0]).toHaveTextContent('Valeria Ríos')
  await user.click(links[0])
  expect(await screen.findByRole('heading', { name: 'Valeria Ríos' })).toBeInTheDocument()
})

it('no lista una conversación abierta sin mensajes', async () => {
  const { user } = await renderApp('/perfil/u-05', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Enviar mensaje' }))
  await user.click(await screen.findByRole('link', { name: 'Volver' }))
  expect(await screen.findAllByRole('link', { name: /Valeria Ríos|Diego Paredes/ })).toHaveLength(2)
  expect(screen.queryByRole('link', { name: /Sofía Castro/ })).toBeNull()
})
