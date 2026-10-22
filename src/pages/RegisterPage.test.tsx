import { screen, waitFor } from '@testing-library/react'
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

it('lleva el foco al primer campo con error', async () => {
  const { user } = await renderApp('/registro')
  await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }))
  await waitFor(() => expect(screen.getByLabelText('Nombre completo')).toHaveFocus())
})

it('registra con los 5 campos y entra', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Nombre completo'), 'Ana Pérez')
  await user.type(screen.getByLabelText('Nombre de usuario'), 'ana.perez')
  await user.type(screen.getByLabelText('Correo'), 'ana@mail.com')
  await user.type(screen.getByLabelText('Contraseña'), 'clave-segura-1')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'clave-segura-1')
  expect(screen.queryByLabelText('Ciudad destino')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(await getCurrentUser()).toMatchObject({ nombre: 'Ana Pérez', usuario: 'ana.perez' })
})

it('muestra "Las contraseñas no coinciden"', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Contraseña'), 'clave-segura-1')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'clave-distinta-1')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByLabelText('Confirmar contraseña')).toHaveAccessibleDescription(MSG.confirmar)
})
