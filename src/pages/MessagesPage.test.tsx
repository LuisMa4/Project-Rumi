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
