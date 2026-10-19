import styles from './Logo.module.css'

/** Logo provisional: "rumi" con el punto de la i en celeste. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span role="img" aria-label="Rumi" className={`${styles.logo} ${styles[size]}`}>
      rum
      <span className={styles.i}>
        ı<span className={styles.dot} />
      </span>
    </span>
  )
}
