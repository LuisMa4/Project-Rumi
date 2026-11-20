import { act, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { getCurrentUser } from '../services/authService'
import { getOnboarding } from '../services/onboardingService'
import { DEMO_USER_ID } from '../services/seed'
import { renderApp } from '../test/renderApp'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function reducirMovimiento(reducir: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: reducir && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

it('después de crear la cuenta muestra la bienvenida', async () => {
  const { user } = await renderApp('/registro')
  await user.type(await screen.findByLabelText('Nombre completo'), 'Ana Pérez')
  await user.type(screen.getByLabelText('Nombre de usuario'), 'ana.perez')
  await user.type(screen.getByLabelText('Correo'), 'ana@mail.com')
  await user.type(screen.getByLabelText('Contraseña'), 'clave-segura-1')
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'clave-segura-1')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
  expect(await getCurrentUser()).toMatchObject({ usuario: 'ana.perez' })
})

it('Siguiente avanza y en la última postal el botón dice Empezar', async () => {
  reducirMovimiento(true)
  const { user } = await renderApp('/bienvenida', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  expect(await screen.findByRole('heading', { name: 'Encuentra roomie' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  await user.click(screen.getByRole('button', { name: 'Siguiente' }))
  expect(await screen.findByRole('heading', { name: 'Tu asistente' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Empezar' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(getOnboarding(DEMO_USER_ID).bienvenida).toBe(true)
})

it('Omitir lleva al inicio y la marca como vista', async () => {
  reducirMovimiento(true)
  const { user } = await renderApp('/bienvenida', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Omitir' }))
  expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  expect(getOnboarding(DEMO_USER_ID).bienvenida).toBe(true)
})

it('cambia de postal sola cada 4 segundos', async () => {
  reducirMovimiento(false)
  // Relojes falsos desde antes de montar, para controlar el temporizador de la postal.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await renderApp('/bienvenida', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
  await act(async () => {
    vi.advanceTimersByTime(4100)
  })
  expect(screen.getByRole('heading', { name: 'Encuentra roomie' })).toBeInTheDocument()
})

it('con movimiento reducido no avanza sola', async () => {
  reducirMovimiento(true)
  // Relojes falsos desde antes de montar, para controlar el temporizador de la postal.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  await renderApp('/bienvenida', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
  await act(async () => {
    vi.advanceTimersByTime(10_000)
  })
  expect(screen.getByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
})

it('el perfil propio puede volver a ver la bienvenida', async () => {
  reducirMovimiento(true)
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('link', { name: 'Ver bienvenida' }))
  expect(await screen.findByRole('heading', { name: 'Bienvenido a Rumi' })).toBeInTheDocument()
})
