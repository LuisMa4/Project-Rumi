import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers } from '../services/reactionsService'
import type { PostType } from '../types'
import { REACTIONS_BY_POST_TYPE } from '../utils/reactions'
import { Avatar } from './Avatar'
import styles from './ReactionsDialog.module.css'

type Grupos = Awaited<ReturnType<typeof listUsers>>

/** Quién reaccionó a una publicación, agrupado por reacción. Esc o la X lo cierran. */
export function ReactionsDialog({
  postId,
  postTipo,
  onClose,
}: {
  postId: string
  postTipo: PostType
  onClose: () => void
}) {
  const [grupos, setGrupos] = useState<Grupos | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = `reacciones-${postId}`

  useEffect(() => {
    let cancelled = false
    listUsers(postId).then((g) => {
      if (!cancelled) setGrupos(g)
    })
    return () => {
      cancelled = true
    }
  }, [postId])

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Tab' && dialogRef.current) {
      // El foco da la vuelta dentro del diálogo.
      const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')]
      if (focusables.length === 0) return
      const actual = focusables.indexOf(document.activeElement as HTMLElement)
      const paso = e.shiftKey ? -1 : 1
      e.preventDefault()
      focusables[(actual + paso + focusables.length) % focusables.length].focus()
    }
  })

  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const listener = (e: KeyboardEvent) => onKey(e)
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
      previo?.focus()
    }
  }, [])

  const conGente = grupos?.filter((g) => g.users.length > 0) ?? []

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={styles.dialog}>
        <header className={styles.head}>
          <h2 id={titleId}>Reacciones</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Cerrar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {grupos === null ? (
          <p className={styles.muted}>Cargando…</p>
        ) : (
          conGente.map(({ tipo, users }) => {
            const def = REACTIONS_BY_POST_TYPE[postTipo].find((r) => r.tipo === tipo)
            const Icon = def?.icon
            return (
              <section key={tipo} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  {Icon && <Icon size={16} aria-hidden="true" />}
                  <span>{def?.label}</span>
                  <span className={styles.muted}>{users.length}</span>
                </h3>
                <ul className={styles.people}>
                  {users.map((u) => (
                    <li key={u.id}>
                      <Link to={`/perfil/${u.id}`} className={styles.person} onClick={onClose}>
                        <Avatar id={u.id} nombre={u.nombre} size={36} src={u.avatarUrl} />
                        <span>
                          <span className={styles.name}>{u.nombre}</span>
                          <span className={styles.muted}> @{u.usuario}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
