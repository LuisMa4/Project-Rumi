// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env, type PostResumen } from './index'

const ORIGEN = 'http://localhost:5173'
const URL_CHAT = 'https://rumi-ia.example.workers.dev/chat'

const POSTS: PostResumen[] = [
  { id: 'p-01', tipo: 'ofrezco-cuarto', texto: 'Cuarto en Moncloa', ciudad: 'Madrid', hashtags: [], conUbicacion: true },
  { id: 'p-02', tipo: 'lugar', texto: 'Café rico', ciudad: 'Madrid', hashtags: ['Cafe'], conUbicacion: false },
]

let limiteOk = true
const env: Env = {
  GEMINI_API_KEY: 'clave-de-prueba',
  LIMITADOR: { limit: async () => ({ success: limiteOk }) },
}

function cuerpo(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    mensajes: [{ rol: 'usuario', texto: 'Busco cuarto' }],
    publicaciones: POSTS,
    usuario: { ciudadDestino: 'Madrid' },
    ...over,
  })
}

function pedir(body: string, origin: string | null = ORIGEN, method = 'POST') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (origin) headers.Origin = origin
  return worker.fetch(new Request(URL_CHAT, { method, headers, body: method === 'POST' ? body : undefined }), env)
}

function respuestaGemini(json: unknown, status = 200) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }),
    { status },
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  limiteOk = true
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(respuestaGemini({ texto: 'Hola', postIds: ['p-01'] }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('origen', () => {
  it('rechaza orígenes que no son Rumi', async () => {
    const r = await pedir(cuerpo(), 'https://evil.example')
    expect(r.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza pedidos sin origen', async () => {
    expect((await pedir(cuerpo(), null)).status).toBe(403)
  })

  it('responde el preflight solo a orígenes permitidos', async () => {
    const ok = await pedir('', ORIGEN, 'OPTIONS')
    expect(ok.status).toBe(204)
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe(ORIGEN)
    expect((await pedir('', 'https://evil.example', 'OPTIONS')).status).toBe(403)
  })

  it('acepta la página publicada en GitHub Pages', async () => {
    const r = await pedir(cuerpo(), 'https://luisma4.github.io')
    expect(r.status).toBe(200)
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('https://luisma4.github.io')
  })
})

describe('límites', () => {
  it('rechaza cuerpos de más de 100 KB', async () => {
    const r = await pedir(cuerpo({ relleno: 'x'.repeat(101 * 1024) }))
    expect(r.status).toBe(413)
    expect(await r.json()).toEqual({ error: 'grande' })
  })

  it('rechaza JSON roto o sin mensajes', async () => {
    expect((await pedir('{no es json')).status).toBe(400)
    expect((await pedir(cuerpo({ mensajes: [] }))).status).toBe(400)
    expect((await pedir(cuerpo({ mensajes: [{ rol: 'otro', texto: 'x' }] }))).status).toBe(400)
  })

  it('rechaza más de 20 mensajes o más de 200 publicaciones', async () => {
    const muchos = Array.from({ length: 21 }, () => ({ rol: 'usuario', texto: 'hola' }))
    expect((await pedir(cuerpo({ mensajes: muchos }))).status).toBe(400)
    const posts = Array.from({ length: 201 }, (_, i) => ({ ...POSTS[0], id: `p-${i}` }))
    expect((await pedir(cuerpo({ publicaciones: posts }))).status).toBe(400)
  })

  it('con el límite por IP agotado responde 429 sin llamar a Gemini', async () => {
    limiteOk = false
    const r = await pedir(cuerpo())
    expect(r.status).toBe(429)
    expect(await r.json()).toEqual({ error: 'limite' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('solo atiende POST /chat', async () => {
    const r = await worker.fetch(new Request('https://x.dev/otra', { method: 'POST', headers: { Origin: ORIGEN }, body: cuerpo() }), env)
    expect(r.status).toBe(404)
  })
})

describe('Gemini', () => {
  it('llama a gemini-2.5-flash con la clave y pide JSON con texto y postIds', async () => {
    await pedir(cuerpo())
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('clave-de-prueba')
    const enviado = JSON.parse(init.body as string)
    expect(enviado.generationConfig.responseMimeType).toBe('application/json')
    expect(Object.keys(enviado.generationConfig.responseSchema.properties)).toEqual(['texto', 'postIds'])
    expect(enviado.contents.at(-1).role).toBe('user')
    expect(JSON.stringify(enviado)).toContain('p-01')
  })

  it('traduce el historial: usuario → user y asistente → model', async () => {
    await pedir(
      cuerpo({
        mensajes: [
          { rol: 'usuario', texto: 'Hola' },
          { rol: 'asistente', texto: '¿En qué te ayudo?' },
          { rol: 'usuario', texto: 'Busco cuarto' },
        ],
      }),
    )
    const enviado = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(enviado.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model', 'user'])
  })

  it('devuelve el texto y solo los ids que venían en la lista', async () => {
    fetchMock.mockResolvedValue(respuestaGemini({ texto: 'Mira estos', postIds: ['p-01', 'p-99'] }))
    const r = await pedir(cuerpo())
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ texto: 'Mira estos', postIds: ['p-01'] })
  })

  it('si Gemini no manda postIds, responde una lista vacía', async () => {
    fetchMock.mockResolvedValue(respuestaGemini({ texto: 'Solo texto' }))
    expect(await (await pedir(cuerpo())).json()).toEqual({ texto: 'Solo texto', postIds: [] })
  })

  it('un error o cuota agotada de Gemini responde 502', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }))
    const r = await pedir(cuerpo())
    expect(r.status).toBe(502)
    expect(await r.json()).toEqual({ error: 'no-disponible' })
    fetchMock.mockRejectedValue(new Error('red'))
    expect((await pedir(cuerpo())).status).toBe(502)
  })

  it('una respuesta de Gemini que no es JSON válido responde 502', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'no json' }] } }] })),
    )
    expect((await pedir(cuerpo())).status).toBe(502)
  })

  it('no reenvía datos de autores aunque la app los mande', async () => {
    const conAutor = POSTS.map((p) => ({ ...p, autor: { nombre: 'Valeria Ríos', usuario: 'valeria.rios' } }))
    await pedir(cuerpo({ publicaciones: conAutor }))
    const enviado = (fetchMock.mock.calls[0][1] as RequestInit).body as string
    expect(enviado).not.toContain('Valeria')
    expect(enviado).not.toContain('valeria.rios')
  })
})
