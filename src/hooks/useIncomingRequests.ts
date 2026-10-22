import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { listIncoming, subscribe } from '../services/friendsService'
import type { FriendRequest, PublicUser } from '../types'

export type IncomingRequest = { request: FriendRequest; de: PublicUser }

/** Solicitudes de amistad pendientes de la sesión; se actualiza sola. `null` mientras carga. */
export function useIncomingRequests(): IncomingRequest[] | null {
  const { user } = useAuth()
  const userId = user?.id
  const [state, setState] = useState<{ userId: string; requests: IncomingRequest[] } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const load = () =>
      listIncoming(userId).then((requests) => {
        if (!cancelled) setState({ userId, requests })
      })
    load()
    const off = subscribe(userId, load)
    return () => {
      cancelled = true
      off()
    }
  }, [userId])

  return state && state.userId === userId ? state.requests : null
}
