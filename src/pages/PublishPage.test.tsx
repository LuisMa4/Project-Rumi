import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { PHOTO_BUDGET_BYTES } from '../services/photoBudget'
import { MSG } from '../services/validation'
import { renderApp } from '../test/renderApp'

const compress = vi.hoisted(() => vi.fn())
vi.mock('../utils/image', () => ({ compressImage: compress }))
vi.mock('../components/map/LeafletMap', () => ({
  default: ({ onPick }: { onPick?: (p: { lat: number; lng: number }) => void }) => (
    <div data-testid="leaflet">
      <button type="button" onClick={() => onPick?.({ lat: 1, lng: 2 })}>
        Elegir punto de prueba
      </button>
    </div>
  ),
}))

beforeEach(() => {
  compress.mockReset()
  compress.mockResolvedValue('data:image/jpeg;base64,AA')
})

const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' })

it('el + de la navegación abre /publicar', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  const nav = await screen.findByRole('navigation', { name: 'Principal' })
  await user.click(within(nav).getByRole('link', { name: 'Publicar' }))
  expect(await screen.findByRole('heading', { name: 'Nueva publicación' })).toBeInTheDocument()
})

it('cada tipo muestra su descripción y sus campos', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Lugar recomendado' }))
  expect(screen.getByText(/Recomienda un sitio que valga la pena/)).toBeInTheDocument()
  expect(screen.getByLabelText('Nombre del lugar')).toBeInTheDocument()
  expect(screen.getByLabelText('¿Por qué lo recomiendas?')).toBeInTheDocument()
  expect(screen.queryByLabelText('Hasta')).toBeNull()
  expect(screen.queryByLabelText('Precio desde')).toBeNull()
  await user.click(screen.getByRole('radio', { name: 'Busco roomie' }))
  expect(screen.getByLabelText('¿A cuántas personas buscas?')).toHaveValue(1)
  expect(screen.getByLabelText('Llego')).toBeInTheDocument()
  expect(screen.getByLabelText('Presupuesto desde')).toBeInTheDocument()
  await user.click(screen.getByRole('radio', { name: 'Viaje' }))
  expect(screen.getByLabelText('Destino')).toBeInTheDocument()
  expect(screen.queryByLabelText('¿A cuántas personas buscas?')).toBeNull()
})

it('hashtags automáticos, sugeridos y escritos; quitar uno', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Ofrezco cuarto' }))
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  expect(screen.getByRole('button', { name: 'Quitar #OfrezcoCuarto' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Quitar #Madrid' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '+ Amoblado' }))
  await user.type(screen.getByLabelText('Agregar hashtag'), '#CercaDeLaUPC{Enter}')
  await user.type(screen.getByLabelText('Agregar hashtag'), 'cercadelaupc{Enter}')
  expect(screen.getAllByRole('button', { name: /^Quitar #/ })).toHaveLength(4)
  await user.click(screen.getByRole('button', { name: 'Quitar #Madrid' }))
  expect(screen.queryByRole('button', { name: 'Quitar #Madrid' })).toBeNull()
  await user.type(screen.getByLabelText('Agregar hashtag'), 'a{Enter}')
  expect(screen.getByLabelText('Agregar hashtag')).toHaveAccessibleDescription(MSG.hashtag)
})

it('publica con opciones avanzadas y vuelve al inicio con la publicación arriba', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Ofrezco cuarto' }))
  await user.type(screen.getByLabelText('Descripción'), 'Cuarto con balcón en Lavapiés')
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  await user.click(screen.getByRole('button', { name: 'Opciones avanzadas' }))
  await user.type(screen.getByLabelText('Enlace del anuncio'), 'https://airbnb.com/rooms/1')
  await user.upload(screen.getByLabelText('Agregar fotos'), foto())
  expect(await screen.findByRole('button', { name: 'Quitar foto 1' })).toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Elegir punto de prueba' }))
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  await waitFor(() => expect(screen.getAllByRole('article')[0]).toHaveTextContent('Cuarto con balcón en Lavapiés'))
})

it('si las fotos no entran, avisa y conserva lo escrito', async () => {
  compress.mockResolvedValue('data:' + 'a'.repeat(PHOTO_BUDGET_BYTES))
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Viaje' }))
  await user.type(screen.getByLabelText('Descripción'), 'Escapada a Sintra')
  await user.type(screen.getByLabelText('Destino'), 'Sintra')
  await user.click(screen.getByRole('button', { name: 'Opciones avanzadas' }))
  await user.upload(screen.getByLabelText('Agregar fotos'), foto())
  await screen.findByRole('button', { name: 'Quitar foto 1' })
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(MSG.espacioFotos)
  expect(screen.getByLabelText('Descripción')).toHaveValue('Escapada a Sintra')
})

it('valida precio desde mayor que hasta y el enlace', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Ofrezco cuarto' }))
  await user.type(screen.getByLabelText('Descripción'), 'Cuarto')
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  await user.type(screen.getByLabelText('Precio desde'), '600')
  await user.type(screen.getByLabelText('Precio hasta'), '500')
  await user.click(screen.getByRole('button', { name: 'Opciones avanzadas' }))
  await user.type(screen.getByLabelText('Enlace del anuncio'), 'airbnb.com')
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(await screen.findByLabelText('Precio desde')).toHaveAccessibleDescription(MSG.precioRango)
  expect(screen.getByLabelText('Enlace del anuncio')).toHaveAccessibleDescription(MSG.enlace)
})

it('valida publicación vacía y lleva el foco al primer error', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Publicar' }))
  expect(await screen.findByLabelText('Descripción')).toHaveAccessibleDescription(MSG.postVacio)
  await waitFor(() => expect(screen.getByLabelText('Descripción')).toHaveFocus())
})

it('el aviso general queda junto al botón de publicar', async () => {
  compress.mockResolvedValue('data:' + 'a'.repeat(PHOTO_BUDGET_BYTES))
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Viaje' }))
  await user.type(screen.getByLabelText('Descripción'), 'Escapada')
  await user.type(screen.getByLabelText('Destino'), 'Sintra')
  await user.click(screen.getByRole('button', { name: 'Opciones avanzadas' }))
  await user.upload(screen.getByLabelText('Agregar fotos'), foto())
  await screen.findByRole('button', { name: 'Quitar foto 1' })
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  const alerta = await screen.findByRole('alert')
  expect(alerta.nextElementSibling).toContainElement(screen.getByRole('button', { name: 'Publicar' }))
})

it('si falta el tipo de lugar, el foco va a ese grupo', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Lugar recomendado' }))
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(screen.getByRole('radiogroup', { name: '¿Qué tipo de lugar?' })).toHaveFocus())
})
