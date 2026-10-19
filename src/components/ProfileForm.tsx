import { useRef, useState, type FormEvent } from 'react'
import { useFocusFirstInvalid } from '../hooks/useFocusFirstInvalid'
import { ValidationError } from '../services/errors'
import { update } from '../services/usersService'
import type { PublicUser } from '../types'
import { Button } from './Button'
import { SelectField, TextAreaField, TextField } from './Field'
import styles from './ProfileForm.module.css'

const MONEDAS = ['EUR', 'USD', 'PEN', 'ARS', 'MXN', 'CLP', 'COP', 'CAD']

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
    presupuesto: user.presupuesto?.toString() ?? '',
    moneda: user.moneda ?? 'EUR',
    instagram: user.instagram ? `@${user.instagram}` : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
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
    const presupuesto = form.presupuesto === '' ? undefined : Number(form.presupuesto)
    if (presupuesto !== undefined && !(presupuesto > 0)) {
      setErrors({ presupuesto: 'El presupuesto debe ser mayor que 0' })
      return
    }
    setBusy(true)
    try {
      await update(user.id, {
        ...form,
        intereses: form.intereses.split(','),
        presupuesto,
        moneda: presupuesto === undefined ? undefined : form.moneda,
      })
      onSaved()
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fieldErrors)
      else throw err
      setBusy(false)
    }
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Editar perfil">
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
      <div className={styles.row}>
        <TextField label="Presupuesto mensual" type="number" min={1} inputMode="numeric" {...field('presupuesto')} />
        <SelectField label="Moneda" {...field('moneda')}>
          {MONEDAS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </SelectField>
      </div>
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
