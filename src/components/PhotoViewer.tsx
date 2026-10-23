import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import styles from './PhotoViewer.module.css'

/**
 * Visor de fotos a pantalla completa; Escape lo cierra. El foco queda dentro del visor
 * y, al cerrarlo, vuelve a lo que lo abrió (la miniatura).
 */
export function PhotoViewer({ fotos, inicio, onClose }: { fotos: string[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Lee siempre las props actuales: así el efecto no se repite cada vez que el padre se dibuja.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight') setI((n) => (n + 1) % fotos.length)
    if (e.key === 'ArrowLeft') setI((n) => (n - 1 + fotos.length) % fotos.length)
    if (e.key === 'Tab' && dialogRef.current) {
      // Tab y Shift+Tab dan la vuelta entre los botones del visor.
      e.preventDefault()
      const botones = [...dialogRef.current.querySelectorAll<HTMLElement>('button')]
      const actual = botones.indexOf(document.activeElement as HTMLElement)
      const paso = e.shiftKey ? -1 : 1
      const siguiente = actual === -1 ? 0 : (actual + paso + botones.length) % botones.length
      botones[siguiente].focus()
    }
  })

  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
      previo?.focus()
    }
  }, [])

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Fotos" className={styles.overlay} onClick={onClose}>
      <div className={styles.frame} onClick={(e) => e.stopPropagation()}>
        <img src={fotos[i]} alt={`Foto ${i + 1} de ${fotos.length}`} className={styles.img} />
        <button ref={closeRef} type="button" className={`${styles.btn} ${styles.close}`} aria-label="Cerrar" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
        {fotos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.prev}`}
              aria-label="Foto anterior"
              onClick={() => setI((n) => (n - 1 + fotos.length) % fotos.length)}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.next}`}
              aria-label="Foto siguiente"
              onClick={() => setI((n) => (n + 1) % fotos.length)}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <p className={styles.count}>
              {i + 1} / {fotos.length}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
