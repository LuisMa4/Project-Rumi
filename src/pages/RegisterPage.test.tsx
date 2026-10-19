import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { getCurrentUser } from '../services/authService'
import { MSG } from '../services/validation'
import { renderApp } from '../test/renderApp'

it('muestra errores por campo', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Contraseña'), 'corta')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByLabelText('Nombre completo')).toHaveAccessibleDescription(MSG.requerido)
  expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(MSG.password)
})

it('registra y entra', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Nombre completo'), 'Ana Pérez')
  await user.type(screen.getByLabelText('Correo'), 'ana@mail.com')
  await user.type(screen.getByLabelText('Universidad'), 'Universidad de Lima')
  await user.type(screen.getByLabelText('País de origen'), 'Perú')
  await user.type(screen.getByLabelText('Ciudad destino'), 'Lisboa')
  await user.type(screen.getByLabelText('País destino'), 'Portugal')
  await user.type(screen.getByLabelText('Fecha de llegada'), '2027-02-01')
  await user.type(screen.getByLabelText('Fecha de salida'), '2027-07-01')
  await user.type(screen.getByLabelText('Contraseña'), 'clave-segura-1')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect((await getCurrentUser())?.nombre).toBe('Ana Pérez')
})
