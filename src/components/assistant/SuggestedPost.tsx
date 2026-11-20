import { Link } from 'react-router-dom'
import { POST_TYPE_LABELS, type PostWithAuthor } from '../../types'
import { formatPriceRange } from '../../utils/format'
import styles from './Assistant.module.css'

/** Tarjeta compacta de una publicación sugerida por el asistente. */
export function SuggestedPost({ post, onOpen }: { post: PostWithAuthor; onOpen: () => void }) {
  const precio = formatPriceRange(post.precioMin, post.precioMax, post.moneda)
  const donde = [post.ciudad, post.zona ?? post.nombreLugar].filter(Boolean).join(' · ')
  return (
    <Link to={`/publicacion/${post.id}`} className={styles.card} data-tipo={post.tipo} onClick={onOpen}>
      <span className={styles.cardTop}>
        <span className={styles.cardTipo}>{POST_TYPE_LABELS[post.tipo]}</span>
        <span className={styles.cardDonde}>{donde}</span>
      </span>
      <span className={styles.cardTexto}>{post.texto}</span>
      {precio && <span className={styles.cardPrecio}>{precio}</span>}
    </Link>
  )
}
