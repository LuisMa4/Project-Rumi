import { formatPrice } from '../utils/format'
import styles from './PriceRangeFilter.module.css'

/** Rango de precio al mes con dos controles: desde y hasta. */
export function PriceRangeFilter({
  max,
  value,
  onChange,
}: {
  max: number
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const [desde, hasta] = value
  const pct = (n: number) => `${(n / max) * 100}%`
  return (
    <div className={styles.filter} role="group" aria-label="Precio al mes">
      <div className={styles.head}>
        <span className={styles.title}>Precio al mes</span>
        <span className={styles.values} aria-live="polite">
          Desde {formatPrice(desde)} · Hasta {formatPrice(hasta)}
        </span>
      </div>
      <div className={styles.track}>
        <span className={styles.fill} style={{ left: pct(desde), right: `calc(100% - ${pct(hasta)})` }} />
        <input
          type="range"
          aria-label="Precio desde"
          min={0}
          max={max}
          step={25}
          value={desde}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hasta), hasta])}
        />
        <input
          type="range"
          aria-label="Precio hasta"
          min={0}
          max={max}
          step={25}
          value={hasta}
          onChange={(e) => onChange([desde, Math.max(Number(e.target.value), desde)])}
        />
      </div>
    </div>
  )
}
