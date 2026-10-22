// Coordenadas para centrar el mapa al publicar. No buscamos direcciones:
// el pin se pone tocando el mapa.
import type { LatLng } from '../types'
import { normalizeText } from '../utils/text'

export const CITY_COORDS: Record<string, LatLng> = {
  Madrid: { lat: 40.4168, lng: -3.7038 },
  Barcelona: { lat: 41.3874, lng: 2.1686 },
  Lisboa: { lat: 38.7223, lng: -9.1393 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'Ciudad de México': { lat: 19.4326, lng: -99.1332 },
  Santiago: { lat: -33.4489, lng: -70.6693 },
  Montreal: { lat: 45.5019, lng: -73.5674 },
  Lima: { lat: -12.0464, lng: -77.0428 },
}

export const DEFAULT_COORDS: LatLng = CITY_COORDS.Madrid

export function coordsForCity(ciudad: string): LatLng | undefined {
  const key = normalizeText(ciudad)
  const match = Object.keys(CITY_COORDS).find((c) => normalizeText(c) === key)
  return match ? CITY_COORDS[match] : undefined
}
