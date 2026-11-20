import { beforeEach, expect, it } from 'vitest'
import { getOnboarding, markSeen, resetSeen } from './onboardingService'
import { DEMO_USER_ID, resetDemo } from './seed'

beforeEach(async () => {
  await resetDemo()
})

it('una persona nueva no vio nada todavía', () => {
  expect(getOnboarding('u-nuevo')).toEqual({ bienvenida: false, tutorial: false })
})

it('markSeen y resetSeen funcionan por persona y por paso', () => {
  markSeen('u-01', 'bienvenida')
  expect(getOnboarding('u-01')).toEqual({ bienvenida: true, tutorial: false })
  expect(getOnboarding('u-02')).toEqual({ bienvenida: false, tutorial: false })
  markSeen('u-01', 'tutorial')
  resetSeen('u-01', 'bienvenida')
  expect(getOnboarding('u-01')).toEqual({ bienvenida: false, tutorial: true })
})

it('la cuenta demo ya vio la bienvenida pero no el tutorial', () => {
  expect(getOnboarding(DEMO_USER_ID)).toEqual({ bienvenida: true, tutorial: false })
})

it('datos dañados cuentan como no visto', async () => {
  const { write } = await import('./storage')
  write('onboarding', 'basura')
  expect(getOnboarding(DEMO_USER_ID)).toEqual({ bienvenida: false, tutorial: false })
  markSeen(DEMO_USER_ID, 'tutorial')
  expect(getOnboarding(DEMO_USER_ID).tutorial).toBe(true)
})
