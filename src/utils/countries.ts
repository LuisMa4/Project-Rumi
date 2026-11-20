/** Países con su código ISO 3166-1 alfa-2 (para la bandera) y su nombre en español. */
export const COUNTRIES: { code: string; nombre: string }[] = [
  { code: 'AR', nombre: 'Argentina' },
  { code: 'BO', nombre: 'Bolivia' },
  { code: 'BR', nombre: 'Brasil' },
  { code: 'CL', nombre: 'Chile' },
  { code: 'CO', nombre: 'Colombia' },
  { code: 'CR', nombre: 'Costa Rica' },
  { code: 'CU', nombre: 'Cuba' },
  { code: 'EC', nombre: 'Ecuador' },
  { code: 'SV', nombre: 'El Salvador' },
  { code: 'GT', nombre: 'Guatemala' },
  { code: 'HN', nombre: 'Honduras' },
  { code: 'MX', nombre: 'México' },
  { code: 'NI', nombre: 'Nicaragua' },
  { code: 'PA', nombre: 'Panamá' },
  { code: 'PY', nombre: 'Paraguay' },
  { code: 'PE', nombre: 'Perú' },
  { code: 'PR', nombre: 'Puerto Rico' },
  { code: 'DO', nombre: 'República Dominicana' },
  { code: 'UY', nombre: 'Uruguay' },
  { code: 'VE', nombre: 'Venezuela' },
  { code: 'US', nombre: 'Estados Unidos' },
  { code: 'CA', nombre: 'Canadá' },
  { code: 'ES', nombre: 'España' },
  { code: 'PT', nombre: 'Portugal' },
  { code: 'FR', nombre: 'Francia' },
  { code: 'IT', nombre: 'Italia' },
  { code: 'DE', nombre: 'Alemania' },
  { code: 'GB', nombre: 'Reino Unido' },
  { code: 'IE', nombre: 'Irlanda' },
  { code: 'NL', nombre: 'Países Bajos' },
  { code: 'BE', nombre: 'Bélgica' },
  { code: 'CH', nombre: 'Suiza' },
  { code: 'AT', nombre: 'Austria' },
  { code: 'SE', nombre: 'Suecia' },
  { code: 'NO', nombre: 'Noruega' },
  { code: 'DK', nombre: 'Dinamarca' },
  { code: 'FI', nombre: 'Finlandia' },
  { code: 'PL', nombre: 'Polonia' },
  { code: 'CZ', nombre: 'Chequia' },
  { code: 'GR', nombre: 'Grecia' },
  { code: 'JP', nombre: 'Japón' },
  { code: 'KR', nombre: 'Corea del Sur' },
  { code: 'CN', nombre: 'China' },
  { code: 'AU', nombre: 'Australia' },
]

const clave = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

const POR_NOMBRE = new Map(COUNTRIES.map((c) => [clave(c.nombre), c.code]))

/** 'perú', ' Peru ' → 'PE'. Si no es un país conocido, undefined. */
export function countryCode(nombre: string): string | undefined {
  return POR_NOMBRE.get(clave(nombre))
}
