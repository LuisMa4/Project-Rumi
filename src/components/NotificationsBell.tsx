import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useIncomingRequests } from '../hooks/useIncomingRequests'
import styles from './NotificationsBell.module.css'

/** Campana con el número de solicitudes de amistad pendientes. */
export function NotificationsBell() {
  const count = useIncomingRequests()?.length ?? 0
  return (
    <Link
      to="/solicitudes"
      className={styles.bell}
      aria-label={count > 0 ? `Solicitudes de amistad (${count})` : 'Solicitudes de amistad'}
    >
      <Bell size={22} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {count}
        </span>
      )}
    </Link>
  )
}
