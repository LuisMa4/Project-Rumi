import { X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { SelectField, TextAreaField, TextField } from '../components/Field'
import { HashtagEditor } from '../components/HashtagEditor'
import { MapPicker } from '../components/map/MapPicker'
import { PhotoPicker } from '../components/PhotoPicker'
import { TypePicker } from '../components/TypePicker'
import { useAuth } from '../context/useAuth'
import { useFocusFirstInvalid } from '../hooks/useFocusFirstInvalid'
import { coordsForCity, DEFAULT_COORDS } from '../services/cities'
import { ValidationError } from '../services/errors'
import { create } from '../services/postsService'
import type { LatLng, LugarCategoria, PostType } from '../types'
import { buildAutoHashtags, hashtagKey, LUGAR_CATEGORIAS, SUGGESTED_HASHTAGS } from '../utils/hashtags'
import { errorMessage } from '../utils/errorMessage'
import { TYPE_INFO } from '../utils/postTypes'
import styles from './PublishPage.module.css'

const MONEDAS = ['EUR', 'USD', 'PEN', 'ARS', 'MXN', 'CLP', 'COP', 'CAD']
const MAX_FOTOS = 4

/** Etiquetas que cambian según el tipo de publicación. */
const LABELS: Record<
  PostType,
  { texto: string; ciudad: string; zona?: string; precio?: string; desde?: string; hasta?: string; enlace: string }
> = {
  'busco-roomie': { texto: 'Descripción', ciudad: 'Ciudad', zona: 'Zona', precio: 'Presupuesto', desde: 'Llego', hasta: 'Hasta', enlace: 'Enlace' },
  'ofrezco-cuarto': {
    texto: 'Descripción',
    ciudad: 'Ciudad',
    zona: 'Zona',
    precio: 'Precio',
    desde: 'Disponible desde',
    hasta: 'Hasta',
    enlace: 'Enlace del anuncio',
  },
  lugar: { texto: '¿Por qué lo recomiendas?', ciudad: 'Ciudad', zona: 'Barrio', enlace: 'Web o Google Maps' },
  viaje: { texto: 'Descripción', ciudad: 'Destino', desde: 'Ida', hasta: 'Vuelta', enlace: 'Enlace' },
}

const EMPTY = {
  texto: '',
  ciudad: '',
  zona: '',
  nombreLugar: '',
  personas: '1',
  precioMin: '',
  precioMax: '',
  moneda: 'EUR',
  fechaDesde: '',
  fechaHasta: '',
  enlace: '',
}

const toNumber = (v: string) => (v.trim() === '' ? undefined : Number(v))

export function PublishPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tipo, setTipo] = useState<PostType>('busco-roomie')
  const [form, setForm] = useState(EMPTY)
  const [categoria, setCategoria] = useState<LugarCategoria>()
  const [fotos, setFotos] = useState<string[]>([])
  const [ubicacion, setUbicacion] = useState<LatLng>()
  const [extra, setExtra] = useState<string[]>([])
  const [removedAuto, setRemovedAuto] = useState<string[]>([])
  const [advanced, setAdvanced] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  useFocusFirstInvalid(formRef, errors)

  if (!user) return null
  const labels = LABELS[tipo]
  const usaUbicacion = tipo === 'ofrezco-cuarto' || tipo === 'lugar'

  // Hashtags: los automáticos (menos los que quitaste) y los agregados a mano.
  const auto = buildAutoHashtags({
    tipo,
    ciudad: form.ciudad,
    zona: labels.zona ? form.zona : undefined,
    categoria: tipo === 'lugar' ? categoria : undefined,
  }).filter((t) => !removedAuto.includes(hashtagKey(t)))
  const tags = [...auto, ...extra.filter((t) => !auto.some((a) => hashtagKey(a) === hashtagKey(t)))]

  const field = (key: keyof typeof EMPTY) => ({
    value: form[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  function removeTag(tag: string) {
    const key = hashtagKey(tag)
    if (extra.some((t) => hashtagKey(t) === key)) setExtra((xs) => xs.filter((t) => hashtagKey(t) !== key))
    else setRemovedAuto((rs) => [...rs, key])
  }

  function addTag(tag: string) {
    const key = hashtagKey(tag)
    setRemovedAuto((rs) => rs.filter((r) => r !== key))
    setExtra((xs) => [...xs, tag])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      await create(user.id, {
        tipo,
        texto: form.texto,
        ciudad: form.ciudad,
        zona: form.zona,
        nombreLugar: form.nombreLugar,
        categoria,
        personas: toNumber(form.personas),
        precioMin: toNumber(form.precioMin),
        precioMax: toNumber(form.precioMax),
        moneda: form.moneda,
        fechaDesde: form.fechaDesde || undefined,
        fechaHasta: form.fechaHasta || undefined,
        enlace: form.enlace,
        fotos,
        ubicacion,
        hashtags: tags,
      })
      navigate('/')
    } catch (err) {
      setBusy(false)
      if (err instanceof ValidationError) {
        setErrors(err.fieldErrors)
        if (err.fieldErrors.enlace || err.fieldErrors.fotos) setAdvanced(true)
      } else {
        setError(errorMessage(err, 'No pudimos publicar. Intenta de nuevo.'))
      }
    }
  }

  function cancelar() {
    if (location.key !== 'default') navigate(-1)
    else navigate('/')
  }

  return (
    <div className={styles.page}>
      <h1>Nueva publicación</h1>
      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-label="Nueva publicación">

        <TypePicker
          value={tipo}
          onChange={(t) => {
            setTipo(t)
            setErrors({})
          }}
        />
        <p className={styles.descripcion}>{TYPE_INFO[tipo].descripcion}</p>

        {tipo === 'lugar' && (
          <>
            <div
              role="radiogroup"
              aria-label="¿Qué tipo de lugar?"
              aria-invalid={errors.categoria ? true : undefined}
              aria-describedby={errors.categoria ? 'categoria-error' : undefined}
              tabIndex={-1}
              className={styles.section}
            >
              <span className={styles.label}>¿Qué tipo de lugar?</span>
              <div className={styles.chips}>
                {(Object.keys(LUGAR_CATEGORIAS) as LugarCategoria[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={categoria === c}
                    className={styles.chip}
                    onClick={() => setCategoria(c)}
                  >
                    {LUGAR_CATEGORIAS[c].label}
                  </button>
                ))}
              </div>
              {errors.categoria && (
                <p id="categoria-error" className={styles.error}>
                  {errors.categoria}
                </p>
              )}
            </div>
            <TextField label="Nombre del lugar" placeholder="Mercado de San Fernando" maxLength={80} {...field('nombreLugar')} />
          </>
        )}

        <TextAreaField
          label={labels.texto}
          placeholder={TYPE_INFO[tipo].placeholder}
          maxLength={500}
          {...field('texto')}
        />

        <div className={styles.row}>
          <TextField label={labels.ciudad} placeholder="Madrid" {...field('ciudad')} />
          {labels.zona && <TextField label={labels.zona} hint="Opcional" placeholder="Moncloa" {...field('zona')} />}
        </div>

        {tipo === 'busco-roomie' && (
          <TextField label="¿A cuántas personas buscas?" type="number" min={1} max={6} {...field('personas')} />
        )}

        {labels.precio && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{labels.precio} al mes (opcional)</legend>
            <div className={styles.row3}>
              <TextField label={`${labels.precio} desde`} type="number" min={1} inputMode="numeric" placeholder="450" {...field('precioMin')} />
              <TextField label={`${labels.precio} hasta`} type="number" min={1} inputMode="numeric" placeholder="500" {...field('precioMax')} />
              <SelectField label="Moneda" {...field('moneda')}>
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </SelectField>
            </div>
          </fieldset>
        )}

        {labels.desde && labels.hasta && (
          <div className={styles.row}>
            <TextField label={labels.desde} type="date" hint="Opcional" {...field('fechaDesde')} />
            <TextField label={labels.hasta} type="date" hint="Opcional" {...field('fechaHasta')} />
          </div>
        )}

        <section className={styles.section} aria-label="Hashtags">
          <span className={styles.label}>Hashtags</span>
          <HashtagEditor tags={tags} suggestions={SUGGESTED_HASHTAGS[tipo]} onAdd={addTag} onRemove={removeTag} />
        </section>

        <div className={styles.advanced}>
          <Button
            variant="ghost"
            className={styles.advancedToggle}
            aria-expanded={advanced}
            onClick={() => setAdvanced((a) => !a)}
          >
            Opciones avanzadas
          </Button>
          {advanced && (
            <div className={styles.advancedBody}>
              <TextField
                label={labels.enlace}
                type="url"
                placeholder="https://"
                hint={tipo === 'ofrezco-cuarto' ? 'Airbnb, Idealista, Booking…' : 'Opcional'}
                {...field('enlace')}
              />

              <div className={styles.section}>
                <span className={styles.label}>Fotos (hasta 4)</span>
                {fotos.length > 0 && (
                  <ul className={styles.thumbs}>
                    {fotos.map((f, i) => (
                      <li key={i}>
                        <img src={f} alt={`Foto ${i + 1}`} />
                        <button
                          type="button"
                          className={styles.removeThumb}
                          aria-label={`Quitar foto ${i + 1}`}
                          onClick={() => setFotos((fs) => fs.filter((_, j) => j !== i))}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {fotos.length < MAX_FOTOS && (
                  <PhotoPicker
                    label="Agregar fotos"
                    mode="post"
                    multiple
                    onPicked={(f) => setFotos((fs) => (fs.length < MAX_FOTOS ? [...fs, f] : fs))}
                  />
                )}
                {errors.fotos && <p className={styles.error}>{errors.fotos}</p>}
              </div>

              {usaUbicacion && (
                <div className={styles.section}>
                  <span className={styles.label}>Ubicación en el mapa</span>
                  <MapPicker value={ubicacion} onChange={setUbicacion} center={coordsForCity(form.ciudad) ?? DEFAULT_COORDS} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Junto al botón: en el celular, arriba del formulario quedaría fuera de la vista. */}
        {error && <Alert>{error}</Alert>}
        <div className={styles.footer}>
          <Button variant="ghost" onClick={cancelar} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            Publicar
          </Button>
        </div>
      </form>
    </div>
  )
}
