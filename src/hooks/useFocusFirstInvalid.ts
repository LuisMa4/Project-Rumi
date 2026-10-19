import { useEffect, type RefObject } from 'react'

/**
 * Tras un envío con errores, lleva el foco al primer campo inválido:
 * así el lector de pantalla lee su error y el teclado queda donde hay que corregir.
 */
export function useFocusFirstInvalid(
  formRef: RefObject<HTMLFormElement | null>,
  errors: Record<string, string>,
): void {
  useEffect(() => {
    if (Object.keys(errors).length === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [formRef, errors])
}
