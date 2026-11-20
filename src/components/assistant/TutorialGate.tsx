import { useState } from 'react'
import { useAssistant } from '../../context/useAssistant'
import { useAuth } from '../../context/useAuth'
import { getOnboarding, markSeen } from '../../services/onboardingService'
import { Tutorial } from './Tutorial'

/** Muestra el tutorial si esta persona todavía no lo vio; al terminar abre el asistente. */
export function TutorialGate() {
  const { user } = useAuth()
  const assistant = useAssistant()
  const [visible, setVisible] = useState(() => !!user && !getOnboarding(user.id).tutorial)

  if (!user || !visible) return null
  return (
    <Tutorial
      onDone={(terminado) => {
        markSeen(user.id, 'tutorial')
        setVisible(false)
        if (terminado) assistant.open()
      }}
    />
  )
}
