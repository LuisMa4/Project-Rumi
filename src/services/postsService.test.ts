import { beforeEach, describe, expect, it } from 'vitest'
import { StorageFullError } from './errors'
import { PHOTO_BUDGET_BYTES } from './photoBudget'
import { create, list, listByAuthor, maxRentalPrice, searchRentals } from './postsService'
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
    ).rejects.toMatchObject({ fieldErrors: { precioMin: MSG.precio } })
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

const base = { texto: 'x', ciudad: 'Madrid', hashtags: [], fotos: [] }

describe('campos nuevos', () => {
  it('valida rango, personas, enlace, lugar y fotos', async () => {
    await expect(create('u-demo', { ...base, tipo: 'ofrezco-cuarto', precioMin: 600, precioMax: 500 })).rejects.toMatchObject({
      fieldErrors: { precioMin: MSG.precioRango },
    })
    await expect(create('u-demo', { ...base, tipo: 'busco-roomie', personas: 7 })).rejects.toMatchObject({
      fieldErrors: { personas: MSG.personas },
    })
    await expect(create('u-demo', { ...base, tipo: 'viaje', enlace: 'airbnb.com/x' })).rejects.toMatchObject({
      fieldErrors: { enlace: MSG.enlace },
    })
    await expect(create('u-demo', { ...base, tipo: 'lugar' })).rejects.toMatchObject({
      fieldErrors: { categoria: MSG.categoria, nombreLugar: MSG.requerido },
    })
    await expect(create('u-demo', { ...base, tipo: 'lugar', categoria: 'cafe', nombreLugar: 'a'.repeat(81) })).rejects.toMatchObject({
      fieldErrors: { nombreLugar: MSG.nombreLugar },
    })
    await expect(
      create('u-demo', { ...base, tipo: 'viaje', fotos: ['data:a', 'data:b', 'data:c', 'data:d', 'data:e'] }),
    ).rejects.toMatchObject({ fieldErrors: { fotos: MSG.fotosMax } })
  })

  it('descarta campos ajenos al tipo: lugar sin fechas ni precio; personas solo en busco-roomie', async () => {
    const p = await create('u-demo', {
      ...base,
      tipo: 'lugar',
      categoria: 'cafe',
      nombreLugar: 'Café X',
      fechaDesde: '2027-01-01',
      precioMin: 5,
      personas: 2,
      ubicacion: { lat: 1, lng: 2 },
    })
    expect(p.fechaDesde).toBeUndefined()
    expect(p.precioMin).toBeUndefined()
    expect(p.personas).toBeUndefined()
    expect(p.ubicacion).toEqual({ lat: 1, lng: 2 })
    const v = await create('u-demo', { ...base, tipo: 'viaje', ubicacion: { lat: 1, lng: 2 }, categoria: 'bar' })
    expect(v.ubicacion).toBeUndefined()
    expect(v.categoria).toBeUndefined()
  })

  it('precio y hasta son opcionales; hashtags se guardan deduplicados', async () => {
    const p = await create('u-demo', { ...base, tipo: 'busco-roomie', personas: 2, hashtags: ['Madrid', 'madrid', 'NoFumador'] })
    expect(p.precioMin).toBeUndefined()
    expect(p.fechaHasta).toBeUndefined()
    expect(p.personas).toBe(2)
    expect(p.hashtags).toEqual(['Madrid', 'NoFumador'])
  })

  it('busco-roomie usa 1 persona por defecto y guarda el enlace limpio', async () => {
    const p = await create('u-demo', { ...base, tipo: 'busco-roomie', enlace: ' https://airbnb.com/rooms/1 ' })
    expect(p.personas).toBe(1)
    expect(p.enlace).toBe('https://airbnb.com/rooms/1')
  })

  it('respeta el presupuesto de fotos', async () => {
    await expect(
      create('u-demo', { ...base, tipo: 'viaje', fotos: ['data:' + 'a'.repeat(PHOTO_BUDGET_BYTES)] }),
    ).rejects.toBeInstanceOf(StorageFullError)
    expect(await list()).toHaveLength(12)
  })
})

it('searchRentals por cruce de rangos y maxRentalPrice', async () => {
  expect((await searchRentals({})).length).toBe(3)
  expect((await searchRentals({ precioDesde: 480, precioHasta: 530 })).map((p) => p.zona).sort()).toEqual([
    'Gràcia',
    'Moncloa',
  ])
  expect(await searchRentals({ precioDesde: 610 })).toEqual([])
  expect(await maxRentalPrice()).toBe(600)
})
