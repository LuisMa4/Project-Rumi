import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { useFocusFirstInvalid } from '../hooks/useFocusFirstInvalid'
import { ValidationError } from '../services/errors'
import { create } from '../services/postsService'
import { POST_TYPE_LABELS, type PostType, type PostWithAuthor } from '../types'
import { Alert } from './Alert'
import { Button } from './Button'
import { SelectField, TextAreaField, TextField } from './Field'
import styles from './PostComposer.module.css'

const EMPTY = { texto: '', ciudad: '', precio: '', zona: '', fechaDesde: '', fechaHasta: '' }

export function PostComposer({
  autorId,
  onCreated,
  textareaRef,
}: {
  autorId: string
  onCreated: (post: PostWithAuthor) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}) {
  const [tipo, setTipo] = useState<PostType>('busco-roomie')
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Plegado hasta que la persona empieza a escribir: así el feed se ve primero.
  const [expanded, setExpanded] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useFocusFirstInvalid(formRef, errors)

  const conPrecio = tipo === 'busco-roomie' || tipo === 'ofrezco-cuarto'
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const post = await create(autorId, {
        tipo,
        texto: form.texto,
        ciudad: form.ciudad,
        precio: conPrecio && form.precio !== '' ? Number(form.precio) : undefined,
        zona: form.zona || undefined,
        fechaDesde: form.fechaDesde || undefined,
        fechaHasta: form.fechaHasta || undefined,
      })
      onCreated(post)
      setForm((f) => ({ ...EMPTY, ciudad: f.ciudad }))
      setErrors({})
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fieldErrors)
        setExpanded(true)
      } else {
        setError('No pudimos publicar. Intenta de nuevo.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} className={styles.composer} onSubmit={onSubmit} noValidate aria-label="Nueva publicación">
      {error && <Alert>{error}</Alert>}
      <TextAreaField
        ref={textareaRef}
        label="Publicación"
        placeholder="¿Qué estás buscando o qué quieres recomendar?"
        maxLength={500}
        value={form.texto}
        onChange={set('texto')}
        onFocus={() => setExpanded(true)}
        error={errors.texto}
      />
      {expanded && (
        <div className={styles.grid}>
          <SelectField label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as PostType)}>
            {Object.entries(POST_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <TextField label="Ciudad" placeholder="Madrid" value={form.ciudad} onChange={set('ciudad')} error={errors.ciudad} />
          {conPrecio && (
            <TextField
              label="Precio mensual"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="450"
              value={form.precio}
              onChange={set('precio')}
              error={errors.precio}
            />
          )}
          {tipo === 'ofrezco-cuarto' && (
            <TextField label="Zona" placeholder="Moncloa" value={form.zona} onChange={set('zona')} />
          )}
          <TextField label="Desde" type="date" value={form.fechaDesde} onChange={set('fechaDesde')} />
          <TextField
            label="Hasta"
            type="date"
            value={form.fechaHasta}
            onChange={set('fechaHasta')}
            error={errors.fechaHasta}
          />
        </div>
      )}
      <div className={styles.footer}>
        <Button type="submit" disabled={busy}>
          Publicar
        </Button>
      </div>
    </form>
  )
}
