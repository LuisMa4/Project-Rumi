import { lazy, Suspense, useState } from 'react'
import { MapBoundary } from './MapBoundary'
import styles from './Map.module.css'

const LeafletMap = lazy(() => import('./LeafletMap'))

/** Mapa de solo lectura con el pin, y siempre el enlace a Google Maps. */
export function MapView({ lat, lng, height = 200 }: { lat: number; lng: number; height?: number }) {
  const [sinTeselas, setSinTeselas] = useState(false)
  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        <MapBoundary height={height}>
          <Suspense fallback={<div className={styles.placeholder} style={{ height }}>Cargando mapa…</div>}>
            <LeafletMap
              center={{ lat, lng }}
              zoom={15}
              marker={{ lat, lng }}
              height={height}
              onTileError={() => setSinTeselas(true)}
            />
          </Suspense>
        </MapBoundary>
        {sinTeselas && <p className={styles.offline}>No pudimos cargar el mapa</p>}
      </div>
      <a
        className={styles.link}
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir en Google Maps
      </a>
    </div>
  )
}
