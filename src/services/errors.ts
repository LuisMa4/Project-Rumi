export class ValidationError extends Error {
  fieldErrors: Record<string, string>

  constructor(fieldErrors: Record<string, string>) {
    super('Revisa los campos marcados')
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'No encontramos este perfil o conversación') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/** El navegador se quedó sin espacio ('general') o las fotos superan su presupuesto ('fotos'). */
export class StorageFullError extends Error {
  kind: 'fotos' | 'general'

  constructor(kind: 'fotos' | 'general' = 'general') {
    super(kind === 'fotos' ? 'Sin espacio para más fotos' : 'Sin espacio en el navegador')
    this.name = 'StorageFullError'
    this.kind = kind
  }
}
