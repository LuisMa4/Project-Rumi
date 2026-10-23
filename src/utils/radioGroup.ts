import type { KeyboardEvent } from 'react'

const PASOS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Teclado de un grupo role="radiogroup", como pide WAI-ARIA: solo la opción elegida
 * (o la primera, si no hay ninguna) entra con Tab, y las flechas eligen la anterior
 * o la siguiente, dando la vuelta. `onKeyDown` va en el grupo y `tabIndex` en cada opción.
 */
export function radioGroup<T>(options: readonly T[], value: T | undefined, onChange: (v: T) => void) {
  const elegida = value === undefined ? -1 : options.indexOf(value)
  return {
    tabIndex: (option: T) => (option === options[Math.max(elegida, 0)] ? 0 : -1),
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      const paso = PASOS[e.key]
      if (!paso) return
      e.preventDefault()
      const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')]
      const enfocada = radios.indexOf(document.activeElement as HTMLElement)
      // Si el foco está en el grupo mismo (por un error), se parte de la elegida.
      const desde = enfocada === -1 ? elegida : enfocada
      const i = desde === -1 ? (paso > 0 ? 0 : options.length - 1) : (desde + paso + options.length) % options.length
      onChange(options[i])
      radios[i]?.focus()
    },
  }
}
