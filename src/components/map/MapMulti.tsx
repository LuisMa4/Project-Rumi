import { lazy, Suspense, useState } from 'react'
import type { LatLng } from '../../types'
import { MapBoundary } from './MapBoundary'
import styles from './Map.module.css'

const LeafletMap = lazy(() => import('./LeafletMap'))

export interface MapMarker {
  id: string
  position: LatLng
  /** Texto del pin: el precio de un cuarto ("450 €") o el tipo de lugar. */
  label: string
  active?: boolean
}

/** Mapa con varios pines tipo Airbnb. Sin pines no se dibuja. */
export function MapMulti({
  markers,
  onMarkerClick,
  height = 280,
}: {
  markers: MapMarker[]
  onMarkerClick?: (id: string) => void
  height?: number
}) {
  const [sinTeselas, setSinTeselas] = useState(false)
  if (markers.length === 0) return <p className={styles.empty}>No hay lugares con ubicación en esta ciudad</p>
  return (
    <div className={styles.frame}>
      <MapBoundary height={height}>
        <Suspense fallback={<div className={styles.placeholder} style={{ height }}>Cargando mapa…</div>}>
          <LeafletMap
            center={markers[0].position}
            zoom={13}
            markers={markers}
            onMarkerClick={onMarkerClick}
            height={height}
            onTileError={() => setSinTeselas(true)}
          />
        </Suspense>
      </MapBoundary>
      {sinTeselas && <p className={styles.offline}>No pudimos cargar el mapa</p>}
    </div>
  )
}
