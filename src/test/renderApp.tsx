import { render } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../App'
import { AuthProvider } from '../context/AuthContext'
import { loginDemo } from '../services/authService'
import { setSession } from '../services/db'
import { resetDemo } from '../services/seed'

/**
 * Monta la app completa en `route`, con los datos de demo recién cargados.
 * `session`: 'demo' entra con la cuenta demo; cualquier otro valor es el id del usuario con sesión.
 */
export async function renderApp(
  route: string,
  opts: { session?: string | null } = {},
): Promise<{ user: UserEvent }> {
  await resetDemo()
  if (opts.session === 'demo') await loginDemo()
  else if (opts.session) setSession(opts.session)
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
