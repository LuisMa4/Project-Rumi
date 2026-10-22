import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicUser } from '../types'
import { Avatar } from './Avatar'
import { FriendButton } from './FriendButton'
import styles from './UserCard.module.css'

export function UserCard({ user }: { user: PublicUser }) {
  const destino = [user.ciudadDestino, user.paisDestino].filter(Boolean).join(', ')
  return (
    <li className={styles.card}>
      <Avatar id={user.id} nombre={user.nombre} size={48} src={user.avatarUrl} />
      <div className={styles.body}>
        <p className={styles.name}>{user.nombre}</p>
        <div className={styles.facts}>
          <span>@{user.usuario}</span>
          {destino && (
            <span>
              <MapPin size={15} aria-hidden="true" />
              {destino}
            </span>
          )}
        </div>
      </div>
      <div className={styles.actions}>
        <FriendButton otroId={user.id} />
        <Link to={`/perfil/${user.id}`} className={styles.link}>
          Ver perfil
        </Link>
      </div>
    </li>
  )
}
