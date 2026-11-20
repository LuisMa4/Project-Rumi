import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AiRateLimitError, AiUnavailableError, ask, isConfigured } from './aiService'
import { getById } from './usersService'
import { DEMO_USER_ID, resetDemo } from './seed'

const fetchMock = vi.fn()

beforeEach(async () => {
  await resetDemo()
  vi.stubEnv('VITE_AI_URL', 'https://rumi-ia.example.workers.dev/chat')
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ texto: 'Mira este', postIds: ['p-02'] })))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const preguntar = async (texto = 'Busco cuarto') =>
  ask([{ rol: 'usuario', texto }], await getById(DEMO_USER_ID))

it('manda la conversación y las publicaciones al Worker y devuelve las sugeridas', async () => {
  const r = await preguntar()
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('https://rumi-ia.example.workers.dev/chat')
  const body = JSON.parse(init.body as string)
  expect(body.mensajes).toEqual([{ rol: 'usuario', texto: 'Busco cuarto' }])
  expect(body.publicaciones).toHaveLength(12)
  expect(body.publicaciones[0]).toHaveProperty('conUbicacion')
  expect(body.usuario).toEqual({ ciudadDestino: 'Madrid', paisDestino: 'España' })
  expect(r.texto).toBe('Mira este')
  expect(r.posts.map((p) => p.id)).toEqual(['p-02'])
  expect(r.posts[0].autor.nombre).toBe('Mateo Fernández')
})

it('no manda nombres ni usuarios de nadie', async () => {
  await preguntar()
  const enviado = (fetchMock.mock.calls[0][1] as RequestInit).body as string
  for (const dato of ['Alex Romero', 'alex.romero', 'Valeria Ríos', 'valeria.rios', 'Mateo Fernández', 'autor', 'autorId']) {
    expect(enviado).not.toContain(dato)
  }
})

it('descarta ids que no existen', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ texto: 'x', postIds: ['p-99', 'p-05'] })))
  expect((await preguntar()).posts.map((p) => p.id)).toEqual(['p-05'])
})

it('sin postIds devuelve solo el texto', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ texto: 'Hola' })))
  expect(await preguntar()).toEqual({ texto: 'Hola', posts: [] })
})

it('429 es AiRateLimitError', async () => {
  fetchMock.mockResolvedValue(new Response('{"error":"limite"}', { status: 429 }))
  await expect(preguntar()).rejects.toBeInstanceOf(AiRateLimitError)
})

it('502, red caída o JSON inválido son AiUnavailableError', async () => {
  fetchMock.mockResolvedValue(new Response('{"error":"no-disponible"}', { status: 502 }))
  await expect(preguntar()).rejects.toBeInstanceOf(AiUnavailableError)
  fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(preguntar()).rejects.toBeInstanceOf(AiUnavailableError)
  fetchMock.mockResolvedValue(new Response('no json'))
  await expect(preguntar()).rejects.toBeInstanceOf(AiUnavailableError)
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ postIds: [] })))
  await expect(preguntar()).rejects.toBeInstanceOf(AiUnavailableError)
})

it('sin URL configurada no llama a nadie', async () => {
  vi.stubEnv('VITE_AI_URL', '')
  expect(isConfigured()).toBe(false)
  await expect(preguntar()).rejects.toBeInstanceOf(AiUnavailableError)
  expect(fetchMock).not.toHaveBeenCalled()
})
