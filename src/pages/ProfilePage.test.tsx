import { cleanup, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { getUsers, setUsers } from '../services/db'
import { create } from '../services/postsService'
import { MSG } from '../services/validation'
import { PHOTO_BUDGET_BYTES } from '../services/photoBudget'
import { renderApp } from '../test/renderApp'

const compress = vi.hoisted(() => vi.fn())
vi.mock('../utils/image', () => ({ compressImage: compress }))

const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' })

it('edita la biografía e instagram', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Alex Romero' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Biografía'))
  await user.type(screen.getByLabelText('Biografía'), 'Me gusta cocinar')
  await user.type(screen.getByLabelText('Instagram'), '@alex')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByText('Me gusta cocinar')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '@alex' })).toHaveAttribute('href', 'https://instagram.com/alex')
})

it('codifica el usuario de Instagram en el enlace', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.type(screen.getByLabelText('Instagram'), '@alex?ref=1')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByRole('link', { name: '@alex?ref=1' })).toHaveAttribute(
    'href',
    'https://instagram.com/alex%3Fref%3D1',
  )
})

it('muestra intereses repetidos sin claves de React duplicadas', async () => {
  const consoleError = vi.spyOn(console, 'error')
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Intereses'))
  await user.type(screen.getByLabelText('Intereses'), 'Cocina, Cocina')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  const tags = await screen.findByRole('list', { name: 'Intereses' })
  expect(within(tags).getAllByRole('listitem')).toHaveLength(2)
  expect(consoleError.mock.calls.flat().join(' ')).not.toContain('same key')
  consoleError.mockRestore()
})

it('muestra error de biografía larga', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Biografía'))
  await user.click(screen.getByLabelText('Biografía'))
  await user.paste('a'.repeat(301))
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  expect(await screen.findByLabelText('Biografía')).toHaveAccessibleDescription(MSG.bio)
  await waitFor(() => expect(screen.getByLabelText('Biografía')).toHaveFocus())
})


it('un error inesperado al guardar se muestra y deja reintentar', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  setUsers([])
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  const form = screen.getByRole('form', { name: 'Editar perfil' })
  expect(await within(form).findByRole('alert')).toHaveTextContent('No pudimos guardar los cambios. Intenta de nuevo.')
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
})

it('un error inesperado al abrir el chat desde un perfil se muestra', async () => {
  const { user } = await renderApp('/perfil/u-01', { session: 'demo' })
  await screen.findByRole('button', { name: 'Enviar mensaje' })
  expect(screen.queryByRole('alert')).toBeNull()
  setUsers(getUsers().filter((u) => u.id !== 'u-01'))
  await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos abrir la conversación. Intenta de nuevo.')
})

it('cancelar descarta los cambios', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Editar perfil' }))
  await user.clear(screen.getByLabelText('Nombre completo'))
  await user.type(screen.getByLabelText('Nombre completo'), 'Otra Persona')
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(await screen.findByRole('heading', { name: 'Alex Romero' })).toBeInTheDocument()
})

it('perfil ajeno, propio por id y no encontrado', async () => {
  await renderApp('/perfil/u-01', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Valeria Ríos' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Editar perfil' })).toBeNull()

  cleanup()
  await renderApp('/perfil/u-demo', { session: 'demo' })
  expect(await screen.findByRole('button', { name: 'Editar perfil' })).toBeInTheDocument()

  cleanup()
  await renderApp('/perfil/nope', { session: 'demo' })
  expect(await screen.findByText('No encontramos este perfil o conversación')).toBeInTheDocument()
})

it('cierra sesión', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
  expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
})

