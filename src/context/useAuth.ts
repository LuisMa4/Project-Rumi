import { createContext, useContext } from 'react'
import type { PublicUser, RegisterInput } from '../types'

export interface AuthValue {
  user: PublicUser | null
  loading: boolean
  login(identificador: string, password: string): Promise<void>
  loginDemo(): Promise<void>
  register(input: RegisterInput): Promise<void>
  logout(): Promise<void>
  refreshUser(): Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return value
}
