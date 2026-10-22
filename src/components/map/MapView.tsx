import { lazy, Suspense } from 'react'
import { MapBoundary } from './MapBoundary'
import styles from './Map.module.css'

const LeafletMap = lazy(() => import('./LeafletMap'))

/** Mapa de solo lectura con el pin, y siempre el enlace a Google Maps. */
export function MapView({ lat, lng, height = 200 }: { lat: number; lng: number; height?: number }) {
  return (
    <div className={styles.wrap}>
      <MapBoundary height={height}>
        <Suspense fallback={<div className={styles.placeholder} style={{ height }}>Cargando mapa…</div>}>
          <LeafletMap center={{ lat, lng }} zoom={15} marker={{ lat, lng }} height={height} />
        </Suspense>
      </MapBoundary>
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
