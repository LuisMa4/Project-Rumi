import { lazy, Suspense, useState } from 'react'
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
  const [sinTeselas, setSinTeselas] = useState(false)
  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Toca el mapa para poner el pin.</p>
      <div className={styles.frame}>
        <MapBoundary height={height}>
          <Suspense fallback={<div className={styles.placeholder} style={{ height }}>Cargando mapa…</div>}>
            <LeafletMap
              center={value ?? center}
              zoom={13}
              marker={value}
              onPick={onChange}
              height={height}
              onTileError={() => setSinTeselas(true)}
            />
          </Suspense>
        </MapBoundary>
        {sinTeselas && <p className={styles.offline}>No pudimos cargar el mapa</p>}
      </div>
      {value && (
        <Button variant="ghost" className={styles.remove} onClick={() => onChange(undefined)}>
          Quitar ubicación
        </Button>
      )}
    </div>
  )
}
