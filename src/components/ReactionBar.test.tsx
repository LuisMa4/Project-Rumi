import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it } from 'vitest'
import { setReactions } from '../services/db'
import { toggle } from '../services/reactionsService'
import { resetDemo } from '../services/seed'
import { ReactionBar } from './ReactionBar'

beforeEach(async () => {
  await resetDemo()
  setReactions([])
})

function show(postId: string, tipo: 'lugar' | 'ofrezco-cuarto' | 'busco-roomie' | 'viaje') {
  render(
    <MemoryRouter>
      <ReactionBar postId={postId} postTipo={tipo} currentUserId="u-demo" />
    </MemoryRouter>,
  )
}

it('un lugar recomendado tiene Like, Me encanta y Recomendar', async () => {
  show('p-05', 'lugar')
  const grupo = await screen.findByRole('group', { name: 'Reacciones' })
  expect(within(grupo).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
    'Like (0)',
    'Me encanta (0)',
    'Recomendar (0)',
  ])
})

it('un viaje tiene Me interesa y Recomendado', async () => {
  show('p-03', 'viaje')
  expect(await screen.findByRole('button', { name: 'Me interesa (0)' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Recomendado (0)' })).toBeInTheDocument()
})

it('al tocar una reacción sube el contador y queda marcada; al tocarla otra vez se quita', async () => {
  const user = userEvent.setup()
  show('p-05', 'lugar')
  await user.click(await screen.findByRole('button', { name: 'Like (0)' }))
  const like = await screen.findByRole('button', { name: 'Like (1)' })
  expect(like).toHaveAttribute('aria-pressed', 'true')
  await user.click(like)
  expect(await screen.findByRole('button', { name: 'Like (0)' })).toHaveAttribute('aria-pressed', 'false')
})

it('muestra quién reaccionó, con enlace a su perfil', async () => {
  await toggle('p-05', 'u-01', 'me-encanta')
  await toggle('p-05', 'u-02', 'like')
  const user = userEvent.setup()
  show('p-05', 'lugar')
  await user.click(await screen.findByRole('button', { name: 'Ver quién reaccionó (2)' }))
  const dialog = await screen.findByRole('dialog', { name: 'Reacciones' })
  expect(within(dialog).getByRole('link', { name: /Valeria Ríos/ })).toHaveAttribute('href', '/perfil/u-01')
  expect(within(dialog).getByRole('link', { name: /Mateo Fernández/ })).toHaveAttribute('href', '/perfil/u-02')
  expect(within(dialog).getByText('Me encanta')).toBeInTheDocument()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('sin reacciones no ofrece ver quién reaccionó', async () => {
  show('p-05', 'lugar')
  await screen.findByRole('button', { name: 'Like (0)' })
  expect(screen.queryByRole('button', { name: /Ver quién reaccionó/ })).not.toBeInTheDocument()
})
