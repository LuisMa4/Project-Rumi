import '@testing-library/jest-dom/vitest'
import { webcrypto } from 'node:crypto'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no siempre expone crypto.subtle; lo tomamos de Node.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
}

// Con toda la suite en paralelo, 1 s de espera a veces no alcanza para que cargue una pantalla.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  localStorage.clear()
})
