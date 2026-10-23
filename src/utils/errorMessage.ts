import { StorageFullError } from '../services/errors'
import { MSG } from '../services/validation'

/** Mensaje para un error inesperado: si fue falta de espacio, lo dice; si no, usa `fallback`. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof StorageFullError) return err.kind === 'fotos' ? MSG.espacioFotos : MSG.espacioGeneral
  return fallback
}
