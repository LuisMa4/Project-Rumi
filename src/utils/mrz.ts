import type { PublicUser } from '../types'
import { countryCode } from './countries'

const LARGO = 44

/** Mayúsculas sin tildes; todo lo que no sea letra o número pasa a '<'. */
function limpiar(s: string, permitidos = /[^A-Z0-9]/g): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(permitidos, '<')
}

const rellenar = (s: string) => s.slice(0, LARGO).padEnd(LARGO, '<')

/**
 * Las dos líneas "de lectura mecánica" del pasaporte Rumi. Son decorativas.
 * Línea 1: P<RUMI + apellidos << nombre. Línea 2: usuario, país de origen y fecha de llegada.
 */
export function mrz(user: PublicUser): [string, string] {
  const [nombre = '', ...apellidos] = user.nombre.trim().split(/\s+/)
  const linea1 = `P<RUMI${limpiar(apellidos.join(' '))}<<${limpiar(nombre)}`

  const pais = user.paisOrigen ? countryCode(user.paisOrigen) : undefined
  const llegada = user.fechaLlegada ? user.fechaLlegada.slice(2).replaceAll('-', '') : '<<<<<<'
  const usuario = limpiar(user.usuario, /[^A-Z0-9.]/g).slice(0, 20).padEnd(20, '<')
  const linea2 = `${usuario}${pais ? `${pais}<` : 'XXX'}${llegada}`

  return [rellenar(linea1), rellenar(linea2)]
}
