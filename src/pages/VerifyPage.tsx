import { Check } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { SelectField, TextField } from '../components/Field'
import { PhotoPicker } from '../components/PhotoPicker'
import { useAuth } from '../context/useAuth'
import { ValidationError } from '../services/errors'
import {
  generateCode,
  validateCelular,
  validateDni,
  validateUniversidad,
  verifyCelular,
  verifyDni,
  verifyUniversidad,
} from '../services/usersService'
import { MSG } from '../services/validation'
import type { Verificacion } from '../types'
import { errorMessage } from '../utils/errorMessage'
import styles from './VerifyPage.module.css'

type Paso = keyof Verificacion

const PASOS: { key: Paso; titulo: string }[] = [
  { key: 'dni', titulo: 'DNI' },
  { key: 'celular', titulo: 'Celular' },
  { key: 'universidad', titulo: 'Universidad' },
]

const CODIGOS_PAIS = ['+51', '+56', '+52', '+54', '+57', '+34', '+351', '+1']

type StepProps = { userId: string; onDone: () => Promise<void>; onSkip: () => void }

function StepActions({ onSkip, busy }: { onSkip: () => void; busy: boolean }) {
  return (
    <div className={styles.actions}>
      <Button variant="ghost" onClick={onSkip} disabled={busy}>
        Omitir este paso
      </Button>
      <Button type="submit" disabled={busy}>
        Verificar
      </Button>
    </div>
  )
}

function DniStep({ userId, onDone, onSkip }: StepProps) {
  const [numero, setNumero] = useState('')
  // La foto solo vive en esta pantalla: nunca se guarda.
  const [foto, setFoto] = useState<string>()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const errs = validateDni({ numero })
    if (!foto) errs.foto = MSG.fotoDocumento
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setBusy(true)
    try {
      await verifyDni(userId, { numero })
      setFoto(undefined)
      await onDone()
    } catch (err) {
      setBusy(false)
      setError(errorMessage(err, 'No pudimos verificar tu documento. Intenta de nuevo.'))
    }
  }

  return (
    <form className={styles.step} onSubmit={onSubmit} noValidate>
      <h2>DNI</h2>
      {error && <Alert>{error}</Alert>}
      <p className={styles.muted}>Usamos tu documento solo para confirmar que eres tú. No guardamos la foto ni el número completo.</p>
      <TextField
        label="Número de DNI o pasaporte"
        autoComplete="off"
        value={numero}
        error={errors.numero}
        onChange={(e) => setNumero(e.target.value)}
      />
      <div className={styles.field}>
        <PhotoPicker label="Foto del documento (frente)" mode="post" onPicked={setFoto} />
        {foto && <img src={foto} alt="Vista previa del documento" className={styles.preview} />}
        {errors.foto && <p className={styles.error}>{errors.foto}</p>}
      </div>
      <StepActions onSkip={onSkip} busy={busy} />
    </form>
  )
}

/**
 * Paso con código de 6 dígitos (celular o correo): el código se muestra en pantalla porque es una demo.
 * `destino` es a dónde se "envió" el código: si cambia, ese código deja de servir.
 */
function CodeStep({
  titulo,
  intro,
  medio,
  destino,
  campos,
  validar,
  verificar,
  onDone,
  onSkip,
}: {
  titulo: string
  intro: string
  medio: 'SMS' | 'correos'
  destino: string
  campos: (errors: Record<string, string>) => ReactNode
  validar: () => Record<string, string>
  verificar: () => Promise<unknown>
  onDone: () => Promise<void>
  onSkip: () => void
}) {
  const [enviado, setEnviado] = useState<{ codigo: string; destino: string } | null>(null)
  const [ingresado, setIngresado] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const codigo = enviado?.destino === destino ? enviado.codigo : null

  function enviar() {
    const errs = validar()
    setErrors(errs)
    if (Object.keys(errs).length === 0) setEnviado({ codigo: generateCode(), destino })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!codigo) return setErrors({ codigo: MSG.codigoPendiente })
    if (ingresado.trim() !== codigo) return setErrors({ codigo: MSG.codigo })
    setBusy(true)
    try {
      await verificar()
      await onDone()
    } catch (err) {
      setBusy(false)
      if (err instanceof ValidationError) setErrors(err.fieldErrors)
      else setError(errorMessage(err, 'No pudimos verificar. Intenta de nuevo.'))
    }
  }

  return (
    <form className={styles.step} onSubmit={onSubmit} noValidate>
      <h2>{titulo}</h2>
      {error && <Alert>{error}</Alert>}
      <p className={styles.muted}>{intro}</p>
      {campos(errors)}
      <Button variant="secondary" className={styles.send} onClick={enviar}>
        Enviar código
      </Button>
      {codigo && (
        <p className={styles.demo} role="status">
          Demo: no se envían {medio} reales. Tu código es <strong>{codigo}</strong>.
        </p>
      )}
      <TextField
        label="Código de 6 dígitos"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={ingresado}
        error={errors.codigo}
        onChange={(e) => setIngresado(e.target.value)}
      />
      <StepActions onSkip={onSkip} busy={busy} />
    </form>
  )
}

