import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it } from 'vitest'
import { PhotoViewer } from './PhotoViewer'

const FOTOS = ['data:image/jpeg;base64,AA', 'data:image/jpeg;base64,BB']

function ConMiniatura() {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Miniatura
      </button>
      {abierto && <PhotoViewer fotos={FOTOS} inicio={0} onClose={() => setAbierto(false)} />}
    </>
  )
}

it('el foco no sale del visor: Tab da la vuelta entre sus botones', async () => {
  const user = userEvent.setup()
  render(
    <>
      <PhotoViewer fotos={FOTOS} inicio={0} onClose={() => {}} />
      <button type="button">Fuera del visor</button>
    </>,
  )
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Foto anterior' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Foto siguiente' })).toHaveFocus()
  await user.tab()
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  await user.tab({ shift: true })
  expect(screen.getByRole('button', { name: 'Foto siguiente' })).toHaveFocus()
})

it('al cerrar, el foco vuelve a la miniatura que lo abrió', async () => {
  const user = userEvent.setup()
  render(<ConMiniatura />)
  await user.click(screen.getByRole('button', { name: 'Miniatura' }))
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByRole('button', { name: 'Miniatura' })).toHaveFocus()
})

it('si el padre se vuelve a dibujar, el foco se queda donde estaba', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<PhotoViewer fotos={FOTOS} inicio={0} onClose={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Foto siguiente' }))
  rerender(<PhotoViewer fotos={FOTOS} inicio={0} onClose={() => {}} />)
  expect(screen.getByRole('button', { name: 'Foto siguiente' })).toHaveFocus()
  expect(screen.getByRole('img')).toHaveAttribute('src', FOTOS[1])
})
