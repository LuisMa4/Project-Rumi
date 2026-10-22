import { Link, Outlet, useMatch } from 'react-router-dom'
import { AppNav } from './AppNav'
import { Logo } from './Logo'
import { NotificationsBell } from './NotificationsBell'
import styles from './AppLayout.module.css'

export function AppLayout() {
  // El chat ocupa toda la altura: sin scroll de página, la caja para escribir queda fija.
  const enChat = useMatch('/mensajes/:id') !== null
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link to="/" aria-label="Ir al inicio">
          <Logo size="sm" />
        </Link>
        <NotificationsBell />
      </header>
      <AppNav />
      <main className={styles.main} data-fill={enChat || undefined}>
        <div className={styles.column}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
