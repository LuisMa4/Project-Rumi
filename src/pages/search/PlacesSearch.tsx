import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TextField } from '../../components/Field'
import { MapMulti, type MapMarker } from '../../components/map/MapMulti'
import { PostCard } from '../../components/PostCard'
import { useAssistant } from '../../context/useAssistant'
import { useAuth } from '../../context/useAuth'
import { CITY_COORDS } from '../../services/cities'
import { listByCity } from '../../services/postsService'
import type { PostWithAuthor } from '../../types'
import { formatPriceRange } from '../../utils/format'
import { LUGAR_CATEGORIAS } from '../../utils/hashtags'
import styles from '../SearchPage.module.css'

/** Texto del pin: el precio del cuarto o el tipo de lugar. */
function etiqueta(p: PostWithAuthor): string {
  if (p.tipo === 'ofrezco-cuarto') return formatPriceRange(p.precioMin, p.precioMax, p.moneda).replace(/ al mes$/, '') || 'Cuarto'
  return (p.categoria && LUGAR_CATEGORIAS[p.categoria]?.label) || 'Lugar'
}

/** Cuartos y lugares de una ciudad, en un mapa tipo Airbnb y en lista. */
export function PlacesSearch() {
  const { user } = useAuth()
  const assistant = useAssistant()
  const [ciudad, setCiudad] = useState(user?.ciudadDestino ?? '')
  const [resultado, setResultado] = useState<{ ciudad: string; posts: PostWithAuthor[] } | null>(null)
  const [activo, setActivo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listByCity(ciudad).then((posts) => {
      if (!cancelled) setResultado({ ciudad, posts })
    })
    return () => {
      cancelled = true
    }
  }, [ciudad])

  const posts = resultado?.ciudad === ciudad ? resultado.posts : null
  const nombre = ciudad.trim()
  const markers: MapMarker[] = (posts ?? [])
    .filter((p) => p.ubicacion)
    .map((p) => ({ id: p.id, position: p.ubicacion!, label: etiqueta(p), active: p.id === activo }))

  function tocarPin(id: string) {
    setActivo(id)
    document.getElementById(`lugar-${id}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <div className={styles.filters}>
        <TextField
          label="¿Dónde?"
          placeholder="Madrid"
          list="rumi-ciudades"
          autoComplete="off"
          value={ciudad}
          onChange={(e) => {
            setCiudad(e.target.value)
            setActivo(null)
          }}
        />
        <datalist id="rumi-ciudades">
          {Object.keys(CITY_COORDS).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {!nombre ? (
        <p className={styles.count}>Escribe una ciudad para ver cuartos y lugares</p>
      ) : posts === null ? (
        <p className={styles.count}>Cargando…</p>
      ) : posts.length === 0 ? (
        <p className={styles.count}>Todavía no hay cuartos ni lugares en {nombre}</p>
      ) : (
        <>
          <MapMulti markers={markers} onMarkerClick={tocarPin} />
          <button type="button" className={styles.askAi} onClick={() => assistant.open(`¿Cuáles son los mejores lugares y cuartos en ${nombre}?`)}>
            <Sparkles size={18} aria-hidden="true" />
            Pídele a la IA los mejores
          </button>
          <ul aria-label="Cuartos y lugares" className={styles.results}>
            {posts.map((p) => (
              <li
                key={p.id}
                id={`lugar-${p.id}`}
                className={styles.place}
                aria-current={p.id === activo ? 'true' : undefined}
              >
                <PostCard post={p} currentUserId={user?.id ?? ''} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
