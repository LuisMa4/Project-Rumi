import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { getUsers, setUsers } from '../services/db'
import { renderApp } from '../test/renderApp'

it('arranca en Lugar recomendado y Todo muestra las 15 publicaciones', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  expect(await screen.findByRole('button', { name: 'Lugar recomendado' })).toHaveAttribute('aria-pressed', 'true')
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(5))
  await user.click(screen.getByRole('button', { name: 'Todo' }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(15))
})

it('sin título visible ni saludo, pero con encabezado para lectores de pantalla', async () => {
  await renderApp('/', { session: 'demo' })
  const h1 = await screen.findByRole('heading', { level: 1, name: 'Inicio' })
  expect(h1).toHaveClass('sr-only')
  expect(screen.queryByText(/Hola, Alex/)).toBeNull()
})

it('muestra la fila de amigos con el anillo de no leídos y sin cuadro para publicar', async () => {
  await renderApp('/', { session: 'demo' })
  const row = await screen.findByRole('region', { name: 'Amigos' })
  await waitFor(() => expect(within(row).getAllByRole('button')).toHaveLength(3))
  expect(within(row).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
    'Valeria Ríos, mensajes sin leer',
    'Diego Paredes',
    'Mateo Fernández',
  ])
  expect(within(row).getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/buscar')
  expect(screen.queryByLabelText('Publicación')).toBeNull()
})

it('tocar un amigo abre el chat', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  const row = await screen.findByRole('region', { name: 'Amigos' })
  await user.click(await within(row).findByRole('button', { name: 'Mateo Fernández' }))
  expect(await screen.findByRole('heading', { name: 'Mateo Fernández' })).toBeInTheDocument()
})

it('sin amigos invita a agregar', async () => {
  await renderApp('/', { session: 'u-08' })
  const row = await screen.findByRole('region', { name: 'Amigos' })
  expect(await within(row).findByText('Agrega amigos para escribirles más rápido')).toBeInTheDocument()
})

it('un error inesperado al abrir el chat se muestra en la publicación', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Todo' }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(15))
  const post = screen.getAllByRole('article').find((a) => within(a).queryByText('Valeria Ríos'))!
  setUsers(getUsers().filter((u) => u.id !== 'u-01'))
  await user.click(within(post).getByRole('button', { name: 'Enviar mensaje' }))
  expect(await within(post).findByRole('alert')).toHaveTextContent('No pudimos abrir la conversación. Intenta de nuevo.')
})


it('muestra precio y zona en los alquileres', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Ofrezco cuarto' }))
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(4))
  expect(screen.getByText('Moncloa')).toBeInTheDocument()
})

it('el rango de precio filtra alquileres', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Ofrezco cuarto' }))
  fireEvent.change(await screen.findByLabelText('Precio desde'), { target: { value: '550' } })
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2)) // Chamberí (600) y Gràcia (520–560)
  expect(screen.queryByText(/Moncloa, a 10 minutos/)).toBeNull()
  expect(screen.getByText(/Desde 550/)).toBeInTheDocument()
})
