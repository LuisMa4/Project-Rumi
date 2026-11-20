import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AssistantButton } from '../components/assistant/AssistantButton'
import { AssistantPanel, type AssistantItem } from '../components/assistant/AssistantPanel'
import { AiRateLimitError, ask, type AiMensaje } from '../services/aiService'
import { useAuth } from './useAuth'
import { AssistantContext, type AssistantValue } from './useAssistant'

/** El Worker acepta hasta 20 mensajes y el primero debe ser de la persona. */
const MAX_HISTORIAL = 20

/** Lo que se manda al asistente: sin avisos de error, los últimos 20 y empezando por la persona. */
function recortarHistorial(items: AssistantItem[]): AiMensaje[] {
  const ultimos = items
    .filter((i) => !i.error)
    .map(({ rol, texto }) => ({ rol, texto }))
    .slice(-MAX_HISTORIAL)
  const desde = ultimos.findIndex((m) => m.rol === 'usuario')
  return desde === -1 ? ultimos : ultimos.slice(desde)
}

/**
 * Estado del asistente: si el panel está abierto y la conversación.
 * La conversación dura mientras la app está abierta (se pierde al recargar).
 */
export function AssistantProvider({ children, mostrarBoton }: { children: ReactNode; mostrarBoton: boolean }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<AssistantItem[]>([])
  const [cargando, setCargando] = useState(false)
  // Copia síncrona de la conversación: open('…') puede llamar a enviar antes de que React redibuje.
  const itemsRef = useRef<AssistantItem[]>([])

  const poner = useCallback((nuevos: AssistantItem[]) => {
    itemsRef.current = nuevos
    setItems(nuevos)
  }, [])

  const enviar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim()
      if (!limpio || !user) return
      const conPregunta: AssistantItem[] = [...itemsRef.current, { rol: 'usuario', texto: limpio }]
      poner(conPregunta)
      setCargando(true)
      const historial = recortarHistorial(conPregunta)
      try {
        const r = await ask(historial, user)
        poner([...itemsRef.current, { rol: 'asistente', texto: r.texto, posts: r.posts }])
      } catch (e) {
        const aviso = e instanceof AiRateLimitError ? e.message : 'El asistente no está disponible ahora, intenta en un rato'
        poner([...itemsRef.current, { rol: 'asistente', texto: aviso, error: true }])
      } finally {
        setCargando(false)
      }
    },
    [user, poner],
  )

  const value = useMemo<AssistantValue>(
    () => ({
      isOpen,
      open: (pregunta?: string) => {
        setIsOpen(true)
        if (pregunta) void enviar(pregunta)
      },
      close: () => setIsOpen(false),
    }),
    [isOpen, enviar],
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
      {mostrarBoton && !isOpen && <AssistantButton onClick={() => setIsOpen(true)} />}
      {isOpen && (
        <AssistantPanel items={items} cargando={cargando} onSend={enviar} onClose={() => setIsOpen(false)} />
      )}
    </AssistantContext.Provider>
  )
}
