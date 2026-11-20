import styles from './Logo.module.css'

/** Logo provisional: "rumi" con el punto de la i en azul (naranja sobre un panel de color). */
export function Logo({ size = 'md', sobreColor = false }: { size?: 'sm' | 'md' | 'lg'; sobreColor?: boolean }) {
  return (
    <span role="img" aria-label="Rumi" className={`${styles.logo} ${styles[size]} ${sobreColor ? styles.sobreColor : ''}`}>
      rum
      <span className={styles.i}>
        ı<span className={styles.dot} />
      </span>
    </span>
  )
}
