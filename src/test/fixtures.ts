import type { RegisterInput } from '../types'

/** Datos de registro válidos para pruebas. */
export function nuevo(): RegisterInput {
  return {
    nombre: 'Ana Pérez',
    usuario: 'ana.perez',
    email: 'ana@mail.com',
    password: 'clave-segura-1',
    confirmPassword: 'clave-segura-1',
  }
}
