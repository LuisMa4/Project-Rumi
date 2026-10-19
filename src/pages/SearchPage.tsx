import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { EmptyState } from '../components/EmptyState'
import { TextField } from '../components/Field'
import { PostCard } from '../components/PostCard'
import { UserCard } from '../components/UserCard'
import { useAuth } from '../context/useAuth'
import { searchRentals } from '../services/postsService'
import { search } from '../services/usersService'
import type { PostWithAuthor, PublicUser } from '../types'
import styles from './SearchPage.module.css'

type Tab = 'personas' | 'alquileres'

const TABS: { id: Tab; label: string }[] = [
  { id: 'personas', label: 'Personas' },
  { id: 'alquileres', label: 'Alquileres' },
]

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export function SearchPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('personas')
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})

  const [personas, setPersonas] = useState({ texto: '', ciudadDestino: '', universidad: '', coincide: false })
  const [people, setPeople] = useState<PublicUser[] | null>(null)

  const [alquiler, setAlquiler] = useState({ ciudad: '', precioMax: '' })
  const [rentals, setRentals] = useState<PostWithAuthor[] | null>(null)

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const { texto, ciudadDestino, universidad, coincide } = personas
    search({ texto, ciudadDestino, universidad, coincideCon: coincide ? userId : undefined }, userId).then((r) => {
      if (!cancelled) setPeople(r)
    })
    return () => {
      cancelled = true
    }
  }, [personas, userId])

  useEffect(() => {
    let cancelled = false
    const precioMax = Number(alquiler.precioMax)
    searchRentals({
      ciudad: alquiler.ciudad,
      precioMax: alquiler.precioMax !== '' && precioMax > 0 ? precioMax : undefined,
    }).then((r) => {
      if (!cancelled) setRentals(r)
    })
    return () => {
      cancelled = true
    }
  }, [alquiler])

  if (!user) return null

  // Patrón de pestañas WAI-ARIA: las flechas, Inicio y Fin mueven el foco y activan la pestaña.
  function onTabKeyDown(e: KeyboardEvent) {
    const current = TABS.findIndex((t) => t.id === tab)
    const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: TABS.length - 1 }[e.key]
    if (target === undefined) return
    e.preventDefault()
    const next = TABS[(target + TABS.length) % TABS.length].id
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={styles.page}>
      <h1>Buscar</h1>

      <div role="tablist" aria-label="Qué buscar" className={styles.tabs} onKeyDown={onTabKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'personas' ? (
        <section role="tabpanel" id="panel-personas" aria-labelledby="tab-personas" className={styles.panel}>
          <div className={styles.filters}>
            <TextField
              label="Nombre"
              placeholder="Valeria"
              value={personas.texto}
              onChange={(e) => setPersonas((p) => ({ ...p, texto: e.target.value }))}
            />
            <TextField
              label="Ciudad destino"
              placeholder="Madrid"
              value={personas.ciudadDestino}
              onChange={(e) => setPersonas((p) => ({ ...p, ciudadDestino: e.target.value }))}
            />
            <TextField
              label="Universidad"
              placeholder="PUCP"
              value={personas.universidad}
              onChange={(e) => setPersonas((p) => ({ ...p, universidad: e.target.value }))}
            />
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={personas.coincide}
                onChange={(e) => setPersonas((p) => ({ ...p, coincide: e.target.checked }))}
              />
              Fechas que coinciden con las mías
            </label>
          </div>

          {/* La región existe siempre (también con 0) para que el lector anuncie cada cambio. */}
          <p role="status" className={people?.length === 0 ? 'sr-only' : styles.count}>
            {people === null ? 'Cargando…' : plural(people.length, 'estudiante', 'estudiantes')}
          </p>
          {people !== null &&
            (people.length === 0 ? (
              <EmptyState
                title="No encontramos estudiantes con esos filtros"
                text="Prueba con otra ciudad o quita el filtro de fechas."
              />
            ) : (
              <ul aria-label="Resultados" className={styles.results}>
                {people.map((p) => (
                  <UserCard key={p.id} user={p} />
                ))}
              </ul>
            ))}
        </section>
      ) : (
        <section role="tabpanel" id="panel-alquileres" aria-labelledby="tab-alquileres" className={styles.panel}>
          <div className={styles.filters}>
            <TextField
              label="Ciudad"
              placeholder="Madrid"
              value={alquiler.ciudad}
              onChange={(e) => setAlquiler((a) => ({ ...a, ciudad: e.target.value }))}
            />
            <TextField
              label="Precio máximo"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="500"
              value={alquiler.precioMax}
              onChange={(e) => setAlquiler((a) => ({ ...a, precioMax: e.target.value }))}
            />
          </div>

          <p role="status" className={rentals?.length === 0 ? 'sr-only' : styles.count}>
            {rentals === null ? 'Cargando…' : plural(rentals.length, 'alquiler', 'alquileres')}
          </p>
          {rentals !== null &&
            (rentals.length === 0 ? (
              <EmptyState
                title="No encontramos alquileres con esos filtros"
                text="Sube el precio máximo o prueba con otra ciudad."
              />
            ) : (
              <div className={styles.results}>
                {rentals.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={user.id} />
                ))}
              </div>
            ))}
        </section>
      )}
    </div>
  )
}
