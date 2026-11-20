import { cleanup, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { getOnboarding } from '../../services/onboardingService'
import { DEMO_USER_ID } from '../../services/seed'
import { renderApp } from '../../test/renderApp'

vi.mock('../../services/aiService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/aiService')>()),
  isConfigured: () => true,
}))

const PASOS = ['Filtros', 'Buscar', 'Publicar', 'Mensajes', 'Perfil', 'Tu asistente']

it('la primera vez recorre las secciones y termina abriendo el asistente', async () => {
  const { user } = await renderApp('/', { session: 'demo', onboarding: true })
  const tutorial = await screen.findByRole('dialog', { name: 'Tutorial' })
  for (const [i, paso] of PASOS.entries()) {
    expect(within(tutorial).getByRole('heading', { name: paso })).toBeInTheDocument()
    expect(within(tutorial).getByText(`${i + 1} de ${PASOS.length}`)).toBeInTheDocument()
    await user.click(within(tutorial).getByRole('button', { name: i === PASOS.length - 1 ? 'Terminar' : 'Siguiente' }))
  }
  expect(screen.queryByRole('dialog', { name: 'Tutorial' })).toBeNull()
  const panel = await screen.findByRole('dialog', { name: 'Asistente Rumi' })
  expect(within(panel).getByText('¿En qué te ayudo?')).toBeInTheDocument()
  expect(getOnboarding(DEMO_USER_ID).tutorial).toBe(true)
})

it('Saltar lo cierra y no vuelve a aparecer', async () => {
  const { user } = await renderApp('/', { session: 'demo', onboarding: true })
  await user.click(within(await screen.findByRole('dialog', { name: 'Tutorial' })).getByRole('button', { name: 'Saltar' }))
  expect(screen.queryByRole('dialog', { name: 'Tutorial' })).toBeNull()
  expect(getOnboarding(DEMO_USER_ID).tutorial).toBe(true)
  expect(screen.queryByRole('dialog', { name: 'Asistente Rumi' })).toBeNull()
})

it('Esc equivale a Saltar', async () => {
  const { user } = await renderApp('/', { session: 'demo', onboarding: true })
  await screen.findByRole('dialog', { name: 'Tutorial' })
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Tutorial' })).toBeNull()
  expect(getOnboarding(DEMO_USER_ID).tutorial).toBe(true)
})

it('el foco va a la burbuja del tutorial', async () => {
  await renderApp('/', { session: 'demo', onboarding: true })
  const tutorial = await screen.findByRole('dialog', { name: 'Tutorial' })
  expect(within(tutorial).getByRole('button', { name: 'Siguiente' })).toHaveFocus()
})

it('no aparece si ya se vio, ni fuera del inicio', async () => {
  await renderApp('/', { session: 'demo' })
  await screen.findByRole('heading', { name: 'Inicio' })
  expect(screen.queryByRole('dialog', { name: 'Tutorial' })).toBeNull()
  cleanup()
  await renderApp('/buscar', { session: 'demo', onboarding: true })
  await screen.findByRole('heading', { name: 'Buscar' })
  expect(screen.queryByRole('dialog', { name: 'Tutorial' })).toBeNull()
})

it('se puede repetir desde el perfil', async () => {
  const { user } = await renderApp('/perfil', { session: 'demo' })
  await user.click(await screen.findByRole('link', { name: 'Ver tutorial' }))
  expect(await screen.findByRole('dialog', { name: 'Tutorial' })).toBeInTheDocument()
})
