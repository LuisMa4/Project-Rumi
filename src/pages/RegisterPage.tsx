import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthShell } from '../components/AuthShell'
import { Button } from '../components/Button'
import { TextField } from '../components/Field'
import { useAuth } from '../context/useAuth'
import { useFocusFirstInvalid } from '../hooks/useFocusFirstInvalid'
import { ValidationError } from '../services/errors'
import type { RegisterInput } from '../types'
import styles from './AuthPages.module.css'

const EMPTY: RegisterInput = {
  nombre: '',
  email: '',
  universidad: '',
  paisOrigen: '',
  ciudadDestino: '',
  paisDestino: '',
  fechaLlegada: '',
  fechaSalida: '',
  password: '',
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterInput>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useFocusFirstInvalid(formRef, errors)

  const field = (key: keyof RegisterInput) => ({
    value: form[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.fieldErrors)
      else setError('No pudimos crear tu cuenta. Intenta de nuevo.')
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="Nombre completo" autoComplete="name" {...field('nombre')} />
        <TextField label="Correo" type="email" autoComplete="email" {...field('email')} />
        <div className={styles.row}>
          <TextField label="Universidad" {...field('universidad')} />
          <TextField label="País de origen" autoComplete="country-name" {...field('paisOrigen')} />
        </div>
        <div className={styles.row}>
          <TextField label="Ciudad destino" {...field('ciudadDestino')} />
          <TextField label="País destino" {...field('paisDestino')} />
        </div>
        <div className={styles.row}>
          <TextField label="Fecha de llegada" type="date" {...field('fechaLlegada')} />
          <TextField label="Fecha de salida" type="date" {...field('fechaSalida')} />
        </div>
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres. No uses una contraseña real: es una demo."
          {...field('password')}
        />
        <Button type="submit" disabled={busy}>
          Crear cuenta
        </Button>
      </form>
    </AuthShell>
  )
}
