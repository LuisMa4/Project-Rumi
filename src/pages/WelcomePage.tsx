import { ChevronLeft, ChevronRight, House, KeyRound, MessageCircle, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/useAuth'
import { markSeen } from '../services/onboardingService'
import styles from './WelcomePage.module.css'

interface Postal {
  titulo: string
  texto: string
  icon: LucideIcon
  /** Sello y matasellos de cada postal. */
  sello: string
  cielo: 'tarde' | 'atardecer' | 'noche'
}

const POSTALES: Postal[] = [
  {
    titulo: 'Bienvenido a Rumi',
    texto: 'Somewhere new, someone familiar. Un lugar nuevo se siente como casa cuando ya conoces a alguien ahí.',
    icon: KeyRound,
    sello: 'RUMI',
    cielo: 'tarde',
  },
  {
    titulo: 'Encuentra roomie',
    texto: 'Conoce a estudiantes que van a tu misma ciudad, antes de llegar, y busquen piso juntos.',
    icon: Users,
    sello: 'ROOMIE',
    cielo: 'atardecer',
  },
  {
    titulo: 'Cuartos y lugares',
    texto: 'Cuartos que se ofrecen y sitios que recomiendan quienes ya viven ahí.',
    icon: House,
    sello: 'CASA',
    cielo: 'tarde',
  },
  {
    titulo: 'Haz amigos antes de llegar',
    texto: 'Agrega amigos, escríbeles y comparte lo que estás buscando.',
    icon: MessageCircle,
    sello: 'AMIGOS',
    cielo: 'atardecer',
  },
  {
    titulo: 'Tu asistente',
    texto: 'Pregúntale a la IA lo que buscas: un cuarto, un roomie o qué barrio te conviene.',
    icon: Sparkles,
    sello: 'IA',
    cielo: 'noche',
  },
]

const AVANCE_MS = 4000

function prefiereMenosMovimiento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/** Bienvenida al crear la cuenta: postales que pasan solas, con Omitir siempre a mano. */
export function WelcomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [quieto] = useState(prefiereMenosMovimiento)
  const toqueX = useRef<number | null>(null)
  const ultima = i === POSTALES.length - 1

  // Avanza sola, salvo con movimiento reducido o en la última. Cada cambio reinicia la cuenta.
  useEffect(() => {
    if (quieto || ultima) return
    const t = window.setTimeout(() => setI((n) => Math.min(n + 1, POSTALES.length - 1)), AVANCE_MS)
    return () => window.clearTimeout(t)
  }, [i, quieto, ultima])

  function terminar() {
    if (user) markSeen(user.id, 'bienvenida')
    navigate('/', { replace: true })
  }

  const ir = (n: number) => setI(Math.max(0, Math.min(POSTALES.length - 1, n)))
  const postal = POSTALES[i]
  const Icon = postal.icon

  return (
    <div
      className={styles.page}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (toqueX.current === null) return
        const dx = e.changedTouches[0].clientX - toqueX.current
        toqueX.current = null
        if (dx < -50) ir(i + 1)
        if (dx > 50) ir(i - 1)
      }}
    >
      <header className={styles.top}>
        <Logo size="sm" sobreColor />
        <button type="button" className={styles.skip} onClick={terminar}>
          Omitir
        </button>
      </header>

      <main className={styles.stage}>
        <article key={i} className={styles.postal} data-quieto={quieto || undefined} aria-live="polite">
          <div className={styles.foto} data-cielo={postal.cielo}>
            <Icon className={styles.motivo} size={96} strokeWidth={1.25} aria-hidden="true" />
            <span className={styles.sello} aria-hidden="true">
              <Icon size={22} strokeWidth={1.75} />
              <span>{postal.sello}</span>
            </span>
            <svg className={styles.matasellos} viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="30" cy="30" r="24" />
              <circle cx="30" cy="30" r="18" />
              <path d="M58 18 q8 -6 16 0 t16 0 t16 0 M58 30 q8 -6 16 0 t16 0 t16 0 M58 42 q8 -6 16 0 t16 0 t16 0" />
            </svg>
          </div>
          <div className={styles.dorso}>
            <h1 className={styles.titulo}>{postal.titulo}</h1>
            <p className={styles.texto}>{postal.texto}</p>
            <span className={styles.lineas} aria-hidden="true" />
          </div>
        </article>
      </main>

      <footer className={styles.controls}>
        <button
          type="button"
          className={styles.round}
          aria-label="Anterior"
          onClick={() => ir(i - 1)}
          disabled={i === 0}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <ol className={styles.dots} aria-label={`Postal ${i + 1} de ${POSTALES.length}`}>
          {POSTALES.map((p, n) => (
            <li key={p.titulo} className={styles.dot} data-activo={n === i || undefined} />
          ))}
        </ol>
        {ultima ? (
          <button type="button" className={styles.start} onClick={terminar}>
            Empezar
          </button>
        ) : (
          <button type="button" className={styles.round} aria-label="Siguiente" onClick={() => ir(i + 1)}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        )}
      </footer>
    </div>
  )
}
