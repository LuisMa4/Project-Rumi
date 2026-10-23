import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import type { PostType } from '../types'
import { TypePicker } from './TypePicker'

function Picker() {
  const [tipo, setTipo] = useState<PostType>('busco-roomie')
  return (
    <>
      <TypePicker value={tipo} onChange={setTipo} />
      <button type="button">Siguiente campo</button>
    </>
  )
}

const elegido = (name: string) => {
  const radio = screen.getByRole('radio', { name })
  expect(radio).toHaveFocus()
  expect(radio).toHaveAttribute('aria-checked', 'true')
}

it('las flechas eligen el tipo anterior o el siguiente, dando la vuelta', async () => {
  const user = userEvent.setup()
  render(<Picker />)
  await user.tab()
  elegido('Busco roomie')
  await user.keyboard('{ArrowRight}')
  elegido('Ofrezco cuarto')
  await user.keyboard('{ArrowDown}')
  elegido('Lugar recomendado')
  await user.keyboard('{ArrowUp}{ArrowLeft}')
  elegido('Busco roomie')
  await user.keyboard('{ArrowLeft}')
  elegido('Viaje')
})

it('solo el tipo elegido entra con Tab: el siguiente Tab sale del grupo', async () => {
  const user = userEvent.setup()
  render(<Picker />)
  await user.tab()
  await user.keyboard('{ArrowRight}')
  await user.tab()
  expect(screen.getByRole('button', { name: 'Siguiente campo' })).toHaveFocus()
  await user.tab({ shift: true })
  elegido('Ofrezco cuarto')
})
