import styles from './Logo.module.css'

/** Logo provisional: "rumi" con el punto de la i en celeste. */
export function Logo({ size = 'md', dot = 'celeste' }: { size?: 'sm' | 'md' | 'lg'; dot?: 'celeste' | 'blanco' }) {
  return (
    <span role="img" aria-label="Rumi" className={`${styles.logo} ${styles[size]}`}>
      rum
      <span className={styles.i}>
        ı<span className={`${styles.dot} ${dot === 'blanco' ? styles.dotBlanco : ''}`} />
      </span>
    </span>
  )
}
