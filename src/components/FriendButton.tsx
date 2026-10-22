import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { accept, listIncoming, relation, sendRequest, subscribe } from '../services/friendsService'
import type { Relation } from '../types'
import { Button } from './Button'
import styles from './FriendButton.module.css'

const LABELS: Record<Relation, string> = {
  ninguna: 'Agregar amigo',
  enviada: 'Solicitud enviada',
  recibida: 'Aceptar solicitud',
  amigos: 'Amigos ✓',
}

/** Botón de amistad con el estado de la relación entre la sesión y `otroId`. */
export function FriendButton({ otroId }: { otroId: string }) {
  const { user } = useAuth()
  const userId = user?.id
  const [estado, setEstado] = useState<{ para: string; relation: Relation } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = () =>
      relation(userId, otroId).then((r) => {
        if (!cancelled) setEstado({ para: otroId, relation: r })
      })
    load()
    const off = subscribe(userId, load)
    return () => {
      cancelled = true
      off()
    }
  }, [userId, otroId])

  if (!userId || !estado || estado.para !== otroId) return null
  const actual = estado.relation

  async function onClick() {
    if (!userId) return
    setBusy(true)
    try {
      if (actual === 'ninguna') await sendRequest(userId, otroId)
      if (actual === 'recibida') {
        const solicitud = (await listIncoming(userId)).find((r) => r.de.id === otroId)
        if (solicitud) await accept(solicitud.request.id, userId)
      }
    } finally {
      setBusy(false)
    }
  }

  const interactivo = actual === 'ninguna' || actual === 'recibida'
  return (
    <Button
      variant={actual === 'recibida' ? 'primary' : 'secondary'}
      className={`${styles.button} ${actual === 'amigos' ? styles.amigos : ''}`}
      disabled={actual === 'enviada' || busy}
      aria-disabled={!interactivo || undefined}
      onClick={interactivo ? onClick : undefined}
    >
      {LABELS[actual]}
    </Button>
  )
}
