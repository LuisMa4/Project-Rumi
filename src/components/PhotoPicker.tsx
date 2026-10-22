import { Camera } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { ValidationError } from '../services/errors'
import { compressImage, type ImageMode } from '../utils/image'
import { Alert } from './Alert'
import styles from './PhotoPicker.module.css'

/** Botón para elegir fotos: las comprime y entrega cada una como data URL. */
export function PhotoPicker({
  label,
  mode,
  onPicked,
  multiple = false,
  className,
}: {
  label: string
  mode: ImageMode
  onPicked: (dataUrl: string) => void | Promise<void>
  multiple?: boolean
  className?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // permite volver a elegir el mismo archivo
    setError(null)
    setBusy(true)
    try {
      for (const file of files) await onPicked(await compressImage(file, mode))
    } catch (err) {
      setError(err instanceof ValidationError ? Object.values(err.fieldErrors)[0] : 'No pudimos agregar la foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <label className={styles.picker} aria-busy={busy || undefined}>
        <input type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={onChange} />
        <Camera size={18} aria-hidden="true" />
        <span>{label}</span>
      </label>
      {error && <Alert>{error}</Alert>}
    </div>
  )
}
