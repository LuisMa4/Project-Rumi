import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getOrCreateConversation } from '../services/chatService'
import { errorMessage } from '../utils/errorMessage'

/** Abre (o crea) la conversación con otra persona y navega a ella. */
export function useStartChat(): { startChat: (otroId: string) => Promise<void>; error: string | null } {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const startChat = useCallback(
    async (otroId: string) => {
      if (!user) return
      setError(null)
      try {
        const conversation = await getOrCreateConversation(user.id, otroId)
        navigate(`/mensajes/${conversation.id}`)
      } catch (err) {
        setError(errorMessage(err, 'No pudimos abrir la conversación. Intenta de nuevo.'))
      }
    },
    [user, navigate],
  )
  return { startChat, error }
}
