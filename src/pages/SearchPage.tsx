import { useRef, useState, type KeyboardEvent } from 'react'
import { PeopleSearch } from './search/PeopleSearch'
import { PlacesSearch } from './search/PlacesSearch'
import styles from './SearchPage.module.css'

const PESTANAS = [
  { id: 'personas', label: 'Personas' },
  { id: 'lugares', label: 'Lugares' },
] as const

type Pestana = (typeof PESTANAS)[number]['id']

/** Buscar personas por usuario, o cuartos y lugares de una ciudad en el mapa. */
export function SearchPage() {
  const [pestana, setPestana] = useState<Pestana>('personas')
  const tabsRef = useRef<HTMLDivElement>(null)

  // Teclado de pestañas (WAI-ARIA): las flechas cambian y mueven el foco, dando la vuelta.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    const i = PESTANAS.findIndex((p) => p.id === pestana)
    const siguiente = PESTANAS[(i + paso + PESTANAS.length) % PESTANAS.length].id
    setPestana(siguiente)
    tabsRef.current?.querySelector<HTMLElement>(`#tab-${siguiente}`)?.focus()
  }

  return (
    <div className={styles.page}>
      <h1>Buscar</h1>
      <div ref={tabsRef} role="tablist" aria-label="Qué buscar" className={styles.tabs} onKeyDown={onKeyDown}>
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            id={`tab-${p.id}`}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            aria-controls={`panel-${p.id}`}
            tabIndex={pestana === p.id ? 0 : -1}
            className={styles.tab}
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${pestana}`} aria-labelledby={`tab-${pestana}`} className={styles.panel}>
        {pestana === 'personas' ? <PeopleSearch /> : <PlacesSearch />}
      </div>
    </div>
  )
}
