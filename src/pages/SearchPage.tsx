import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { TextField } from '../components/Field'
import { UserCard } from '../components/UserCard'
import { useAuth } from '../context/useAuth'
import { searchByUsername } from '../services/usersService'
import type { PublicUser } from '../types'
import styles from './SearchPage.module.css'

/** Buscar personas por nombre de usuario. */
export function SearchPage() {
  const { user } = useAuth()
  const userId = user?.id
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<{ texto: string; people: PublicUser[] } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    searchByUsername(texto, userId).then((people) => {
      if (!cancelled) setResultado({ texto, people })
    })
    return () => {
      cancelled = true
    }
  }, [texto, userId])

  const vacio = texto.trim().replace(/^@+/, '') === ''
  const people = resultado?.texto === texto ? resultado.people : null

  return (
    <div className={styles.page}>
      <h1>Buscar</h1>
      <div className={styles.filters}>
        <TextField
          label="Nombre de usuario"
          placeholder="@valeria"
          autoComplete="off"
          autoCapitalize="none"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </div>

      {vacio ? (
        <p className={styles.count}>Escribe un nombre de usuario para buscar</p>
      ) : people === null ? (
        <p className={styles.count}>Cargando…</p>
      ) : people.length === 0 ? (
        <EmptyState title="No encontramos a nadie con ese usuario" text="Revisa cómo se escribe o prueba con una parte." />
      ) : (
        <ul aria-label="Resultados" className={styles.results}>
          {people.map((p) => (
            <UserCard key={p.id} user={p} />
          ))}
        </ul>
      )}
    </div>
  )
}
