import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AiRateLimitError, AiUnavailableError } from '../../services/aiService'
import { list } from '../../services/postsService'
import { renderApp } from '../../test/renderApp'

const ai = vi.hoisted(() => ({ ask: vi.fn(), isConfigured: vi.fn(() => true) }))
vi.mock('../../services/aiService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/aiService')>()),
  ask: ai.ask,
  isConfigured: ai.isConfigured,
}))

beforeEach(() => {
  ai.ask.mockReset()
  ai.isConfigured.mockReturnValue(true)
})

async function abrir(ruta = '/') {
  const r = await renderApp(ruta, { session: 'demo' })
  await r.user.click(await screen.findByRole('button', { name: 'Asistente Rumi' }))
  const panel = await screen.findByRole('dialog', { name: 'Asistente Rumi' })
  return { ...r, panel }
}

it('abre con "¿En qué te ayudo?", los tres atajos y la nota de privacidad', async () => {
  const { panel } = await abrir()
  expect(within(panel).getByText('¿En qué te ayudo?')).toBeInTheDocument()
  for (const atajo of ['Crear publicación', 'Buscar cuarto', 'Encontrar roomie']) {
    expect(within(panel).getByRole('button', { name: atajo })).toBeInTheDocument()
  }
  expect(within(panel).getByText('Tus preguntas se envían a Google Gemini. No compartas datos personales.')).toBeInTheDocument()
  expect(within(panel).getByLabelText('Escribe tu pregunta')).toHaveFocus()
})

it('Crear publicación lleva a /publicar y cierra el panel', async () => {
  const { user, panel } = await abrir()
  await user.click(within(panel).getByRole('button', { name: 'Crear publicación' }))
  expect(await screen.findByRole('heading', { name: 'Nueva publicación' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog', { name: 'Asistente Rumi' })).toBeNull()
})

it('Buscar cuarto pregunta y muestra la respuesta con la publicación sugerida', async () => {
  const { user, panel } = await abrir()
  // Después de abrir: renderApp recién carga la demo.
  const [cuarto] = (await list({ tipo: 'ofrezco-cuarto' })).filter((p) => p.id === 'p-02')
  ai.ask.mockResolvedValue({ texto: 'Este cuarto en Moncloa te puede servir.', posts: [cuarto] })
  await user.click(within(panel).getByRole('button', { name: 'Buscar cuarto' }))
  expect(await within(panel).findByText('Este cuarto en Moncloa te puede servir.')).toBeInTheDocument()
  expect(within(panel).getByText('Busco cuarto')).toBeInTheDocument()
  expect(ai.ask.mock.calls[0][0]).toEqual([{ rol: 'usuario', texto: 'Busco cuarto' }])
  expect(within(panel).getByRole('link', { name: /Ofrezco cuarto.*Madrid/ })).toHaveAttribute('href', '/publicacion/p-02')
})

it('escribir y enviar manda todo el historial', async () => {
  ai.ask.mockResolvedValueOnce({ texto: '¿En qué ciudad?', posts: [] }).mockResolvedValueOnce({ texto: 'Perfecto', posts: [] })
  const { user, panel } = await abrir()
  await user.type(within(panel).getByLabelText('Escribe tu pregunta'), 'Busco roomie{Enter}')
  await within(panel).findByText('¿En qué ciudad?')
  await user.type(within(panel).getByLabelText('Escribe tu pregunta'), 'Madrid')
  await user.click(within(panel).getByRole('button', { name: 'Enviar' }))
  await within(panel).findByText('Perfecto')
  expect(ai.ask.mock.calls[1][0]).toEqual([
    { rol: 'usuario', texto: 'Busco roomie' },
    { rol: 'asistente', texto: '¿En qué ciudad?' },
    { rol: 'usuario', texto: 'Madrid' },
  ])
})

it('muestra mensajes amables si falla o si se pasa del límite', async () => {
  ai.ask.mockRejectedValueOnce(new AiUnavailableError()).mockRejectedValueOnce(new AiRateLimitError())
  const { user, panel } = await abrir()
  await user.click(within(panel).getByRole('button', { name: 'Buscar cuarto' }))
  expect(await within(panel).findByText('El asistente no está disponible ahora, intenta en un rato')).toBeInTheDocument()
  await user.type(within(panel).getByLabelText('Escribe tu pregunta'), 'Hola{Enter}')
  expect(await within(panel).findByText('Vas muy rápido, espera un minuto')).toBeInTheDocument()
})

it('sin configurar avisa y no deja escribir', async () => {
  ai.isConfigured.mockReturnValue(false)
  const { panel } = await abrir()
  expect(within(panel).getByText('El asistente todavía no está configurado.')).toBeInTheDocument()
  expect(within(panel).queryByLabelText('Escribe tu pregunta')).toBeNull()
})

it('Esc cierra el panel', async () => {
  const { user } = await abrir()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Asistente Rumi' })).toBeNull()
})

it('el botón no aparece dentro de un chat', async () => {
  await renderApp('/mensajes/c-01', { session: 'demo' })
  await screen.findByRole('link', { name: 'Volver' })
  expect(screen.queryByRole('button', { name: 'Asistente Rumi' })).toBeNull()
})

it('después de muchas preguntas sigue mandando como mucho 20 mensajes, empezando por uno de la persona', async () => {
  ai.ask.mockImplementation(async () => ({ texto: 'Respuesta', posts: [] }))
  const { user, panel } = await abrir()
  for (let n = 1; n <= 11; n++) {
    await user.type(within(panel).getByLabelText('Escribe tu pregunta'), `Pregunta ${n}{Enter}`)
    await within(panel).findByText(`Pregunta ${n}`)
    await waitFor(() => expect(ai.ask).toHaveBeenCalledTimes(n))
  }
  const ultimo = ai.ask.mock.calls[10][0] as { rol: string; texto: string }[]
  expect(ultimo.length).toBeLessThanOrEqual(20)
  expect(ultimo[0].rol).toBe('usuario')
  expect(ultimo.at(-1)).toEqual({ rol: 'usuario', texto: 'Pregunta 11' })
})
