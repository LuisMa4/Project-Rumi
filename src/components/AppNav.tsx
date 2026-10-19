import { House, MessageCircle, Plus, Search, User, type LucideIcon } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import styles from './AppNav.module.css'

const ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/buscar', label: 'Buscar', icon: Search },
  { to: '/mensajes', label: 'Mensajes', icon: MessageCircle },
  { to: '/perfil', label: 'Perfil', icon: User, end: true },
]

function Item({ to, label, icon: Icon, end }: (typeof ITEMS)[number]) {
  return (
    <NavLink to={to} end={end} className={styles.item}>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

/** Barra inferior en el celular; menú lateral desde 768 px. */
export function AppNav() {
  return (
    <nav aria-label="Principal" className={styles.nav}>
      <Link to="/" className={styles.brand} aria-label="Ir al inicio">
        <Logo size="md" />
      </Link>
      <Item {...ITEMS[0]} />
      <Item {...ITEMS[1]} />
      <Link to="/?publicar=1" className={styles.publish} aria-label="Publicar">
        <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
        <span className={styles.publishText}>Publicar</span>
      </Link>
      <Item {...ITEMS[2]} />
      <Item {...ITEMS[3]} />
    </nav>
  )
}
