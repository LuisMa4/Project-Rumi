import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/useAuth'
import { listConversations } from '../services/chatService'
import type { ConversationSummary } from '../types'
import { formatRelative } from '../utils/format'
import styles from './MessagesPage.module.css'

export function MessagesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ConversationSummary[] | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    listConversations(userId).then((result) => {
      if (!cancelled) setItems(result)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div className={styles.page}>
      <h1>Mensajes</h1>
      {items === null ? (
        <p className={styles.muted}>Cargando…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Todavía no tienes conversaciones"
          text="Escribe a alguien desde una publicación o su perfil."
          action={<Link to="/buscar">Buscar estudiantes</Link>}
        />
      ) : (
        <ul className={styles.list}>
          {items.map(({ conversation, otro, ultimoMensaje }) => (
            <li key={conversation.id}>
              <Link to={`/mensajes/${conversation.id}`} className={styles.row}>
                <Avatar id={otro.id} nombre={otro.nombre} size={48} />
                <span className={styles.body}>
                  <span className={styles.name}>{otro.nombre}</span>
                  <span className={styles.preview}>
                    {ultimoMensaje.autorId === userId ? 'Tú: ' : ''}
                    {ultimoMensaje.texto}
                  </span>
                </span>
                <time dateTime={conversation.actualizadoEn} className={styles.time}>
                  {formatRelative(conversation.actualizadoEn)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
