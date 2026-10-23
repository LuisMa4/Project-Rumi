import { screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MSG } from '../services/validation'
import { renderApp } from '../test/renderApp'

vi.mock('../utils/image', () => ({ compressImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,DNI') }))

const codigoEnPantalla = () => screen.getByRole('status').textContent!.match(/Tu código es (\d{6})/)![1]

it('para Alex empieza en Universidad y la verifica con el código mostrado', async () => {
  const { user } = await renderApp('/verificar', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Verifica tu cuenta' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Universidad' })).toBeInTheDocument()
  await user.type(screen.getByLabelText('Universidad'), 'Universidad de Lima')
  await user.type(screen.getByLabelText('Correo institucional'), 'alex@aloe.ulima.edu.pe')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  const code = codigoEnPantalla()
  await user.type(screen.getByLabelText('Código de 6 dígitos'), code === '000000' ? '111111' : '000000')
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(screen.getByLabelText('Código de 6 dígitos')).toHaveAccessibleDescription(MSG.codigo)
  await user.clear(screen.getByLabelText('Código de 6 dígitos'))
  await user.type(screen.getByLabelText('Código de 6 dígitos'), code)
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByRole('heading', { name: 'Listo' })).toBeInTheDocument()
  expect(localStorage.getItem('rumi:users')).not.toContain(code)
  expect(screen.getByRole('link', { name: 'Volver a mi perfil' })).toHaveAttribute('href', '/perfil')
})

it('rechaza el correo personal antes de enviar el código', async () => {
  const { user } = await renderApp('/verificar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Universidad'), 'Universidad de Lima')
  await user.type(screen.getByLabelText('Correo institucional'), 'alex@gmail.com')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  expect(screen.getByLabelText('Correo institucional')).toHaveAccessibleDescription(MSG.correoPersonal)
  expect(screen.queryByText(/Tu código es/)).toBeNull()
})

it('se pueden omitir los tres pasos', async () => {
  const { user } = await renderApp('/verificar', { session: 'u-08' })
  expect(await screen.findByRole('heading', { name: 'DNI' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Omitir este paso' }))
  expect(await screen.findByRole('heading', { name: 'Celular' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Omitir este paso' }))
  await user.click(await screen.findByRole('button', { name: 'Omitir este paso' }))
  expect(await screen.findByRole('heading', { name: 'Listo' })).toBeInTheDocument()
  expect(screen.getByText('Todavía no verificaste nada. Puedes volver cuando quieras.')).toBeInTheDocument()
})

it('DNI exige la foto y no la guarda', async () => {
  const { user } = await renderApp('/verificar', { session: 'u-08' })
  await user.type(await screen.findByLabelText('Número de DNI o pasaporte'), '45678912')
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByText(MSG.fotoDocumento)).toBeInTheDocument()
  await user.upload(
    screen.getByLabelText('Foto del documento (frente)'),
    new File(['x'], 'dni.jpg', { type: 'image/jpeg' }),
  )
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByRole('heading', { name: 'Celular' })).toBeInTheDocument()
  const users = localStorage.getItem('rumi:users')!
  expect(users).not.toContain('data:image')
  expect(users).not.toContain('45678912')
})

it('verifica el celular con el código', async () => {
  const { user } = await renderApp('/verificar', { session: 'u-08' })
  await user.click(await screen.findByRole('button', { name: 'Omitir este paso' }))
  await user.type(await screen.findByLabelText('Número de celular'), '987654321')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  await user.type(screen.getByLabelText('Código de 6 dígitos'), codigoEnPantalla())
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByRole('heading', { name: 'Universidad' })).toBeInTheDocument()
})

it('sin espacio en el DNI avisa y no deja la pantalla trabada', async () => {
  const { user } = await renderApp('/verificar', { session: 'u-08' })
  await user.type(await screen.findByLabelText('Número de DNI o pasaporte'), '45678912')
  await user.upload(
    screen.getByLabelText('Foto del documento (frente)'),
    new File(['x'], 'dni.jpg', { type: 'image/jpeg' }),
  )
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(MSG.espacioGeneral)
  expect(screen.getByRole('button', { name: 'Omitir este paso' })).toBeEnabled()
  vi.restoreAllMocks()
})
