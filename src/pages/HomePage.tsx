import { useEffect, useState } from 'react'
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
  const [tipo, setTipo] = useState<PostType | null>(null)
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
  const nombre = user.nombre.split(' ')[0]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Inicio</h1>
        <p className={styles.greeting}>Hola, {nombre}. Esto es lo nuevo entre estudiantes de intercambio.</p>
      </header>

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
