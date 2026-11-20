import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { FriendsRow } from '../components/FriendsRow'
import { PostCard } from '../components/PostCard'
import { PriceRangeFilter } from '../components/PriceRangeFilter'
import { useAuth } from '../context/useAuth'
import { list, maxRentalPrice, searchRentals } from '../services/postsService'
import { POST_TYPE_LABELS, type PostType, type PostWithAuthor } from '../types'
import styles from './HomePage.module.css'

const FILTROS = Object.entries(POST_TYPE_LABELS) as [PostType, string][]

export function HomePage() {
  const { user } = useAuth()
  const location = useLocation()
  // Arranca en lugares recomendados (equipo, versión 0.2), salvo que se llegue
  // desde Publicar: entonces en el tipo recién publicado.
  const desdePublicar = (location.state as { tipo?: PostType } | null)?.tipo
  const [tipo, setTipo] = useState<PostType | null>(
    desdePublicar && desdePublicar in POST_TYPE_LABELS ? desdePublicar : 'lugar',
  )
  const [posts, setPosts] = useState<PostWithAuthor[] | null>(null)
  const [maxPrecio, setMaxPrecio] = useState<number | null>(null)
  const [rango, setRango] = useState<[number, number] | null>(null)
  const alquileres = tipo === 'ofrezco-cuarto'

  // El tope del slider sale del alquiler más caro publicado.
  useEffect(() => {
    if (!alquileres) return
    let cancelled = false
    maxRentalPrice().then((max) => {
      if (!cancelled) setMaxPrecio(max)
    })
    return () => {
      cancelled = true
    }
  }, [alquileres])

  const filtroPrecio = alquileres && maxPrecio !== null && rango !== null && (rango[0] > 0 || rango[1] < maxPrecio)

  useEffect(() => {
    let cancelled = false
    const carga =
      filtroPrecio && rango ? searchRentals({ precioDesde: rango[0], precioHasta: rango[1] }) : list(tipo ? { tipo } : {})
    carga.then((result) => {
      if (!cancelled) setPosts(result)
    })
    return () => {
      cancelled = true
    }
  }, [tipo, filtroPrecio, rango])

  function elegirTipo(t: PostType | null) {
    setTipo(t)
    setRango(null)
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <h1 className="sr-only">Inicio</h1>

      <FriendsRow />

      <div className={styles.filters} role="group" aria-label="Filtrar publicaciones">
        <Chip selected={tipo === null} onClick={() => elegirTipo(null)}>
          Todo
        </Chip>
        {FILTROS.map(([value, label]) => (
          <Chip key={value} selected={tipo === value} onClick={() => elegirTipo(value)}>
            {label}
          </Chip>
        ))}
      </div>

      {alquileres && maxPrecio !== null && (
        <PriceRangeFilter max={maxPrecio} value={rango ?? [0, maxPrecio]} onChange={setRango} />
      )}

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
