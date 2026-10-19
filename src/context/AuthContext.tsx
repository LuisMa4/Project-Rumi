import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authService from '../services/authService'
import type { PublicUser, RegisterInput } from '../types'
import { AuthContext, type AuthValue } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    authService
      .getCurrentUser()
      .catch(() => null) // Datos ilegibles: se entra como sin sesión.
      .then((current) => {
        if (cancelled) return
        setUser(current)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await authService.getCurrentUser())
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      refreshUser,
      login: async (email: string, password: string) => setUser(await authService.login(email, password)),
      loginDemo: async () => setUser(await authService.loginDemo()),
      register: async (input: RegisterInput) => setUser(await authService.register(input)),
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
    }),
    [user, loading, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
