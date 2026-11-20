import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { COUNTRIES } from '../utils/countries'
import { Flag } from './Flag'

it('hay bandera para cada país de la lista', () => {
  for (const { nombre, code } of COUNTRIES) {
    const { container, unmount } = render(<Flag pais={nombre} />)
    expect(container.querySelector(`[data-pais="${code}"] svg`), nombre).not.toBeNull()
    unmount()
  }
})

it('no importa el paquete de banderas completo', () => {
  expect(readFileSync('src/components/Flag.tsx', 'utf8')).not.toMatch(/from 'country-flag-icons\/react\/3x2'/)
})
