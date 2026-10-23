import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

// Se leen como texto (rutas desde la raíz del proyecto): en las pruebas, Vite no procesa el CSS.
const archivos = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.css'))
  .map((f) => `src/${f.replaceAll('\\', '/')}`)

/** Las declaraciones `propiedad: valor;` del archivo, en orden. */
function declaraciones(css: string): { prop: string; valor: string }[] {
  return [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => ({ prop: m[1], valor: m[2].trim() }))
}

it('el layout ocupa el alto visible del celular (dvh), con respaldo en vh', () => {
  const shell = readFileSync('src/components/AppLayout.module.css', 'utf8').match(/\.shell\s*\{([^}]*)\}/)![1]
  expect(declaraciones(shell)).toEqual([
    { prop: 'min-height', valor: '100vh' },
    { prop: 'min-height', valor: '100dvh' },
  ])
})

// Los navegadores sin dvh ignoran la declaración; sin respaldo, el alto quedaría sin límite.
it('cada alto en dvh tiene justo antes un respaldo en vh', () => {
  const sinRespaldo: string[] = []
  for (const archivo of archivos) {
    const ds = declaraciones(readFileSync(archivo, 'utf8'))
    ds.forEach((d, i) => {
      if (!d.valor.includes('dvh')) return
      const previa = ds[i - 1]
      const ok = previa?.prop === d.prop && /\dvh/.test(previa.valor) && !previa.valor.includes('dvh')
      if (!ok) sinRespaldo.push(`${archivo}: ${d.prop}: ${d.valor}`)
    })
  }
  expect(sinRespaldo).toEqual([])
})
