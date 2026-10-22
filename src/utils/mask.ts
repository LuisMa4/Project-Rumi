// Datos de verificación enmascarados: nunca guardamos el documento, el celular
// ni el correo completos.

export const lastChars = (s: string, n: number): string => s.slice(-n)

/** '+51', '987654321' → '+51 ••• ••• 321' */
export function maskPhone(codigoPais: string, numero: string): string {
  return `${codigoPais} ••• ••• ${lastChars(numero, 3)}`
}

/** 'ana.perez@ulima.edu.pe' → 'a•••@ulima.edu.pe' */
export function maskEmail(correo: string): string {
  const [usuario, dominio] = correo.trim().toLowerCase().split('@')
  return `${usuario.slice(0, 1)}•••@${dominio}`
}
