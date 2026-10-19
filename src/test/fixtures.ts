import type { RegisterInput } from '../types'

/** Datos de registro válidos para pruebas. */
export function nuevo(): RegisterInput {
  return {
    nombre: 'Ana Pérez',
    email: 'ana@mail.com',
    universidad: 'Universidad de Lima',
    paisOrigen: 'Perú',
    ciudadDestino: 'Lisboa',
    paisDestino: 'Portugal',
    fechaLlegada: '2027-02-01',
    fechaSalida: '2027-07-01',
    password: 'clave-segura-1',
  }
}