it('restablece la demo', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const { user } = await renderApp('/perfil', { session: 'demo' }) // renderApp ya llama a resetDemo
  await create('u-demo', { tipo: 'viaje', texto: 'temporal', ciudad: 'X' })
  await user.click(await screen.findByRole('button', { name: 'Restablecer datos de demo' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(await screen.findAllByRole('article')).toHaveLength(12)
})

it('sube foto de perfil y portada', async () => {
  compress.mockResolvedValue('data:image/jpeg;base64,AA')
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.upload(await screen.findByLabelText('Cambiar foto de perfil'), foto())
  await waitFor(() => expect(document.querySelector('img[src="data:image/jpeg;base64,AA"]')).not.toBeNull())
  compress.mockResolvedValue('data:image/jpeg;base64,BB')
  await user.upload(screen.getByLabelText('Cambiar portada'), foto())
  await waitFor(() => expect(document.querySelector('img[src="data:image/jpeg;base64,BB"]')).not.toBeNull())
})

it('si la foto no entra en el presupuesto, avisa', async () => {
  compress.mockResolvedValue('data:' + 'a'.repeat(PHOTO_BUDGET_BYTES + 10))
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.upload(await screen.findByLabelText('Cambiar portada'), foto())
  expect(await screen.findByRole('alert')).toHaveTextContent(MSG.espacioFotos)
})

it('insignias, usuario y botón de verificación; sin presupuesto', async () => {
  await renderApp('/perfil', { session: 'demo' })
  expect(await screen.findByText('@alex.romero')).toBeInTheDocument()
  expect(screen.getByText('✓ DNI')).toBeInTheDocument()
  expect(screen.getByText('✓ Celular')).toBeInTheDocument()
  expect(screen.getByText('Sin verificar: Universidad')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Verificar cuenta (2 de 3)' })).toHaveAttribute('href', '/verificar')
  expect(screen.queryByText(/Presupuesto/)).toBeNull()
})

it('en tu perfil, las insignias muestran tus datos enmascarados', async () => {
  await renderApp('/perfil', { session: 'u-01' })
  const insignias = await screen.findByRole('list', { name: 'Verificación' })
  expect(insignias).toHaveTextContent('✓ DNI •••731')
  expect(insignias).toHaveTextContent('✓ Celular +51 ••• ••• 908')
  expect(insignias).toHaveTextContent('✓ Universidad v•••@pucp.edu.pe')
})

it('en el perfil de otro no se ven sus datos enmascarados', async () => {
  await renderApp('/perfil/u-01', { session: 'demo' })
  const insignias = await screen.findByRole('list', { name: 'Verificación' })
  expect(within(insignias).getAllByRole('listitem')).toHaveLength(3)
  expect(insignias).not.toHaveTextContent('•••')
})

it('sin publicaciones, tu perfil lleva a la página para publicar', async () => {
  await renderApp('/perfil', { session: 'demo' })
  expect(await screen.findByText('Todavía no publicaste nada')).toBeInTheDocument()
  expect(screen.queryByText(/desde el inicio/)).toBeNull()
  expect(screen.getByRole('link', { name: 'Crear una publicación' })).toHaveAttribute('href', '/publicar')
})

it('perfil de otro: botón de amistad y solo las insignias verificadas', async () => {
  await renderApp('/perfil/u-07', { session: 'demo' })
  expect(await screen.findByRole('button', { name: 'Agregar amigo' })).toBeInTheDocument()
  expect(screen.getByText('✓ Universidad')).toBeInTheDocument()
  expect(screen.queryByText(/Sin verificar/)).toBeNull()
  expect(screen.queryByRole('link', { name: /Verificar cuenta/ })).toBeNull()
})

it('cuenta nueva sin destino muestra "Agrega tu destino"', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Nombre completo'), 'Ana Pérez')
  await user.type(screen.getByLabelText('Nombre de usuario'), 'ana.perez')
  await user.type(screen.getByLabelText('Correo'), 'ana@mail.com')
  await user.type(screen.getByLabelText('Contraseña'), 'clave-segura-1')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'clave-segura-1')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  await screen.findByRole('heading', { name: 'Inicio' })
  await user.click(screen.getAllByRole('link', { name: 'Perfil' })[0])
  await user.click(await screen.findByRole('button', { name: 'Agrega tu destino' }))
  expect(screen.getByLabelText('Ciudad destino')).toBeInTheDocument()
})
