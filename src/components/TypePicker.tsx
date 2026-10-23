import { POST_TYPE_LABELS, type PostType } from '../types'
import { POST_TYPES } from '../utils/postTypes'
import { radioGroup } from '../utils/radioGroup'
import styles from './TypePicker.module.css'

export function TypePicker({ value, onChange }: { value: PostType; onChange: (t: PostType) => void }) {
  const grupo = radioGroup(POST_TYPES, value, onChange)
  return (
    <div role="radiogroup" aria-label="Tipo de publicación" className={styles.grid} onKeyDown={grupo.onKeyDown}>
      {POST_TYPES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          tabIndex={grupo.tabIndex(t)}
          className={styles.option}
          onClick={() => onChange(t)}
        >
          {POST_TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  )
}
