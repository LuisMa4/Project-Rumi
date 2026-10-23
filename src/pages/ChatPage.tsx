import { ArrowLeft, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { TextField } from '../components/Field'
import { NotFound } from '../components/NotFound'
import { useAuth } from '../context/useAuth'
import { getConversation, getMessages, markRead, send, subscribe } from '../services/chatService'
import { ValidationError } from '../services/errors'
import type { Message, PublicUser } from '../types'
import { formatMessageTime } from '../utils/format'
import { errorMessage } from '../utils/errorMessage'
import styles from './ChatPage.module.css'

type State =
  | { status: 'loading' }
  | { status: 'notfound'; id: string }
  | { status: 'ok'; id: string; otro: PublicUser; messages: Message[] }

export function ChatPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const userId = user?.id
  const [loaded, setState] = useState<State>({ status: 'loading' })
  // Al cambiar de conversación, lo cargado para la anterior no cuenta.
  const state: State = loaded.status !== 'loading' && loaded.id === id ? loaded : { status: 'loading' }
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string>()
  const [sendError, setSendError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([getConversation(id, userId), getMessages(id)])
      .then(([{ otro }, messages]) => {
        if (!cancelled) setState({ status: 'ok', id, otro, messages })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'notfound', id })
      })

    // Mensajes nuevos (los míos y la respuesta automática) llegan por aquí.
    const off = subscribe(id, (m) =>
      setState((s) =>
        s.status === 'ok' && s.id === id && !s.messages.some((x) => x.id === m.id)
          ? { ...s, messages: [...s.messages, m] }
          : s,
      ),
    )
    return () => {
      cancelled = true
      off()
    }
  }, [id, userId])

  const count = state.status === 'ok' ? state.messages.length : 0
  const listo = state.status === 'ok'
  useEffect(() => {
    // Baja la lista (no la página) al último mensaje y lo marca como leído.
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
    // Si no se puede guardar la lectura (sin espacio), el chat sigue funcionando.
    if (listo && userId) markRead(id, userId).catch(() => {})
  }, [count, listo, id, userId])

  if (state.status === 'notfound') return <NotFound />
  if (state.status === 'loading' || !userId) return <p className={styles.muted}>Cargando…</p>

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSendError(null)
    try {
      await send(id, userId!, texto)
      setTexto('')
      setError(undefined)
    } catch (err) {
      if (err instanceof ValidationError) setError(err.fieldErrors.texto)
      else setSendError(errorMessage(err, 'No pudimos enviar el mensaje. Intenta de nuevo.'))
    }
  }

  const { otro, messages } = state

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/mensajes" aria-label="Volver" className={styles.back}>
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
        <Avatar id={otro.id} nombre={otro.nombre} size={44} src={otro.avatarUrl} />
        <div className={styles.who}>
          <h1 className={styles.name}>
            <Link to={`/perfil/${otro.id}`}>{otro.nombre}</Link>
          </h1>
          <p className={styles.muted}>
            {otro.universidad && otro.ciudadDestino ? `${otro.universidad} → ${otro.ciudadDestino}` : `@${otro.usuario}`}
          </p>
        </div>
      </header>

      {/* role="log": los lectores de pantalla anuncian los mensajes que llegan. */}
      <div role="log" aria-label="Mensajes" ref={listRef} className={styles.log}>
        <ol className={styles.thread}>
          {messages.map((m) => (
            <li key={m.id} className={m.autorId === userId ? styles.mine : styles.theirs}>
              <p className={styles.bubble}>{m.texto}</p>
              <time dateTime={m.enviadoEn} className={styles.time}>
                {formatMessageTime(m.enviadoEn)}
              </time>
            </li>
          ))}
        </ol>
      </div>

      <form className={styles.composer} onSubmit={onSubmit} noValidate>
        {sendError && <Alert>{sendError}</Alert>}
        <div className={styles.composerRow}>
          <TextField
            label="Mensaje"
            hideLabel
            placeholder={`Escribe a ${otro.nombre.split(' ')[0]}`}
            autoComplete="off"
            maxLength={1000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            error={error}
          />
          <Button type="submit" className={styles.send}>
            <SendHorizontal size={18} aria-hidden="true" />
            Enviar
          </Button>
        </div>
      </form>
    </div>
  )
}
