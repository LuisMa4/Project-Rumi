import type { ComponentPropsWithRef } from 'react'
import styles from './Button.module.css'

type Props = ComponentPropsWithRef<'button'> & { variant?: 'primary' | 'secondary' | 'ghost' }

export function Button({ variant = 'primary', className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`}
      {...rest}
    />
  )
}
