import { screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { getUsers, setUsers } from '../services/db'
import { MSG } from '../services/validation'
import { renderApp } from '../test/renderApp'

it('muestra las 12 publicaciones y filtra', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  expect(await screen.findAllByRole('article')).toHaveLength(12)
  await user.click(screen.getByRole('button', { name: 'Lugar recomendado' }))
  expect(screen.getByRole('button', { name: 'Lugar recomendado' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3))
})

it('publica y aparece primero', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.type(await screen.findByLabelText('Publicación'), 'Busco roomie en Madrid')
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(screen.getAllByRole('article')[0]).toHaveTextContent('Busco roomie en Madrid'))
  expect(screen.getByLabelText('Publicación')).toHaveValue('')
})

it('un error inesperado al publicar se muestra arriba del formulario', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.type(await screen.findByLabelText('Publicación'), 'Hola')
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  setUsers([]) // La cuenta desaparece (por ejemplo, se restableció en otra pestaña).
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  const form = screen.getByRole('form', { name: 'Nueva publicación' })
  expect(await within(form).findByRole('alert')).toHaveTextContent('No pudimos publicar. Intenta de nuevo.')
  expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled()
})

it('un error inesperado al abrir el chat se muestra en la publicación', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  const post = (await screen.findAllByRole('article')).find((a) => within(a).queryByText('Valeria Ríos'))!
  setUsers(getUsers().filter((u) => u.id !== 'u-01'))
  await user.click(within(post).getByRole('button', { name: 'Enviar mensaje' }))
  expect(await within(post).findByRole('alert')).toHaveTextContent('No pudimos abrir la conversación. Intenta de nuevo.')
})

it('valida publicación vacía', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Publicar' }))
  expect(await screen.findByLabelText('Publicación')).toHaveAccessibleDescription(MSG.postVacio)
})

it('valida que "Hasta" no sea anterior a "Desde"', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.type(await screen.findByLabelText('Publicación'), 'Viaje a Sintra')
  await user.type(screen.getByLabelText('Ciudad'), 'Lisboa')
  await user.type(screen.getByLabelText('Desde'), '2027-03-10')
  await user.type(screen.getByLabelText('Hasta'), '2027-03-09')
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(await screen.findByLabelText('Hasta')).toHaveAccessibleDescription(MSG.fechasPost)
})

it('al fallar la validación, el foco va al cuadro de publicación', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(screen.getByLabelText('Publicación')).toHaveFocus())
})

it('no ofrece mensaje en publicaciones propias', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.type(await screen.findByLabelText('Publicación'), 'Mía')
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(screen.getAllByRole('article')[0]).toHaveTextContent('Mía'))
  const mine = screen.getAllByRole('article')[0]
  expect(within(mine).queryByRole('button', { name: 'Enviar mensaje' })).toBeNull()
})

it('?publicar=1 enfoca el cuadro', async () => {
  await renderApp('/?publicar=1', { session: 'demo' })
  await waitFor(() => expect(screen.getByLabelText('Publicación')).toHaveFocus())
})

it('el formulario se despliega al escribir', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await screen.findAllByRole('article')
  expect(screen.queryByLabelText('Ciudad')).toBeNull()
  await user.click(screen.getByLabelText('Publicación'))
  expect(screen.getByLabelText('Ciudad')).toBeInTheDocument()
})

it('muestra precio y zona en los alquileres', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Ofrezco cuarto' }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(3))
  expect(screen.getByText('Moncloa')).toBeInTheDocument()
})
