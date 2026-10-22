import { useEffect, useState } from 'react'
import { Chip } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { PostCard } from '../components/PostCard'
import { FriendsRow } from '../components/FriendsRow'
import { useAuth } from '../context/useAuth'
import { list } from '../services/postsService'
import { POST_TYPE_LABELS, type PostType, type PostWithAuthor } from '../types'
import styles from './HomePage.module.css'

const FILTROS = Object.entries(POST_TYPE_LABELS) as [PostType, string][]

export function HomePage() {
  const { user } = useAuth()
  const [tipo, setTipo] = useState<PostType | null>(null)
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(null)

  useEffect(() => {
    let cancelled = false
    list(tipo ? { tipo } : {}).then((result) => {
      if (!cancelled) setPosts(result)
    })
    return () => {
      cancelled = true
    }
  }, [tipo])

  if (!user) return null
  const nombre = user.nombre.split(' ')[0]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Inicio</h1>
        <p className={styles.greeting}>Hola, {nombre}. Esto es lo nuevo entre estudiantes de intercambio.</p>
      </header>

      <FriendsRow />

      <div className={styles.filters} role="group" aria-label="Filtrar publicaciones">
        <Chip selected={tipo === null} onClick={() => setTipo(null)}>
          Todo
        </Chip>
        {FILTROS.map(([value, label]) => (
          <Chip key={value} selected={tipo === value} onClick={() => setTipo(value)}>
            {label}
          </Chip>
        ))}
      </div>

      <section className={styles.feed} aria-label="Publicaciones">
        {posts === null ? (
          <p className={styles.loading}>Cargando…</p>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Todavía no hay publicaciones de este tipo"
            text="Publica lo que estás buscando y aparecerá aquí."
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} />)
        )}
      </section>
    </div>
  )
}
