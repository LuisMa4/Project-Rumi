import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { NotFound } from '../components/NotFound'
import { PostCard } from '../components/PostCard'
import { useAuth } from '../context/useAuth'
import { getById } from '../services/postsService'
import type { PostWithAuthor } from '../types'
import styles from './PostPage.module.css'

type Loaded = { id: string; post: PostWithAuthor | null }

/** Una publicación sola: adonde llevan las sugerencias del asistente. */
export function PostPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    getById(id)
      .then((post) => {
        if (!cancelled) setLoaded({ id, post })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id, post: null })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!user) return null
  if (!loaded || loaded.id !== id) return <p className={styles.muted}>Cargando…</p>
  if (!loaded.post) return <NotFound title="No encontramos esta publicación" />

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Volver al inicio
      </Link>
      <h1 className="sr-only">Publicación</h1>
      <PostCard post={loaded.post} currentUserId={user.id} />
    </div>
  )
}
