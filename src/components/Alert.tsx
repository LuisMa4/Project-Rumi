import type { ReactNode } from 'react'
import styles from './Alert.module.css'

/** Error general (no de un campo): se anuncia al aparecer. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className={styles.alert}>
      {children}
    </p>
  )
}
