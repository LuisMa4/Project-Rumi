import { render } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../context/AuthContext'
import { loginDemo } from '../services/authService'
import { setSession } from '../services/db'
import { markSeen } from '../services/onboardingService'
import { DEMO_USER_ID, resetDemo } from '../services/seed'

/**
 * Monta la app completa en `route`, con los datos de demo recién cargados.
 * `session`: 'demo' entra con la cuenta demo; cualquier otro valor es el id del usuario con sesión.
 * `onboarding`: true deja pendientes la bienvenida y el tutorial; por defecto se marcan como vistos
 * para que no tapen la pantalla en las pruebas.
 */
export async function renderApp(
  route: string,
  opts: { session?: string | null; onboarding?: boolean } = {},
): Promise<{ user: UserEvent }> {
  await resetDemo()
  if (opts.session === 'demo') await loginDemo()
  else if (opts.session) setSession(opts.session)
  const sessionId = opts.session === 'demo' ? DEMO_USER_ID : opts.session
  if (sessionId && !opts.onboarding) {
    markSeen(sessionId, 'bienvenida')
    markSeen(sessionId, 'tutorial')
  }
  const user = userEvent.setup()
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  )
  return { user }
}
