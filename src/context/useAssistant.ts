import { createContext, useContext } from 'react'

export interface AssistantValue {
  isOpen: boolean
  /** Abre el panel; con `pregunta`, además la envía. */
  open(pregunta?: string): void
  close(): void
}

export const AssistantContext = createContext<AssistantValue | null>(null)

export function useAssistant(): AssistantValue {
  const value = useContext(AssistantContext)
  if (!value) throw new Error('useAssistant va dentro de AssistantProvider')
  return value
}
