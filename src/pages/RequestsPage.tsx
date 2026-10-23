import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/useAuth'
import { useIncomingRequests } from '../hooks/useIncomingRequests'
import { accept, reject } from '../services/friendsService'
import { errorMessage } from '../utils/errorMessage'
import styles from './RequestsPage.module.css'

export function RequestsPage() {
  const { user } = useAuth()
  const requests = useIncomingRequests()
  const [error, setError] = useState<string | null>(null)
  // Mientras responde, los botones se deshabilitan: así no se responde dos veces.
  const [busy, setBusy] = useState(false)

  async function responder(requestId: string, aceptar: boolean) {
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      await (aceptar ? accept : reject)(requestId, user.id)
    } catch (err) {
      setError(errorMessage(err, 'No pudimos responder la solicitud. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>Solicitudes</h1>
      {error && <Alert>{error}</Alert>}
      {requests === null ? (
        <p className={styles.muted}>Cargando…</p>
      ) : requests.length === 0 ? (
        <EmptyState title="No tienes solicitudes pendientes" text="Cuando alguien te agregue, aparecerá aquí." />
      ) : (
        <ul className={styles.list}>
          {requests.map(({ request, de }) => (
            <li key={request.id} className={styles.row}>
              <Link to={`/perfil/${de.id}`} className={styles.who}>
                <Avatar id={de.id} nombre={de.nombre} size={48} src={de.avatarUrl} />
                <span className={styles.names}>
                  <span className={styles.name}>{de.nombre}</span>
                  <span className={styles.muted}>@{de.usuario}</span>
                </span>
              </Link>
              <div className={styles.actions}>
                <Button className={styles.small} disabled={busy} onClick={() => responder(request.id, true)}>
                  Aceptar
                </Button>
                <Button
                  variant="ghost"
                  className={styles.small}
                  disabled={busy}
                  onClick={() => responder(request.id, false)}
                >
                  Rechazar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
