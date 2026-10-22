import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useStartChat } from '../hooks/useStartChat'
import { listConversations } from '../services/chatService'
import { listFriends, subscribe } from '../services/friendsService'
import type { PublicUser } from '../types'
import { Alert } from './Alert'
import { Avatar } from './Avatar'
import styles from './FriendsRow.module.css'

type Friend = { user: PublicUser; noLeidos: boolean }

/** Amigos como historias de Instagram: tocar uno abre el chat. */
export function FriendsRow() {
  const { user } = useAuth()
  const userId = user?.id
  const { startChat, error } = useStartChat()
  const [friends, setFriends] = useState<Friend[] | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = async () => {
      const [amigos, conversaciones] = await Promise.all([listFriends(userId), listConversations(userId)])
      // Primero los de la conversación más reciente; después el resto, por nombre.
      const orden = new Map(conversaciones.map((c, i) => [c.otro.id, { i, noLeidos: c.noLeidos }]))
      const result = amigos
        .map((u) => ({ user: u, noLeidos: orden.get(u.id)?.noLeidos ?? false }))
        .sort((a, b) => {
          const ia = orden.get(a.user.id)?.i ?? Infinity
          const ib = orden.get(b.user.id)?.i ?? Infinity
          return ia - ib || a.user.nombre.localeCompare(b.user.nombre, 'es')
        })
      if (!cancelled) setFriends(result)
    }
    load()
    const off = subscribe(userId, load)
    return () => {
      cancelled = true
      off()
    }
  }, [userId])

  return (
    <section aria-label="Amigos" className={styles.section}>
      <h2 className={styles.title}>Amigos</h2>
      {error && <Alert>{error}</Alert>}
      <div className={styles.row}>
        <Link to="/buscar" className={styles.friend}>
          <span className={`${styles.ring} ${styles.add}`}>
            <span className={styles.plus}>
              <Plus size={22} aria-hidden="true" />
            </span>
          </span>
          <span className={styles.name}>Agregar</span>
        </Link>
        {friends?.map(({ user: f, noLeidos }) => (
          <button
            key={f.id}
            type="button"
            className={styles.friend}
            aria-label={noLeidos ? `${f.nombre}, mensajes sin leer` : f.nombre}
            onClick={() => startChat(f.id)}
          >
            <span className={`${styles.ring} ${noLeidos ? styles.unread : ''}`}>
              <Avatar id={f.id} nombre={f.nombre} size={56} src={f.avatarUrl} />
            </span>
            <span className={styles.name} aria-hidden="true">
              {f.nombre.split(' ')[0]}
            </span>
          </button>
        ))}
        {friends?.length === 0 && <p className={styles.empty}>Agrega amigos para escribirles más rápido</p>}
      </div>
    </section>
  )
}
