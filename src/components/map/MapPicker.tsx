import { lazy, Suspense } from 'react'
import type { LatLng } from '../../types'
import { Button } from '../Button'
import { MapBoundary } from './MapBoundary'
import styles from './Map.module.css'

const LeafletMap = lazy(() => import('./LeafletMap'))

/** Tocar el mapa pone o mueve el pin. */
export function MapPicker({
  value,
  onChange,
  center,
  height = 240,
}: {
  value?: LatLng
  onChange: (v?: LatLng) => void
  center: LatLng
  height?: number
}) {
  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Toca el mapa para poner el pin.</p>
      <MapBoundary height={height}>
        <Suspense fallback={<div className={styles.placeholder} style={{ height }}>Cargando mapa…</div>}>
          <LeafletMap center={value ?? center} zoom={13} marker={value} onPick={onChange} height={height} />
        </Suspense>
      </MapBoundary>
      {value && (
        <Button variant="ghost" className={styles.remove} onClick={() => onChange(undefined)}>
          Quitar ubicación
        </Button>
      )}
    </div>
  )
}
