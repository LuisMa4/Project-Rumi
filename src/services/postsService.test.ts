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
      create('u-demo', { tipo: 'ofrezco-cuarto', texto: 'x', ciudad: 'X', precioMin: 0 }),
    ).rejects.toMatchObject({ fieldErrors: { precio: MSG.precio } })
  })

  it('rechaza "Hasta" anterior a "Desde", pero acepta el mismo día', async () => {
    const base = { tipo: 'viaje', texto: 'x', ciudad: 'X' } as const
    await expect(
      create('u-demo', { ...base, fechaDesde: '2027-03-10', fechaHasta: '2027-03-09' }),
    ).rejects.toMatchObject({ fieldErrors: { fechaHasta: MSG.fechasPost } })
    const p = await create('u-demo', { ...base, fechaDesde: '2027-03-10', fechaHasta: '2027-03-10' })
    expect(p.fechaHasta).toBe('2027-03-10')
  })

  it('descarta precio y zona en tipos que no los usan', async () => {
    const p = await create('u-demo', { tipo: 'viaje', texto: 'x', ciudad: 'X', precioMin: 100, zona: 'Centro' })
    expect(p.precioMin).toBeUndefined()
    expect(p.zona).toBeUndefined()
  })

  it('usa EUR como moneda por defecto', async () => {
    const p = await create('u-demo', { tipo: 'ofrezco-cuarto', texto: 'x', ciudad: 'X', precioMin: 300 })
    expect(p.moneda).toBe('EUR')
  })
})

it('busca alquileres', async () => {
  expect(await searchRentals({})).toHaveLength(3)
  const r = await searchRentals({ ciudad: 'madrid', precioMax: 500 })
  expect(r.map((p) => p.precioMin)).toEqual([450])
})
