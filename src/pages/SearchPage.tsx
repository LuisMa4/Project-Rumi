import { useEffect, useState } from 'react'
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

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export function SearchPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('personas')

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

  return (
    <div className={styles.page}>
      <h1>Buscar</h1>

      <div role="tablist" aria-label="Qué buscar" className={styles.tabs}>
        {(['personas', 'alquileres'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            className={styles.tab}
            onClick={() => setTab(t)}
          >
            {t === 'personas' ? 'Personas' : 'Alquileres'}
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

          {people === null ? (
            <p className={styles.count}>Cargando…</p>
          ) : people.length === 0 ? (
            <EmptyState
              title="No encontramos estudiantes con esos filtros"
              text="Prueba con otra ciudad o quita el filtro de fechas."
            />
          ) : (
            <>
              <p className={styles.count} aria-live="polite">
                {plural(people.length, 'estudiante', 'estudiantes')}
              </p>
              <ul aria-label="Resultados" className={styles.results}>
                {people.map((p) => (
                  <UserCard key={p.id} user={p} />
                ))}
              </ul>
            </>
          )}
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

          {rentals === null ? (
            <p className={styles.count}>Cargando…</p>
          ) : rentals.length === 0 ? (
            <EmptyState
              title="No encontramos alquileres con esos filtros"
              text="Sube el precio máximo o prueba con otra ciudad."
            />
          ) : (
            <>
              <p className={styles.count} aria-live="polite">
                {plural(rentals.length, 'alquiler', 'alquileres')}
              </p>
              <div className={styles.results}>
                {rentals.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={user.id} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
