import { useRef, useState, type FormEvent } from 'react'
import { useFocusFirstInvalid } from '../hooks/useFocusFirstInvalid'
import { ValidationError } from '../services/errors'
import { update } from '../services/usersService'
import type { PublicUser } from '../types'
import { Alert } from './Alert'
import { Button } from './Button'
import { TextAreaField, TextField } from './Field'
import styles from './ProfileForm.module.css'

export function ProfileForm({
  user,
  onSaved,
  onCancel,
}: {
  user: PublicUser
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nombre: user.nombre,
    universidad: user.universidad,
    paisOrigen: user.paisOrigen,
    ciudadDestino: user.ciudadDestino,
    paisDestino: user.paisDestino,
    fechaLlegada: user.fechaLlegada,
    fechaSalida: user.fechaSalida,
    bio: user.bio,
    intereses: user.intereses.join(', '),
    instagram: user.instagram ? `@${user.instagram}` : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useFocusFirstInvalid(formRef, errors)

  const field = (key: keyof typeof form) => ({
    value: form[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await update(user.id, {
        ...form,
        intereses: form.intereses.split(','),
      })
      onSaved()
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fieldErrors)
      else setError('No pudimos guardar los cambios. Intenta de nuevo.')
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Editar perfil">
      {error && <Alert>{error}</Alert>}
      <TextField label="Nombre completo" autoComplete="name" {...field('nombre')} />
      <div className={styles.row}>
        <TextField label="Universidad" {...field('universidad')} />
        <TextField label="País de origen" {...field('paisOrigen')} />
      </div>
      <div className={styles.row}>
        <TextField label="Ciudad destino" {...field('ciudadDestino')} />
        <TextField label="País destino" {...field('paisDestino')} />
      </div>
      <div className={styles.row}>
        <TextField label="Fecha de llegada" type="date" {...field('fechaLlegada')} />
        <TextField label="Fecha de salida" type="date" {...field('fechaSalida')} />
      </div>
      <TextAreaField
        label="Biografía"
        hint="Hasta 300 caracteres."
        placeholder="Qué estudias, cómo eres como roomie, qué buscas…"
        {...field('bio')}
      />
      <TextField label="Intereses" hint="Sepáralos con comas." placeholder="Cocina, Fotografía" {...field('intereses')} />
      <TextField label="Instagram" placeholder="@usuario" autoComplete="off" {...field('instagram')} />
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
