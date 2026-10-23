import { beforeEach, expect, it } from 'vitest'
import { nuevo } from '../test/fixtures'
import { register } from './authService'
import { getConversations, getFriendRequests, getPosts, getSession, getUsers } from './db'
import { ensureSeeded, resetDemo } from './seed'
import { write } from './storage'

beforeEach(async () => {
  await resetDemo()
})

it('carga 9 usuarios, 12 publicaciones y 2 conversaciones', () => {
  expect(getUsers()).toHaveLength(9)
  expect(getPosts()).toHaveLength(12)
  expect(getConversations()).toHaveLength(2)
})

it('ensureSeeded no pisa datos existentes', async () => {
  await register(nuevo())
  await ensureSeeded()
  expect(getUsers()).toHaveLength(10)
})

it('resetDemo vuelve al estado inicial', async () => {
  await register(nuevo())
  await resetDemo()
  expect(getUsers()).toHaveLength(9)
  expect(getSession()).toBeNull()
})

it('las publicaciones de ejemplo tienen 3 de cada tipo y ninguna de la cuenta demo', () => {
  const posts = getPosts()
  for (const tipo of ['busco-roomie', 'ofrezco-cuarto', 'lugar', 'viaje']) {
    expect(posts.filter((p) => p.tipo === tipo)).toHaveLength(3)
  }
  expect(posts.some((p) => p.autorId === 'u-demo')).toBe(false)
})

it('v3: usuarios con usuario único y universidad solo si está verificada', () => {
  const us = getUsers()
  expect(new Set(us.map((u) => u.usuario)).size).toBe(9)
  const alex = us.find((u) => u.id === 'u-demo')!
  expect(alex.usuario).toBe('alex.romero')
  expect(alex.universidad).toBeUndefined()
  expect(us.every((u) => !u.universidad || u.verificacion.universidad)).toBe(true)
  expect(us.some((u) => 'presupuesto' in u)).toBe(false)
})

it('v3: amistades y solicitudes de la cuenta demo', () => {
  const fr = getFriendRequests()
  expect(fr.filter((r) => r.estado === 'aceptada')).toHaveLength(3)
  expect(
    fr
      .filter((r) => r.estado === 'pendiente' && r.para === 'u-demo')
      .map((r) => r.de)
      .sort(),
  ).toEqual(['u-05', 'u-06'])
})

it('v3: alquileres con rango y ubicación; lugares sin fechas', () => {
  const ps = getPosts()
  expect(ps.find((p) => p.zona === 'Moncloa')).toMatchObject({
    precioMin: 450,
    precioMax: 500,
    ubicacion: { lat: 40.435, lng: -3.719 },
  })
  expect(ps.filter((p) => p.tipo === 'lugar').every((p) => !p.fechaDesde && p.categoria && p.nombreLugar)).toBe(true)
  expect(ps.every((p) => p.hashtags.length > 0 && Array.isArray(p.fotos))).toBe(true)
})

it('v4: Chamberí tiene precio fijo de 600 EUR', () => {
  expect(getPosts().find((p) => p.zona === 'Chamberí')).toMatchObject({ precioMin: 600, precioMax: 600, moneda: 'EUR' })
})

it('v4: los navegadores con datos de la v3 se reinician solos', async () => {
  await register(nuevo())
  write('version', '3')
  await ensureSeeded()
  expect(getUsers()).toHaveLength(9)
})

it('v3: la conversación con Valeria queda sin leer para la cuenta demo', () => {
  const c01 = getConversations().find((c) => c.id === 'c-01')!
  expect(c01.leidoHasta['u-demo'] < c01.actualizadoEn).toBe(true)
})
