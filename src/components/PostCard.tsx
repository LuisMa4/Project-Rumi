import { CalendarDays, House, Link2, MapPin, Users, Wallet } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStartChat } from '../hooks/useStartChat'
import { POST_TYPE_LABELS, type PostWithAuthor, type PublicUser } from '../types'
import { formatDateRange, formatPriceRange, formatRelative } from '../utils/format'
import { LUGAR_CATEGORIAS } from '../utils/hashtags'
import { Alert } from './Alert'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { MapView } from './map/MapView'
import { PhotoViewer } from './PhotoViewer'
import styles from './PostCard.module.css'

/** "universidad → ciudad" si la persona tiene las dos; si no, su @usuario (igual que en el chat). */
function subtitulo(autor: PublicUser): string {
  if (autor.universidad && autor.ciudadDestino) return `${autor.universidad} → ${autor.ciudadDestino}`
  return `@${autor.usuario}`
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

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
  const [expanded, setExpanded] = useState(false)
  const [foto, setFoto] = useState<number | null>(null)
  const [recortado, setRecortado] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const { autor } = post
  const fechas = formatDateRange(post.fechaDesde, post.fechaHasta)
  const precio = formatPriceRange(post.precioMin, post.precioMax, post.moneda)
  const propio = autor.id === currentUserId
  const hayMas = recortado || !!fechas || !!post.enlace || !!post.ubicacion

  // Plegado, el texto se corta en 4 líneas: se mide si de verdad se desborda (no su largo),
  // y otra vez si cambia el ancho de la tarjeta.
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || expanded) return
    const medir = () => setRecortado(el.scrollHeight - el.clientHeight > 1)
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(medir)
    observer.observe(el)
    return () => observer.disconnect()
  }, [post.texto, expanded])

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Link to={`/perfil/${autor.id}`} className={styles.author}>
          <Avatar id={autor.id} nombre={autor.nombre} src={autor.avatarUrl} />
          <span className={styles.who}>
            <span className={styles.name}>{autor.nombre}</span>
            <span className={styles.route}>{subtitulo(autor)}</span>
          </span>
        </Link>
        <span className={`${styles.tag} ${post.tipo === 'busco-roomie' ? styles.tagRoomie : ''}`}>
          {POST_TYPE_LABELS[post.tipo]}
        </span>
      </header>

      {post.tipo === 'lugar' && post.nombreLugar && (
        <p className={styles.lugar}>
          {post.nombreLugar}
          {post.categoria && post.categoria !== 'otro' ? ` · ${LUGAR_CATEGORIAS[post.categoria].label}` : ''}
        </p>
      )}

      <p ref={textRef} className={`${styles.text} ${expanded ? '' : styles.clamped}`}>
        {post.texto}
      </p>

      {post.fotos.length > 0 && (
        <ul className={styles.photos}>
          {post.fotos.map((src, i) => (
            <li key={i}>
              <button
                type="button"
                className={styles.photo}
                aria-label={`Ver foto ${i + 1} de ${post.fotos.length}`}
                onClick={() => setFoto(i)}
              >
                <img src={src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}

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
        {post.personas !== undefined && (
          <li>
            <Users size={15} aria-hidden="true" />
            {post.personas === 1 ? 'Busca 1 roomie' : `Busca ${post.personas} roomies`}
          </li>
        )}
        {precio && (
          <li>
            <Wallet size={15} aria-hidden="true" />
            {precio}
          </li>
        )}
        {expanded && fechas && (
          <li>
            <CalendarDays size={15} aria-hidden="true" />
            {fechas}
          </li>
        )}
      </ul>

      {post.hashtags.length > 0 && (
        <ul className={styles.hashtags} aria-label="Hashtags">
          {post.hashtags.map((t) => (
            <li key={t}>#{t}</li>
          ))}
        </ul>
      )}

      {expanded && (post.enlace || post.ubicacion) && (
        <div className={styles.more}>
          {post.enlace && (
            <a className={styles.enlace} href={post.enlace} target="_blank" rel="noopener noreferrer">
              <Link2 size={16} aria-hidden="true" />
              Ver anuncio en {dominio(post.enlace)}
            </a>
          )}
          {post.ubicacion && <MapView lat={post.ubicacion.lat} lng={post.ubicacion.lng} />}
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      <footer className={styles.foot}>
        <span className={styles.meta}>
          <time dateTime={post.creadoEn} className={styles.time}>
            {formatRelative(post.creadoEn)}
          </time>
          {hayMas && (
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={expanded}
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </span>
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

      {foto !== null && <PhotoViewer fotos={post.fotos} inicio={foto} onClose={() => setFoto(null)} />}
    </article>
  )
}
