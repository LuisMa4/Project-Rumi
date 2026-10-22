import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { loginDemo, register } from '../services/authService'
import { resetDemo } from '../services/seed'
import { getById } from '../services/usersService'
import type { Post, PostWithAuthor } from '../types'
import { nuevo } from '../test/fixtures'
import { PostCard } from './PostCard'

vi.mock('./map/LeafletMap', () => ({ default: () => <div data-testid="leaflet" /> }))

beforeEach(async () => {
  await resetDemo()
  await loginDemo()
})

async function post(over: Partial<Post>, autorId = 'u-02'): Promise<PostWithAuthor> {
  return {
    id: 'p-x',
    autorId,
    tipo: 'viaje',
    texto: 'Corto',
    ciudad: 'Madrid',
    hashtags: ['Viaje'],
    fotos: [],
    creadoEn: new Date().toISOString(),
    ...over,
    autor: await getById(autorId),
  }
}

function show(p: PostWithAuthor) {
  render(
    <AuthProvider>
      <MemoryRouter>
        <PostCard post={p} currentUserId="u-demo" />
      </MemoryRouter>
    </AuthProvider>,
  )
}

it('plegada muestra fotos, precio y hashtags; Ver más muestra fechas, enlace y mapa', async () => {
  show(
    await post({
      tipo: 'ofrezco-cuarto',
      fotos: ['data:image/jpeg;base64,AA', 'data:image/jpeg;base64,BB'],
      precioMin: 450,
      precioMax: 500,
      moneda: 'EUR',
      fechaDesde: '2027-02-01',
      enlace: 'https://www.airbnb.com/rooms/1',
      ubicacion: { lat: 40.435, lng: -3.719 },
      hashtags: ['OfrezcoCuarto', 'Moncloa'],
    }),
  )
  expect(screen.getByRole('button', { name: 'Ver foto 1 de 2' })).toBeInTheDocument()
  expect(screen.getByText(/450–500/)).toBeInTheDocument()
  expect(screen.getByText('#Moncloa')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Ver anuncio en airbnb.com' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Ver más' }))
  expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Ver anuncio en airbnb.com' })).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText('desde feb 2027')).toBeInTheDocument()
  expect(await screen.findByTestId('leaflet')).toBeInTheDocument()
})

it('sin nada extra no hay Ver más', async () => {
  show(await post({}))
  expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull()
})

it('busco roomie muestra cuántas personas; lugar muestra nombre y categoría', async () => {
  show(await post({ tipo: 'busco-roomie', personas: 2 }))
  expect(screen.getByText('Busca 2 roomies')).toBeInTheDocument()
  show(await post({ id: 'p-y', tipo: 'lugar', categoria: 'cafe', nombreLugar: 'Café Comercial' }))
  expect(screen.getByText('Café Comercial · Café')).toBeInTheDocument()
})

it('autor sin destino muestra @usuario', async () => {
  const ana = await register(nuevo())
  await loginDemo()
  show(await post({}, ana.id))
  expect(screen.getByText('@ana.perez')).toBeInTheDocument()
})

it('el visor de fotos navega y cierra con Escape', async () => {
  show(await post({ fotos: ['data:image/jpeg;base64,AA', 'data:image/jpeg;base64,BB'] }))
  await userEvent.click(screen.getByRole('button', { name: 'Ver foto 1 de 2' }))
  const dialog = screen.getByRole('dialog', { name: 'Fotos' })
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'data:image/jpeg;base64,AA')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Foto siguiente' }))
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', 'data:image/jpeg;base64,BB')
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('no ofrece mensaje en publicaciones propias', async () => {
  show(await post({}, 'u-demo'))
  expect(screen.queryByRole('button', { name: 'Enviar mensaje' })).toBeNull()
})
