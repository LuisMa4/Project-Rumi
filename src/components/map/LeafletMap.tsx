// Única pieza que importa Leaflet: se carga de forma diferida (ver MapView y MapPicker).
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from '../../types'
import type { MapMarker } from './MapMulti'
import styles from './Map.module.css'

// Pin dibujado con CSS: las imágenes del paquete no cargan bien con base './'.
const pin = L.divIcon({
  className: styles.pinIcon,
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Pin tipo píldora con el precio o el tipo de lugar; el activo, resaltado. */
const pildora = (m: MapMarker) =>
  L.divIcon({
    className: `${styles.pillIcon} ${m.active ? styles.pillActive : ''}`,
    html: `<span>${escapar(m.label)}</span>`,
    iconSize: undefined,
    iconAnchor: [0, 0],
  })

/** Con varios pines, encuadra el mapa para que se vean todos. */
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  // Se encuadra solo cuando cambian las posiciones, no al resaltar un pin.
  const clave = markers.map((m) => `${m.position.lat},${m.position.lng}`).join('|')
  useEffect(() => {
    const puntos = clave.split('|').map((par) => par.split(',').map(Number) as [number, number])
    if (puntos.length < 2) return
    map.fitBounds(puntos, { padding: [36, 36], maxZoom: 15 })
  }, [map, clave])
  return null
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng])
  }, [map, center.lat, center.lng])
  return null
}

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) })
    },
  })
  return null
}

export default function LeafletMap({
  center,
  zoom,
  marker,
  markers,
  onMarkerClick,
  onPick,
  onTileError,
  height,
}: {
  center: LatLng
  zoom: number
  marker?: LatLng
  markers?: MapMarker[]
  onMarkerClick?: (id: string) => void
  onPick?: (p: LatLng) => void
  /** Se llama cuando una tesela no carga (por ejemplo, sin internet). */
  onTileError?: () => void
  height: number
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={styles.map}
      style={{ height }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={onTileError ? { tileerror: onTileError } : undefined}
      />
      {markers && markers.length > 1 ? <FitBounds markers={markers} /> : <Recenter center={center} />}
      {marker && <Marker position={[marker.lat, marker.lng]} icon={pin} />}
      {markers?.map((m) => (
        <Marker
          key={m.id}
          position={[m.position.lat, m.position.lng]}
          icon={pildora(m)}
          zIndexOffset={m.active ? 1000 : 0}
          title={m.label}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : undefined}
        />
      ))}
      {onPick && <ClickToPick onPick={onPick} />}
    </MapContainer>
  )
}
