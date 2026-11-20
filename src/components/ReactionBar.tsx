import { useEffect, useState } from 'react'
import { summary, toggle } from '../services/reactionsService'
import type { PostType, ReactionTipo } from '../types'
import { REACTIONS_BY_POST_TYPE } from '../utils/reactions'
import { ReactionsDialog } from './ReactionsDialog'
import styles from './ReactionBar.module.css'

type Resumen = Awaited<ReturnType<typeof summary>>

/** Reacciones propias del tipo de publicación, con contador y la lista de quién reaccionó. */
export function ReactionBar({
  postId,
  postTipo,
  currentUserId,
}: {
  postId: string
  postTipo: PostType
  currentUserId: string
}) {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    let cancelled = false
    summary(postId, currentUserId)
      .then((r) => {
        if (!cancelled) setResumen(r)
      })
      .catch(() => {
        if (!cancelled) setResumen([])
      })
    return () => {
      cancelled = true
    }
  }, [postId, currentUserId, version])

  async function onToggle(tipo: ReactionTipo) {
    setBusy(true)
    try {
      await toggle(postId, currentUserId, tipo)
      setVersion((v) => v + 1)
    } finally {
      setBusy(false)
    }
  }

  if (!resumen || resumen.length === 0) return null
  const total = resumen.reduce((n, r) => n + r.count, 0)

  return (
    <div className={styles.bar}>
      <div role="group" aria-label="Reacciones" className={styles.buttons}>
        {REACTIONS_BY_POST_TYPE[postTipo].map(({ tipo, label, icon: Icon }) => {
          const r = resumen.find((x) => x.tipo === tipo)
          const count = r?.count ?? 0
          return (
            <button
              key={tipo}
              type="button"
              className={styles.reaction}
              aria-pressed={r?.mine ?? false}
              aria-label={`${label} (${count})`}
              disabled={busy}
              onClick={() => onToggle(tipo)}
            >
              <Icon size={16} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
              {count > 0 && <span className={styles.count}>{count}</span>}
            </button>
          )
        })}
      </div>
      {total > 0 && (
        <button type="button" className={styles.who} onClick={() => setAbierto(true)}>
          Ver quién reaccionó ({total})
        </button>
      )}
      {abierto && <ReactionsDialog postId={postId} postTipo={postTipo} onClose={() => setAbierto(false)} />}
    </div>
  )
}
