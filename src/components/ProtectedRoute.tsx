import { getOnboarding } from '../services/onboardingService'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** Sin sesión, manda a /login. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

/** Con sesión, /login y /registro mandan al inicio. */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Outlet />
  // Recién creada la cuenta (o quien nunca la vio): primero la bienvenida.
  return <Navigate to={getOnboarding(user.id).bienvenida ? '/' : '/bienvenida'} replace />
}
