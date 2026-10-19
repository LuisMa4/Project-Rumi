import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getOrCreateConversation } from '../services/chatService'

/** Abre (o crea) la conversación con otra persona y navega a ella. */
export function useStartChat(): (otroId: string) => Promise<void> {
  const { user } = useAuth()
  const navigate = useNavigate()
  return useCallback(
    async (otroId: string) => {
      if (!user) return
      const conversation = await getOrCreateConversation(user.id, otroId)
      navigate(`/mensajes/${conversation.id}`)
    },
    [user, navigate],
  )
}
