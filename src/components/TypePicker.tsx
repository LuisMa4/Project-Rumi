import { POST_TYPE_LABELS, type PostType } from '../types'
import { POST_TYPES } from '../utils/postTypes'
import styles from './TypePicker.module.css'

export function TypePicker({ value, onChange }: { value: PostType; onChange: (t: PostType) => void }) {
  return (
    <div role="radiogroup" aria-label="Tipo de publicación" className={styles.grid}>
      {POST_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          className={styles.option}
          onClick={() => onChange(t)}
        >
          {POST_TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  )
}
