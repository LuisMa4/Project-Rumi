import { CalendarDays, House, MapPin, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStartChat } from '../hooks/useStartChat'
import { POST_TYPE_LABELS, type PostWithAuthor } from '../types'
import { formatDateRange, formatPriceRange, formatRelative } from '../utils/format'
import { Alert } from './Alert'
import { Avatar } from './Avatar'
import { Button } from './Button'
import styles from './PostCard.module.css'

export function PostCard({
  post,
  currentUserId,
  showActions = true,
}: {
  post: PostWithAuthor
  currentUserId: string
  showActions?: boolean
}) {
  const { startChat, error } = useStartChat()
  const { autor } = post
  const fechas = formatDateRange(post.fechaDesde, post.fechaHasta)
  const propio = autor.id === currentUserId

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Link to={`/perfil/${autor.id}`} className={styles.author}>
          <Avatar id={autor.id} nombre={autor.nombre} />
          <span className={styles.who}>
            <span className={styles.name}>{autor.nombre}</span>
            <span className={styles.route}>
              {autor.universidad} → {autor.ciudadDestino}
            </span>
          </span>
        </Link>
        <span className={`${styles.tag} ${post.tipo === 'busco-roomie' ? styles.tagRoomie : ''}`}>
          {POST_TYPE_LABELS[post.tipo]}
        </span>
      </header>

      <p className={styles.text}>{post.texto}</p>

      <ul className={styles.facts}>
        <li>
          <MapPin size={15} aria-hidden="true" />
          {post.ciudad}
        </li>
        {post.zona && (
          <li>
            <House size={15} aria-hidden="true" />
            {post.zona}
          </li>
        )}
        {fechas && (
          <li>
            <CalendarDays size={15} aria-hidden="true" />
            {fechas}
          </li>
        )}
        {(post.precioMin !== undefined || post.precioMax !== undefined) && (
          <li>
            <Wallet size={15} aria-hidden="true" />
            {formatPriceRange(post.precioMin, post.precioMax, post.moneda)}
          </li>
        )}
      </ul>

      {error && <Alert>{error}</Alert>}

      <footer className={styles.foot}>
        <time dateTime={post.creadoEn} className={styles.time}>
          {formatRelative(post.creadoEn)}
        </time>
        {showActions && (
          <div className={styles.actions}>
            {!propio && (
              <Button className={styles.small} onClick={() => startChat(autor.id)}>
                Enviar mensaje
              </Button>
            )}
            <Link to={`/perfil/${autor.id}`} className={styles.link}>
              Ver perfil
            </Link>
          </div>
        )}
      </footer>
    </article>
  )
}
