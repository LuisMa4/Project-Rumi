import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { AuthShell } from '../components/AuthShell'
import { Button } from '../components/Button'
import { TextField } from '../components/Field'
import { useAuth } from '../context/useAuth'
import { AuthError } from '../services/errors'
import styles from './AuthPages.module.css'

export function LoginPage() {
  const { login, loginDemo } = useAuth()
  const navigate = useNavigate()
  const [identificador, setIdentificador] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No pudimos iniciar sesión. Intenta de nuevo.')
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    run(() => login(identificador, password))
  }

  return (
    <AuthShell
      title="Inicia sesión"
      footer={
        <>
          ¿Primera vez en Rumi? <Link to="/registro">Crea tu cuenta</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField
          label="Usuario o correo"
          autoComplete="username"
          autoCapitalize="none"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          Iniciar sesión
        </Button>
      </form>
      <div className={styles.demo}>
        <Button variant="secondary" disabled={busy} onClick={() => run(loginDemo)}>
          Entrar con cuenta demo
        </Button>
        <p className={styles.demoText}>Explora Rumi con datos de ejemplo.</p>
      </div>
    </AuthShell>
  )
}
