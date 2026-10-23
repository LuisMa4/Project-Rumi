import { afterEach, expect, it, vi } from 'vitest'
import { MSG } from '../services/validation'
import { compressImage, targetSize } from './image'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('targetSize recorta al centro para avatar y portada, y escala post', () => {
  expect(targetSize(1000, 500, 'avatar')).toEqual({ sx: 250, sy: 0, sw: 500, sh: 500, w: 256, h: 256 })
  expect(targetSize(1800, 1200, 'portada')).toEqual({ sx: 0, sy: 300, sw: 1800, sh: 600, w: 1200, h: 400 })
  expect(targetSize(1800, 1200, 'post')).toEqual({ sx: 0, sy: 0, sw: 1800, sh: 1200, w: 900, h: 600 })
  expect(targetSize(600, 400, 'post')).toMatchObject({ w: 600, h: 400 })
  expect(targetSize(200, 100, 'avatar')).toMatchObject({ w: 100, h: 100 }) // no agranda
})

it('pinta el fondo de blanco antes de dibujar: un PNG transparente no queda negro en el JPEG', async () => {
  // jsdom no tiene canvas: se simula el contexto y se anota cada paso.
  const pasos: string[] = []
  const ctx = {
    set fillStyle(color: string) {
      pasos.push(`fillStyle ${color}`)
    },
    fillRect: (...args: number[]) => pasos.push(`fillRect ${args.join(',')}`),
    drawImage: () => pasos.push('drawImage'),
  }
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 512, height: 512 }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,AA')

  const png = new File(['x'], 'logo.png', { type: 'image/png' })
  await expect(compressImage(png, 'avatar')).resolves.toBe('data:image/jpeg;base64,AA')
  expect(pasos).toEqual(['fillStyle white', 'fillRect 0,0,256,256', 'drawImage'])
})

it('rechaza archivos que no son imagen', async () => {
  await expect(compressImage(new File(['x'], 'a.txt', { type: 'text/plain' }), 'post')).rejects.toMatchObject({
    fieldErrors: { imagen: MSG.imagen },
  })
})
