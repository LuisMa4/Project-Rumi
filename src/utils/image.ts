// Las fotos se recortan y comprimen en el navegador antes de guardarlas,
// para que quepan en el presupuesto de espacio (ver photoBudget.ts).
import { ValidationError } from '../services/errors'
import { MSG } from '../services/validation'

export type ImageMode = 'avatar' | 'portada' | 'post'

export const IMAGE_SIZES = {
  avatar: { w: 256, h: 256, q: 0.8 },
  portada: { w: 1200, h: 400, q: 0.75 },
  post: { max: 900, q: 0.65 },
} as const

export interface Crop {
  sx: number
  sy: number
  sw: number
  sh: number
  w: number
  h: number
}

/** Qué parte de la imagen original se toma (sx, sy, sw, sh) y a qué tamaño se dibuja (w, h). Nunca agranda. */
export function targetSize(srcW: number, srcH: number, mode: ImageMode): Crop {
  if (mode === 'post') {
    const scale = Math.min(1, IMAGE_SIZES.post.max / Math.max(srcW, srcH))
    return { sx: 0, sy: 0, sw: srcW, sh: srcH, w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
  }
  const { w: tw, h: th } = IMAGE_SIZES[mode]
  const ratio = tw / th
  // Recorte centrado con la proporción final.
  const sw = srcW / srcH > ratio ? srcH * ratio : srcW
  const sh = sw / ratio
  const w = Math.round(Math.min(tw, sw))
  return {
    sx: Math.round((srcW - sw) / 2),
    sy: Math.round((srcH - sh) / 2),
    sw: Math.round(sw),
    sh: Math.round(sh),
    w,
    h: Math.round(w / ratio),
  }
}

async function loadBitmap(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(file: File, mode: ImageMode): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ValidationError({ imagen: MSG.imagen })
  try {
    const bitmap = await loadBitmap(file)
    const c = targetSize(bitmap.width, bitmap.height, mode)
    const canvas = document.createElement('canvas')
    canvas.width = c.w
    canvas.height = c.h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Sin canvas')
    // JPEG no tiene transparencia: sin este fondo, un PNG transparente queda negro.
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, c.w, c.h)
    ctx.drawImage(bitmap, c.sx, c.sy, c.sw, c.sh, 0, 0, c.w, c.h)
    return canvas.toDataURL('image/jpeg', IMAGE_SIZES[mode].q)
  } catch {
    throw new ValidationError({ imagen: MSG.imagen })
  }
}
