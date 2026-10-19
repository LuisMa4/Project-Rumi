import { Link, Outlet } from 'react-router-dom'
import { AppNav } from './AppNav'
import { Logo } from './Logo'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link to="/" aria-label="Ir al inicio">
          <Logo size="sm" />
        </Link>
      </header>
      <AppNav />
      <main className={styles.main}>
        <div className={styles.column}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
