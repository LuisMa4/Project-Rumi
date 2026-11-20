import { House, PenLine, SendHorizontal, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isConfigured } from '../../services/aiService'
import type { PostWithAuthor } from '../../types'
import { SuggestedPost } from './SuggestedPost'
import styles from './Assistant.module.css'

export interface AssistantItem {
  rol: 'usuario' | 'asistente'
  texto: string
  posts?: PostWithAuthor[]
  /** Aviso de error: se muestra pero no se manda como historial. */
  error?: boolean
}

/** Panel tipo chat del asistente: hoja inferior en el celular, panel lateral desde 768 px. */
export function AssistantPanel({
  items,
  cargando,
  onSend,
  onClose,
}: {
  items: AssistantItem[]
  cargando: boolean
  onSend: (texto: string) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const finRef = useRef<HTMLDivElement>(null)
  const configurado = isConfigured()

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  })

  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
      if (previo?.isConnected) previo.focus()
    }
  }, [])

  // Siempre a la vista lo último que se dijo.
  useEffect(() => {
    finRef.current?.scrollIntoView?.({ block: 'end' })
  }, [items.length, cargando])

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() || cargando) return
    onSend(texto)
    setTexto('')
  }

  function crearPublicacion() {
    onClose()
    navigate('/publicar')
  }

  return (
    <div role="dialog" aria-label="Asistente Rumi" className={styles.panel}>
      <header className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div className={styles.headText}>
          <h2 className={styles.title}>Asistente Rumi</h2>
          <p className={styles.note}>Tus preguntas se envían a Google Gemini. No compartas datos personales.</p>
        </div>
        <button type="button" className={styles.close} aria-label="Cerrar asistente" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.messages} aria-live="polite">
        {!configurado ? (
          <p className={styles.bubbleBot}>El asistente todavía no está configurado.</p>
        ) : (
          <>
            <div className={styles.bubbleBot}>
              <p>¿En qué te ayudo?</p>
              <div className={styles.shortcuts}>
                <button type="button" className={styles.shortcut} onClick={crearPublicacion}>
                  <PenLine size={16} aria-hidden="true" />
                  Crear publicación
                </button>
                <button type="button" className={styles.shortcut} disabled={cargando} onClick={() => onSend('Busco cuarto')}>
                  <House size={16} aria-hidden="true" />
                  Buscar cuarto
                </button>
                <button
                  type="button"
                  className={styles.shortcut}
                  disabled={cargando}
                  onClick={() => onSend('Busco roomie')}
                >
                  <Users size={16} aria-hidden="true" />
                  Encontrar roomie
                </button>
              </div>
            </div>
            {items.map((item, i) =>
              item.rol === 'usuario' ? (
                <p key={i} className={styles.bubbleUser}>
                  {item.texto}
                </p>
              ) : (
                <div key={i} className={item.error ? styles.bubbleError : styles.bubbleBot}>
                  <p>{item.texto}</p>
                  {item.posts && item.posts.length > 0 && (
                    <ul className={styles.suggested} aria-label="Publicaciones sugeridas">
                      {item.posts.map((p) => (
                        <li key={p.id}>
                          <SuggestedPost post={p} onOpen={onClose} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            )}
            {cargando && <p className={styles.thinking}>Pensando…</p>}
          </>
        )}
        <div ref={finRef} />
      </div>

      {configurado && (
        <form className={styles.composer} onSubmit={enviar}>
          <label htmlFor="asistente-pregunta" className="sr-only">
            Escribe tu pregunta
          </label>
          <input
            id="asistente-pregunta"
            ref={inputRef}
            className={styles.input}
            placeholder="Busco cuarto en Madrid por menos de 500 €…"
            autoComplete="off"
            maxLength={500}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button type="submit" className={styles.send} aria-label="Enviar" disabled={cargando || !texto.trim()}>
            <SendHorizontal size={20} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  )
}
