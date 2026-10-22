import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import styles from './PhotoViewer.module.css'

/** Visor de fotos a pantalla completa; Escape lo cierra. */
export function PhotoViewer({ fotos, inicio, onClose }: { fotos: string[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setI((n) => (n + 1) % fotos.length)
      if (e.key === 'ArrowLeft') setI((n) => (n - 1 + fotos.length) % fotos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fotos.length, onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label="Fotos" className={styles.overlay} onClick={onClose}>
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
