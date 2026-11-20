import { Sparkles } from 'lucide-react'
import styles from './Assistant.module.css'

/** Botón flotante abajo a la derecha que abre el asistente. */
export function AssistantButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.fab} aria-label="Asistente Rumi" data-tutorial="asistente" onClick={onClick}>
      <Sparkles size={26} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
