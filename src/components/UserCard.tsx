import { CalendarDays, GraduationCap, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PublicUser } from '../types'
import { formatDateRange } from '../utils/format'
import { Avatar } from './Avatar'
import styles from './UserCard.module.css'

export function UserCard({ user }: { user: PublicUser }) {
  return (
    <li className={styles.card}>
      <Avatar id={user.id} nombre={user.nombre} size={48} />
      <div className={styles.body}>
        <p className={styles.name}>{user.nombre}</p>
        <div className={styles.facts}>
          <span>
            <GraduationCap size={15} aria-hidden="true" />
            {user.universidad}
          </span>
          <span>
            <MapPin size={15} aria-hidden="true" />
            {user.ciudadDestino}, {user.paisDestino}
          </span>
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            {formatDateRange(user.fechaLlegada, user.fechaSalida)}
          </span>
        </div>
      </div>
      <Link to={`/perfil/${user.id}`} className={styles.link}>
        Ver perfil
      </Link>
    </li>
  )
}
