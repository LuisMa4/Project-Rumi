import { Link } from 'react-router-dom'
import { EmptyState } from './EmptyState'

export function NotFound() {
  return (
    <EmptyState
      title="No encontramos este perfil o conversación"
      text="Puede que el enlace esté mal escrito o que ya no exista."
      action={<Link to="/">Volver al inicio</Link>}
    />
  )
}
