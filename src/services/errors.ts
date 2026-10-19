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
