// Única pieza que importa Leaflet: se carga de forma diferida (ver MapView y MapPicker).
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from '../../types'
import styles from './Map.module.css'

// Pin dibujado con CSS: las imágenes del paquete no cargan bien con base './'.
const pin = L.divIcon({
  className: styles.pinIcon,
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

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
  onPick,
  onTileError,
  height,
}: {
  center: LatLng
  zoom: number
  marker?: LatLng
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
      <Recenter center={center} />
      {marker && <Marker position={[marker.lat, marker.lng]} icon={pin} />}
      {onPick && <ClickToPick onPick={onPick} />}
    </MapContainer>
  )
}
