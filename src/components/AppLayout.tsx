import { Link, Outlet, useLocation, useMatch } from 'react-router-dom'
import { AssistantProvider } from '../context/AssistantContext'
import { AppNav } from './AppNav'
import { TutorialGate } from './assistant/TutorialGate'
import { Logo } from './Logo'
import { NotificationsBell } from './NotificationsBell'
import styles from './AppLayout.module.css'

export function AppLayout() {
  // El chat ocupa toda la altura: sin scroll de página, la caja para escribir queda fija.
  const enChat = useMatch('/mensajes/:id') !== null
  const enInicio = useMatch('/') !== null
  const location = useLocation()
  return (
    // En el chat no hay botón del asistente: taparía la caja para escribir.
    <AssistantProvider mostrarBoton={!enChat}>
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
      {/* La clave: al volver al inicio (por ejemplo desde "Ver tutorial") se vuelve a mirar si toca. */}
      {enInicio && <TutorialGate key={location.key} />}
    </AssistantProvider>
  )
}
