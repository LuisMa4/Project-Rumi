import { beforeEach, describe, expect, it } from 'vitest'
import { create, list, listByAuthor, searchRentals } from './postsService'
import { resetDemo } from './seed'
import { MSG } from './validation'

beforeEach(async () => {
  await resetDemo()
})

describe('list', () => {
  it('lista de más reciente a más antigua con autor', async () => {
    const ps = await list()
    expect(ps).toHaveLength(12)
    expect([...ps].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))).toEqual(ps)
    expect(ps[0].autor.nombre).toBeTruthy()
    expect(ps[0].autor).not.toHaveProperty('passwordHash')
  })

  it('filtra por tipo', async () => {
    const ps = await list({ tipo: 'lugar' })
    expect(ps).toHaveLength(3)
    expect(ps.every((p) => p.tipo === 'lugar')).toBe(true)
  })

  it('lista por autor', async () => {
    const ps = await listByAuthor('u-02')
    expect(ps.length).toBeGreaterThan(0)
    expect(ps.every((p) => p.autorId === 'u-02')).toBe(true)
  })
})

describe('create', () => {
  it('crea y aparece primero', async () => {
    const p = await create('u-demo', { tipo: 'viaje', texto: '  Hola Lisboa  ', ciudad: 'Lisboa' })
    expect(p.texto).toBe('Hola Lisboa')
    expect(p.autor.id).toBe('u-demo')
    expect((await list())[0].id).toBe(p.id)
  })

  it('valida texto, ciudad y precio', async () => {
    await expect(create('u-demo', { tipo: 'viaje', texto: '   ', ciudad: '' })).rejects.toMatchObject({
      fieldErrors: { texto: MSG.postVacio, ciudad: MSG.requerido },
    })
    await expect(
      create('u-demo', { tipo: 'viaje', texto: 'a'.repeat(501), ciudad: 'X' }),
    ).rejects.toMatchObject({ fieldErrors: { texto: MSG.postLargo } })
    await expect(
      create('u-demo', { tipo: 'ofrezco-cuarto', texto: 'x', ciudad: 'X', precio: 0 }),
    ).rejects.toMatchObject({ fieldErrors: { precio: MSG.precio } })
  })

  it('descarta precio y zona en tipos que no los usan', async () => {
    const p = await create('u-demo', { tipo: 'lugar', texto: 'x', ciudad: 'X', precio: 100, zona: 'Centro' })
    expect(p.precio).toBeUndefined()
    expect(p.zona).toBeUndefined()
  })

  it('usa EUR como moneda por defecto', async () => {
    const p = await create('u-demo', { tipo: 'ofrezco-cuarto', texto: 'x', ciudad: 'X', precio: 300 })
    expect(p.moneda).toBe('EUR')
  })
})

it('busca alquileres', async () => {
  expect(await searchRentals({})).toHaveLength(3)
  const r = await searchRentals({ ciudad: 'madrid', precioMax: 500 })
  expect(r.map((p) => p.precio)).toEqual([450])
})
