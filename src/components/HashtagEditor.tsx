import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { ValidationError } from '../services/errors'
import { addHashtag, hashtagKey } from '../utils/hashtags'
import { TextField } from './Field'
import styles from './HashtagEditor.module.css'

/**
 * Chips de hashtags: `tags` es lo que se ve (automáticos + agregados).
 * `onAdd` y `onRemove` deciden cómo se guarda cada cambio.
 */
export function HashtagEditor({
  tags,
  suggestions,
  onAdd,
  onRemove,
}: {
  tags: string[]
  suggestions: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
}) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string>()
  const has = (tag: string) => tags.some((t) => hashtagKey(t) === hashtagKey(tag))

  function tryAdd(raw: string): boolean {
    try {
      const next = addHashtag(tags, raw)
      if (next !== tags) onAdd(next[next.length - 1])
      setError(undefined)
      return true
    } catch (e) {
      if (e instanceof ValidationError) setError(e.fieldErrors.hashtags)
      return false
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',' && e.key !== ' ') return
    e.preventDefault()
    if (texto.trim() === '') return
    if (tryAdd(texto)) setTexto('')
  }

  return (
    <div className={styles.editor}>
      {tags.length > 0 && (
        <ul className={styles.chips} aria-label="Hashtags">
          {tags.map((t) => (
            <li key={hashtagKey(t)}>
              <span className={styles.chip}>
                #{t}
                <button type="button" className={styles.remove} aria-label={`Quitar #${t}`} onClick={() => onRemove(t)}>
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.suggestions}>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={has(s)}
            className={styles.suggestion}
            onClick={() => (has(s) ? onRemove(tags.find((t) => hashtagKey(t) === hashtagKey(s))!) : tryAdd(s))}
          >
            + {s}
          </button>
        ))}
      </div>
      <TextField
        label="Agregar hashtag"
        placeholder="#CercaDeLaUniversidad"
        hint="Escribe uno y presiona Enter. Máximo 10."
        autoComplete="off"
        value={texto}
        error={error}
        onChange={(e) => {
          setTexto(e.target.value)
          setError(undefined)
        }}
        onKeyDown={onKeyDown}
      />
    </div>
  )
}
