// Qué partes de la bienvenida vio cada persona en este navegador.
import { read, write } from './storage'

export type OnboardingPaso = 'bienvenida' | 'tutorial'
export type Onboarding = Record<OnboardingPaso, boolean>

type Guardado = Record<string, Partial<Onboarding>>

function leer(): Guardado {
  const value = read<unknown>('onboarding', {})
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Guardado) : {}
}

export function getOnboarding(userId: string): Onboarding {
  const del = leer()[userId] ?? {}
  return { bienvenida: del.bienvenida === true, tutorial: del.tutorial === true }
}

function set(userId: string, paso: OnboardingPaso, visto: boolean): void {
  const todo = leer()
  write('onboarding', { ...todo, [userId]: { ...todo[userId], [paso]: visto } })
}

export const markSeen = (userId: string, paso: OnboardingPaso): void => set(userId, paso, true)
export const resetSeen = (userId: string, paso: OnboardingPaso): void => set(userId, paso, false)
