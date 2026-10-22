import { beforeEach, describe, expect, it } from 'vitest'
import { nuevo } from '../test/fixtures'
import { getCurrentUser, login, loginDemo, logout, register } from './authService'
import { getSession, getUsers, setSession } from './db'
import { AuthError } from './errors'
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER_ID, resetDemo } from './seed'
import { MSG } from './validation'

beforeEach(async () => {
  await resetDemo()
})

describe('register', () => {
  it('registra, abre sesión y no expone el hash', async () => {
    const u = await register({ ...nuevo(), email: '  Ana@Mail.COM ' })
    expect(u.email).toBe('ana@mail.com')
    expect(u).not.toHaveProperty('passwordHash')
    expect((await getCurrentUser())?.id).toBe(u.id)
    expect(getUsers().find((x) => x.id === u.id)!.passwordHash).not.toBe(nuevo().password)
  })

  it('rechaza correo repetido sin importar mayúsculas', async () => {
    await expect(register({ ...nuevo(), email: 'DEMO@rumi.app' })).rejects.toMatchObject({
      fieldErrors: { email: MSG.emailDuplicado },
    })
  })

  it('reporta todos los campos inválidos', async () => {
    await expect(
      register({ ...nuevo(), nombre: '', usuario: 'a.', password: 'corta', confirmPassword: 'otra' }),
    ).rejects.toMatchObject({
      fieldErrors: {
        nombre: MSG.requerido,
        usuario: MSG.usuario,
        password: MSG.password,
        confirmPassword: MSG.confirmar,
      },
    })
  })

  it('registra con usuario normalizado y sin datos de destino', async () => {
    const u = await register({ ...nuevo(), usuario: '@Ana.Perez' })
    expect(u).toMatchObject({ usuario: 'ana.perez', verificacion: {} })
    expect(u.ciudadDestino).toBeUndefined()
  })

  it('rechaza usuario duplicado sin importar mayúsculas ni @', async () => {
    await expect(register({ ...nuevo(), usuario: '@Alex.Romero' })).rejects.toMatchObject({
      fieldErrors: { usuario: MSG.usuarioDuplicado },
    })
  })

  it('rechaza formatos de usuario inválidos', async () => {
    for (const usuario of ['ab', '.ana', 'ana.', 'ana perez', 'añá', 'a'.repeat(21)]) {
      await expect(register({ ...nuevo(), usuario })).rejects.toMatchObject({ fieldErrors: { usuario: MSG.usuario } })
    }
  })
})

describe('login', () => {
  it('entra con usuario, @usuario o correo', async () => {
    for (const id of ['alex.romero', '@Alex.Romero', '  DEMO@rumi.app ']) {
      expect((await login(id, DEMO_PASSWORD)).id).toBe(DEMO_USER_ID)
    }
    await expect(login('nadie', DEMO_PASSWORD)).rejects.toThrow(MSG.login)
  })

  it('normaliza el correo', async () => {
    expect((await login('  DEMO@rumi.app ', DEMO_PASSWORD)).id).toBe(DEMO_USER_ID)
  })

  it('falla con el mismo mensaje para clave o correo malos', async () => {
    await expect(login(DEMO_EMAIL, 'incorrecta')).rejects.toThrow(MSG.login)
    await expect(login('nadie@mail.com', DEMO_PASSWORD)).rejects.toBeInstanceOf(AuthError)
  })

  it('loginDemo y logout', async () => {
    expect((await loginDemo()).nombre).toBe('Alex Romero')
    await logout()
    expect(await getCurrentUser()).toBeNull()
  })

  it('datos con forma inesperada no rompen la sesión', async () => {
    localStorage.setItem('rumi:users', '{}')
    localStorage.setItem('rumi:session', JSON.stringify(DEMO_USER_ID))
    expect(await getCurrentUser()).toBeNull()
    localStorage.setItem('rumi:users', 'null')
    expect(getUsers()).toEqual([])
    localStorage.setItem('rumi:session', '42')
    expect(getSession()).toBeNull()
  })

  it('una sesión de un usuario inexistente se descarta', async () => {
    setSession('u-borrado')
    expect(await getCurrentUser()).toBeNull()
    expect(getSession()).toBeNull()
  })
})
