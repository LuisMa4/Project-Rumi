import styles from './Avatar.module.css'

function initials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** El color sale del id, así cada persona conserva el suyo. */
function tone(id: string): 'celeste' | 'naranja' {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(hash) % 2 === 0 ? 'celeste' : 'naranja'
}

export function Avatar({ id, nombre, size = 40, src }: { id: string; nombre: string; size?: number; src?: string }) {
  if (src) {
    return (
      <img src={src} alt="" className={styles.avatar} style={{ width: size, height: size, objectFit: 'cover' }} />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`${styles.avatar} ${styles[tone(id)]}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(nombre)}
    </span>
  )
}
