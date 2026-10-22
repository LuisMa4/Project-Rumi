import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ValidationError } from '../services/errors'
import { MSG } from '../services/validation'
import { PhotoPicker } from './PhotoPicker'

const compress = vi.hoisted(() => vi.fn())
vi.mock('../utils/image', () => ({ compressImage: compress }))

const archivo = (nombre = 'foto.jpg') => new File(['x'], nombre, { type: 'image/jpeg' })

it('comprime cada archivo y lo entrega', async () => {
  compress.mockResolvedValueOnce('data:image/jpeg;base64,AA').mockResolvedValueOnce('data:image/jpeg;base64,BB')
  const onPicked = vi.fn()
  render(<PhotoPicker label="Agregar fotos" mode="post" multiple onPicked={onPicked} />)
  await userEvent.upload(screen.getByLabelText('Agregar fotos'), [archivo('a.jpg'), archivo('b.jpg')])
  expect(compress).toHaveBeenCalledWith(expect.any(File), 'post')
  expect(onPicked.mock.calls.map((c) => c[0])).toEqual(['data:image/jpeg;base64,AA', 'data:image/jpeg;base64,BB'])
})

it('muestra el error si la imagen no se puede leer', async () => {
  compress.mockRejectedValueOnce(new ValidationError({ imagen: MSG.imagen }))
  render(<PhotoPicker label="Cambiar foto de perfil" mode="avatar" onPicked={vi.fn()} />)
  await userEvent.upload(screen.getByLabelText('Cambiar foto de perfil'), archivo())
  expect(await screen.findByRole('alert')).toHaveTextContent(MSG.imagen)
})
