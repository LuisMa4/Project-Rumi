import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../services/seed'
import { renderApp } from '../test/renderApp'

it('muestra error con credenciales malas', async () => {
  const { user } = await renderApp('/login')
  await user.type(await screen.findByLabelText('Usuario o correo'), DEMO_EMAIL)
  await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Usuario, correo o contraseña incorrectos')
})

it('entra con credenciales correctas', async () => {
  const { user } = await renderApp('/login')
  await user.type(await screen.findByLabelText('Usuario o correo'), DEMO_EMAIL)
  await user.type(screen.getByLabelText('Contraseña'), DEMO_PASSWORD)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
})

it('entra con la cuenta demo', async () => {
  const { user } = await renderApp('/login')
  await user.click(await screen.findByRole('button', { name: 'Entrar con cuenta demo' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
})

it('lleva al registro', async () => {
  const { user } = await renderApp('/login')
  await user.click(await screen.findByRole('link', { name: 'Crea tu cuenta' }))
  expect(await screen.findByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument()
})

it('entra escribiendo el usuario', async () => {
  const { user } = await renderApp('/login')
  await user.type(await screen.findByLabelText('Usuario o correo'), 'alex.romero')
  await user.type(screen.getByLabelText('Contraseña'), DEMO_PASSWORD)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
})
