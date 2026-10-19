import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  error?: string
  hint?: string
}

function useFieldIds(id?: string) {
  const auto = useId()
  const fieldId = id ?? auto
  return { fieldId, errorId: `${fieldId}-error`, hintId: `${fieldId}-hint` }
}

function Shell({
  label,
  error,
  hint,
  ids,
  children,
}: FieldProps & { ids: ReturnType<typeof useFieldIds>; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={ids.fieldId} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={ids.errorId} className={styles.error}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={ids.hintId} className={styles.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** Atributos de accesibilidad: el error (o la ayuda) describe el campo. */
function a11y(ids: ReturnType<typeof useFieldIds>, error?: string, hint?: string) {
  return {
    id: ids.fieldId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? ids.errorId : hint ? ids.hintId : undefined,
  }
}

export function TextField({ label, error, hint, id, className, ...rest }: FieldProps & ComponentPropsWithRef<'input'>) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} error={error} hint={hint} ids={ids}>
      <input className={`${styles.control} ${className ?? ''}`} {...a11y(ids, error, hint)} {...rest} />
    </Shell>
  )
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: FieldProps & ComponentPropsWithRef<'textarea'>) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} error={error} hint={hint} ids={ids}>
      <textarea
        className={`${styles.control} ${styles.area} ${className ?? ''}`}
        {...a11y(ids, error, hint)}
        {...rest}
      />
    </Shell>
  )
}

export function SelectField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: FieldProps & ComponentPropsWithRef<'select'>) {
  const ids = useFieldIds(id)
  return (
    <Shell label={label} error={error} hint={hint} ids={ids}>
      <select className={`${styles.control} ${className ?? ''}`} {...a11y(ids, error, hint)} {...rest} />
    </Shell>
  )
}
