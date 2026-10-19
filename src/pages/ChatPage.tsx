import { ArrowLeft, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { TextField } from '../components/Field'
import { NotFound } from '../components/NotFound'
import { useAuth } from '../context/useAuth'
import { getConversation, getMessages, send, subscribe } from '../services/chatService'
import { ValidationError } from '../services/errors'
import type { Message, PublicUser } from '../types'
import styles from './ChatPage.module.css'

type State =
  | { status: 'loading' }
  | { status: 'notfound'; id: string }
  | { status: 'ok'; id: string; otro: PublicUser; messages: Message[] }

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

export function ChatPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const userId = user?.id
  const [loaded, setState] = useState<State>({ status: 'loading' })
  // Al cambiar de conversación, lo cargado para la anterior no cuenta.
  const state: State = loaded.status !== 'loading' && loaded.id === id ? loaded : { status: 'loading' }
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string>()
  const endRef = useRef<HTMLDivElement>(null)

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
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [count])

  if (state.status === 'notfound') return <NotFound />
  if (state.status === 'loading' || !userId) return <p className={styles.muted}>Cargando…</p>

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await send(id, userId!, texto)
      setTexto('')
      setError(undefined)
    } catch (err) {
      if (err instanceof ValidationError) setError(err.fieldErrors.texto)
      else throw err
    }
  }

  const { otro, messages } = state

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/mensajes" aria-label="Volver" className={styles.back}>
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
        <Avatar id={otro.id} nombre={otro.nombre} size={44} />
        <div className={styles.who}>
          <h1 className={styles.name}>
            <Link to={`/perfil/${otro.id}`}>{otro.nombre}</Link>
          </h1>
          <p className={styles.muted}>
            {otro.universidad} → {otro.ciudadDestino}
          </p>
        </div>
      </header>

      <ol aria-label="Mensajes" className={styles.thread}>
        {messages.map((m) => (
          <li key={m.id} className={m.autorId === userId ? styles.mine : styles.theirs}>
            <p className={styles.bubble}>{m.texto}</p>
            <time dateTime={m.enviadoEn} className={styles.time}>
              {hora(m.enviadoEn)}
            </time>
          </li>
        ))}
      </ol>
      <div ref={endRef} className={styles.end} />

      <form className={styles.composer} onSubmit={onSubmit} noValidate>
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
      </form>
    </div>
  )
}