function CelularStep({ userId, onDone, onSkip }: StepProps) {
  const [codigoPais, setCodigoPais] = useState('+51')
  const [numero, setNumero] = useState('')
  return (
    <CodeStep
      titulo="Celular"
      intro="Te enviamos un código para confirmar que el número es tuyo."
      medio="SMS"
      destino={`${codigoPais} ${numero}`}
      validar={() => validateCelular({ codigoPais, numero })}
      verificar={() => verifyCelular(userId, { codigoPais, numero })}
      onDone={onDone}
      onSkip={onSkip}
      campos={(errors) => (
        <div className={styles.phone}>
          <SelectField label="Código de país" value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)}>
            {CODIGOS_PAIS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Número de celular"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={numero}
            error={errors.numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
      )}
    />
  )
}

function UniversidadStep({ userId, onDone, onSkip }: StepProps) {
  const [universidad, setUniversidad] = useState('')
  const [correo, setCorreo] = useState('')
  return (
    <CodeStep
      titulo="Universidad"
      intro="Confirma que estudias ahí con tu correo institucional. Tu universidad se mostrará en tu perfil."
      medio="correos"
      destino={correo}
      validar={() => validateUniversidad({ universidad, correo })}
      verificar={() => verifyUniversidad(userId, { universidad, correo })}
      onDone={onDone}
      onSkip={onSkip}
      campos={(errors) => (
        <>
          <TextField
            label="Universidad"
            placeholder="Universidad de Lima"
            value={universidad}
            error={errors.universidad}
            onChange={(e) => setUniversidad(e.target.value)}
          />
          <TextField
            label="Correo institucional"
            type="email"
            placeholder="tu.nombre@universidad.edu.pe"
            value={correo}
            error={errors.correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </>
      )}
    />
  )
}

export function VerifyPage() {
  const { user, refreshUser } = useAuth()
  // Los pasos pendientes se fijan al entrar: los ya verificados se saltan.
  const [pendientes] = useState<Paso[]>(() => PASOS.map((p) => p.key).filter((k) => !user?.verificacion[k]))
  const [indice, setIndice] = useState(0)

  if (!user) return null
  const actual = pendientes[indice]
  const siguiente = () => setIndice((i) => i + 1)
  const hecho = async () => {
    await refreshUser()
    siguiente()
  }
  const props = { userId: user.id, onDone: hecho, onSkip: siguiente }
  const verificados = PASOS.filter((p) => user.verificacion[p.key])

  return (
    <div className={styles.page}>
      <h1>Verifica tu cuenta</h1>
      <p className={styles.intro}>Así otros estudiantes saben que eres una persona real antes de compartir piso contigo.</p>

      <ol aria-label="Pasos" className={styles.steps}>
        {PASOS.map((p) => (
          <li
            key={p.key}
            aria-current={p.key === actual ? 'step' : undefined}
            className={`${styles.stepItem} ${user.verificacion[p.key] ? styles.stepDone : ''}`}
          >
            <span className={styles.bar} />
            {user.verificacion[p.key] && <Check size={14} aria-hidden="true" />}
            {p.titulo}
          </li>
        ))}
      </ol>

      {actual === 'dni' && <DniStep key="dni" {...props} />}
      {actual === 'celular' && <CelularStep key="celular" {...props} />}
      {actual === 'universidad' && <UniversidadStep key="universidad" {...props} />}

      {!actual && (
        <section className={styles.step}>
          <h2>Listo</h2>
          {verificados.length === 0 ? (
            <p className={styles.muted}>Todavía no verificaste nada. Puedes volver cuando quieras.</p>
          ) : (
            <ul className={styles.done}>
              {verificados.map((p) => (
                <li key={p.key}>
                  <Check size={16} aria-hidden="true" /> {p.titulo} verificado
                </li>
              ))}
            </ul>
          )}
          <Link to="/perfil" className={styles.back}>
            Volver a mi perfil
          </Link>
        </section>
      )}
    </div>
  )
}
