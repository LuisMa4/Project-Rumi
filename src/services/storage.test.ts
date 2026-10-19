import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetStorageForTests, clearAll, read, remove, write } from './storage'

describe('storage', () => {
  beforeEach(() => {
    __resetStorageForTests()
    vi.restoreAllMocks()
  })

  it('guarda y lee con prefijo rumi:', () => {
    write('posts', [1])
    expect(localStorage.getItem('rumi:posts')).toBe('[1]')
    expect(read('posts', [])).toEqual([1])
  })

  it('devuelve el fallback si la clave no existe', () => {
    expect(read('nada', 7)).toBe(7)
  })

  it('devuelve el fallback si el JSON está corrupto', () => {
    localStorage.setItem('rumi:users', '{oops')
    expect(read('users', [])).toEqual([])
  })

  it('usa memoria si localStorage lanza error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota')
    })
    write('session', 'u-1')
    expect(read('session', null)).toBe('u-1')
  })

  it('usa memoria si getItem lanza error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(read('session', 'sin sesión')).toBe('sin sesión')
    write('session', 'u-1')
    expect(read('session', null)).toBe('u-1')
  })

  it('al pasar a memoria a mitad de sesión conserva lo ya guardado', () => {
    write('users', [1])
    localStorage.setItem('otra-app', 'x')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota')
    })
    write('posts', [2])
    expect(read('users', [])).toEqual([1])
    expect(read('posts', [])).toEqual([2])
    expect(read('otra-app', null)).toBeNull()
  })

  it('si remove falla, pasa a memoria sin perder las demás claves', () => {
    write('users', [1])
    write('posts', [2])
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Bloqueado')
    })
    remove('posts')
    expect(read('users', [])).toEqual([1])
    expect(read('posts', null)).toBeNull()
  })

  it('clearAll solo borra claves rumi:', () => {
    localStorage.setItem('otra-app', 'x')
    write('users', [])
    clearAll()
    expect(localStorage.getItem('otra-app')).toBe('x')
    expect(localStorage.getItem('rumi:users')).toBeNull()
  })
})
