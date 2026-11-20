import { Sparkles } from 'lucide-react'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import styles from './Tutorial.module.css'

interface Paso {
  /** Valor de data-tutorial del elemento que se ilumina. */
  destino: string
  titulo: string
  texto: string
}

const PASOS: Paso[] = [
  {
    destino: 'filtros',
    titulo: 'Filtros',
    texto: 'Elige qué quieres ver: roomies, cuartos, lugares recomendados o viajes.',
  },
  { destino: 'buscar', titulo: 'Buscar', texto: 'Encuentra personas por su usuario, o cuartos y lugares en el mapa.' },
  { destino: 'publicar', titulo: 'Publicar', texto: 'Cuenta qué buscas u ofreces. Otros estudiantes lo verán en el inicio.' },
  { destino: 'mensajes', titulo: 'Mensajes', texto: 'Aquí están tus conversaciones con otros estudiantes.' },
  { destino: 'perfil', titulo: 'Perfil', texto: 'Tu pasaporte Rumi: tus datos, idiomas, verificación y publicaciones.' },
  {
    destino: 'asistente',
    titulo: 'Tu asistente',
    texto: 'Y aquí estoy yo. Pregúntame lo que buscas y te muestro las mejores opciones.',
  },
]

type Caja = { top: number; left: number; width: number; height: number; borderRadius: string }

/** El primer elemento visible con ese data-tutorial (la navegación cambia entre celular y escritorio). */
function medir(destino: string): Caja | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tutorial="${destino}"]`)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      // Un destino redondo (como el botón del asistente) tiene un foco redondo.
      const redondo = getComputedStyle(el).borderRadius === '50%'
      return { top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12, borderRadius: redondo ? '50%' : '14px' }
    }
  }
  return null
}

/**
 * Tutorial de la primera vez: oscurece la pantalla, ilumina cada sección y la explica.
 * `onDone(true)` al terminar (abre el asistente); `onDone(false)` al saltarlo.
 */
export function Tutorial({ onDone }: { onDone: (terminado: boolean) => void }) {
  const [i, setI] = useState(0)
  const [caja, setCaja] = useState<Caja | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const paso = PASOS[i]
  const ultimo = i === PASOS.length - 1

  useLayoutEffect(() => {
    const actualizar = () => setCaja(medir(paso.destino))
    actualizar()
    window.addEventListener('resize', actualizar)
    return () => window.removeEventListener('resize', actualizar)
  }, [paso.destino])

  useEffect(() => {
    botonRef.current?.focus()
  }, [i])

  const burbujaRef = useRef<HTMLDivElement>(null)

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onDone(false)
    if (e.key === 'Tab' && burbujaRef.current) {
      // Es modal: el foco da la vuelta entre los botones de la burbuja.
      e.preventDefault()
      const botones = [...burbujaRef.current.querySelectorAll<HTMLElement>('button')]
      const actual = botones.indexOf(document.activeElement as HTMLElement)
      const paso = e.shiftKey ? -1 : 1
      botones[actual === -1 ? 0 : (actual + paso + botones.length) % botones.length].focus()
    }
  })

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  // La burbuja va debajo del destino si está en la mitad de arriba; si no, encima.
  const arriba = caja ? caja.top + caja.height / 2 < window.innerHeight / 2 : false
  const posicion = !caja
    ? undefined
    : arriba
      ? { top: caja.top + caja.height + 12 }
      : { bottom: window.innerHeight - caja.top + 12 }

  return (
    <div className={styles.capa}>
      {caja ? (
        <div className={styles.foco} style={caja} aria-hidden="true" />
      ) : (
        <div className={styles.fondo} aria-hidden="true" />
      )}
      <div
        ref={burbujaRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial"
        className={styles.burbuja}
        data-centrada={!caja || undefined}
        style={posicion}
      >
        <div className={styles.cabeza}>
          <span className={styles.avatar} aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <h2 className={styles.titulo}>{paso.titulo}</h2>
          <span className={styles.cuenta}>
            {i + 1} de {PASOS.length}
          </span>
        </div>
        <p>{paso.texto}</p>
        <div className={styles.acciones}>
          <button type="button" className={styles.saltar} onClick={() => onDone(false)}>
            Saltar
          </button>
          <button
            ref={botonRef}
            type="button"
            className={styles.siguiente}
            onClick={() => (ultimo ? onDone(true) : setI(i + 1))}
          >
            {ultimo ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
