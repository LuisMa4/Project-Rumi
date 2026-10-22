# Rumi: amigos, publicar y verificación — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el diseño aprobado: registro con usuario único, amigos con solicitudes y campana, fila de amigos en el inicio, página para publicar con hashtags y opciones avanzadas (fotos, enlace, mapa), tarjetas con fotos y "Ver más", filtro de precio por rango, perfil con fotos y verificación en 3 pasos, y chat con la caja fija.

**Architecture:** Igual que hoy: SPA React con `HashRouter`, datos en `localStorage` detrás de servicios asíncronos en `src/services/`. Se agregan `friendsService`, un presupuesto de fotos de 3 MB, utilidades puras (hashtags, máscaras, imágenes) y componentes de mapa con Leaflet, cargados de forma diferida y simulados en las pruebas.

**Tech Stack:** React 19, TypeScript strict, Vite 8, CSS Modules, react-router-dom 7, lucide-react, Vitest 5 + RTL + user-event, **leaflet + react-leaflet + @types/leaflet** (nuevas).

**Spec:** `docs/superpowers/specs/2026-10-21-rumi-amigos-publicar-verificacion-design.md` (modifica `2026-10-18-rumi-mvp-design.md`).

## Global Constraints

- **Se mantiene del spec original:** TypeScript strict, colores solo desde `src/styles/tokens.css`, textos en español en sentence case, `HashRouter`, `base: './'`, la UI nunca toca `localStorage` y los servicios nunca devuelven `passwordHash`.
- **Dependencias nuevas:** solo `leaflet`, `react-leaflet` y `@types/leaflet`.
- **Teselas del mapa:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, con atribución "© OpenStreetMap".
- **Usuario:** 3–20 caracteres de `a-z`, `0-9`, `.` y `_`; no empieza ni termina en `.`; se guarda sin `@` y en minúsculas.
- **Hashtags:** 2–30 caracteres de letras (incluidas tildes y ñ), números y `_`; máximo 10; sin duplicados (se comparan sin importar mayúsculas ni tildes); se guardan sin `#`.
- **Límites de publicación:**
  - texto: 1–500 caracteres;
  - nombre del lugar: 1–80;
  - personas: 1–6;
  - fotos: máximo 4.
- **Fotos:**
  - perfil: 256×256 recortada, calidad 0.8;
  - portada: 1200×400 recortada, calidad 0.75;
  - publicaciones: lado mayor 900 px, calidad 0.65;
  - presupuesto total de **3 MB** (suma de las longitudes de las data URLs).
- **Aceptación automática de amistad (demo):** entre 2000 y 4000 ms, solo si quien recibe es un usuario de ejemplo.
- **Datos de demo:** `SEED_VERSION = '3'`.
- **Commits:** en `main` local, con el trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push solo al final, después de la revisión.
- **Verificación de cada tarea:** `npm test`, `npm run lint` y `npx tsc -b` en verde.

## Review Focus

1. **Hashtags que solo difieren en tildes o mayúsculas** (`#Café` y `#cafe`) se tratan como el mismo: no se agrega el segundo → prueba en la Task 8.
2. **Usuario escrito con `@` o mayúsculas** (`@Alex.Romero`) en el registro y el login se normaliza: el registro detecta el duplicado y el login entra → prueba en la Task 3.
3. **Publicar con fotos que exceden el presupuesto:**
   - se ve el mensaje de espacio;
   - no se guarda nada;
   - el formulario conserva lo escrito.
   → prueba en la Task 11.
4. **Sin internet, el mapa no carga:**
   - la tarjeta expandida y la página de publicar no se rompen;
   - se muestra "No pudimos cargar el mapa";
   - "Abrir en Google Maps" sigue disponible.
   → prueba en la Task 10.
5. **Cuenta nueva sin destino:** su tarjeta y su resultado de búsqueda muestran `@usuario`, y su perfil muestra "Agrega tu destino" → pruebas en las Tasks 12 y 13.

---

### Task 1: Almacenamiento lleno y presupuesto de fotos

**Files:**
- Modify: `src/services/errors.ts`, `src/services/storage.ts`, `src/services/validation.ts` (solo `MSG`)
- Create: `src/services/photoBudget.ts`
- Test: `src/services/storage.test.ts`, `src/services/photoBudget.test.ts`

**Interfaces:**
- Produces:
  - `class StorageFullError extends Error { kind: 'fotos' | 'general' }`, con constructor `(kind = 'general')`.
  - `MSG.espacioFotos` = `'Ya no hay espacio en este navegador para más fotos. Usa menos fotos o imágenes más livianas'`.
  - `MSG.espacioGeneral` = `'No hay espacio en este navegador. Restablece los datos de demo desde tu perfil'`.
  - `storage.write` lanza `StorageFullError('general')` ante un error de cuota, sin pasar a memoria. Es error de cuota cuando `name` es `QuotaExceededError` o `NS_ERROR_DOM_QUOTA_REACHED`, o cuando `code` es 22 o 1014. Los demás errores siguen pasando a memoria.
  - `photoBudget.ts`:
    - `PHOTO_BUDGET_BYTES = 3 * 1024 * 1024`;
    - `photoBytesInUse(): number` suma la longitud de cada string que empieza con `data:` en `avatarUrl` y `portadaUrl` de los usuarios y en `fotos` de los posts;
    - `assertPhotoBudget(nuevas: string[], liberadas: string[] = []): void` lanza `StorageFullError('fotos')` si `enUso - liberadas + nuevas > PHOTO_BUDGET_BYTES`.

- [ ] **Step 1: Pruebas que fallan**

```ts
// storage.test.ts
it('un error de cuota lanza StorageFullError y no pasa a memoria', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
  expect(() => write('posts', [1])).toThrow(StorageFullError)
  vi.restoreAllMocks()
  write('posts', [2])
  expect(localStorage.getItem('rumi:posts')).toBe('[2]') // sigue usando localStorage
})
// photoBudget.test.ts  (beforeEach: await resetDemo())
it('cuenta solo data URLs', () => {
  setUsers(getUsers().map((u) => (u.id === 'u-demo' ? { ...u, avatarUrl: 'data:' + 'a'.repeat(95), portadaUrl: './demo/x.jpg' } : u)))
  expect(photoBytesInUse()).toBe(100)
})
it('rechaza lo que supera 3 MB y descuenta lo liberado', () => {
  const grande = 'data:' + 'a'.repeat(PHOTO_BUDGET_BYTES)
  expect(() => assertPhotoBudget([grande])).toThrow(StorageFullError)
  expect(() => assertPhotoBudget([grande], [grande])).not.toThrow()
})
```

- [ ] **Step 2: Correr y ver que fallan** — Run: `npx vitest run src/services/storage.test.ts src/services/photoBudget.test.ts` → Expected: FAIL (no existen `StorageFullError` ni `photoBudget`).
- [ ] **Step 3: Implementar** según las interfaces de arriba.
- [ ] **Step 4: Correr todo** — Run: `npm test` → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(storage): avisar cuando no hay espacio y presupuesto de fotos de 3 MB`

---

### Task 2: Modelo de datos y datos de demo v3

**Files:**
- Modify: `src/types.ts`, `src/services/db.ts`, `src/services/seed.ts`, `src/services/validation.ts`, `src/services/usersService.ts`, `src/services/postsService.ts`, `src/components/PostCard.tsx`, `src/components/ProfileForm.tsx`, `src/pages/ProfilePage.tsx`, `src/utils/format.ts`
- Create: `src/services/cities.ts`
- Test: `src/services/seed.test.ts`, `src/utils/format.test.ts`, `src/services/cities.test.ts`, y las pruebas existentes que dependían de `presupuesto` o `precio`

**Interfaces:**
- Produces:
  - Tipos de la §8 del spec, exactos: `User` (con `usuario`, opcionales, `avatarUrl`, `portadaUrl` y `verificacion`), `Post` (con `precioMin`, `precioMax`, `personas`, `categoria`, `nombreLugar`, `hashtags`, `enlace`, `fotos` y `ubicacion`), `FriendRequest`, `Conversation.leidoHasta` y `LugarCategoria`.
  - `type Relation = 'ninguna' | 'enviada' | 'recibida' | 'amigos'`.
  - `ConversationSummary` agrega `noLeidos: boolean`.
  - `db.ts`: `getFriendRequests(): FriendRequest[]` y `setFriendRequests(list)`, con la clave `friendRequests`.
  - `cities.ts`:
    - `CITY_COORDS` para Madrid, Barcelona, Lisboa, Buenos Aires, Ciudad de México, Santiago, Montreal y Lima;
    - `coordsForCity(ciudad: string): { lat: number; lng: number } | undefined`, que compara con `normalizeText`;
    - `DEFAULT_COORDS` = Madrid (40.4168, -3.7038).
  - `seed.ts`:
    - `SEED_VERSION = '3'`;
    - `SEED_USER_IDS: string[]`, con todos menos `u-demo`;
    - `isSeedUser(id): boolean`.
  - `format.ts`: `formatPriceRange(min?: number, max?: number, moneda = 'EUR'): string`.
- **Datos de demo (spec §9):**
  - usuarios `alex.romero`, `valeria.rios`, `mateo.fernandez`, `lucia.gomez`, `diego.paredes`, `sofia.castro`, `andres.molina`, `isabella.rojas` y `joaquin.herrera`;
  - universidad verificada en todos menos `u-demo` y `u-08`, cuyo campo `universidad` queda sin definir;
  - Alex con DNI y celular verificados; Valeria con los tres;
  - amistades aceptadas Alex↔Valeria, Alex↔Mateo y Alex↔Diego; pendientes Sofía→Alex y Andrés→Alex;
  - `leidoHasta` de `c-01` para Alex anterior al último mensaje de Valeria (queda sin leer); `c-02` leída;
  - publicaciones con rangos, `personas`, `categoria`/`nombreLugar`, `hashtags`, coordenadas y `fotos: []` (las coordenadas están en el spec).

- [ ] **Step 1: Pruebas que fallan**

```ts
// seed.test.ts
it('v3: usuarios con usuario único y universidad solo si está verificada', () => {
  const us = getUsers()
  expect(new Set(us.map((u) => u.usuario)).size).toBe(9)
  expect(us.find((u) => u.id === 'u-demo')).toMatchObject({ usuario: 'alex.romero', universidad: undefined })
  expect(us.every((u) => !u.universidad || u.verificacion.universidad)).toBe(true)
  expect(us.some((u) => 'presupuesto' in u)).toBe(false)
})
it('v3: amistades y solicitudes de la cuenta demo', () => {
  const fr = getFriendRequests()
  expect(fr.filter((r) => r.estado === 'aceptada')).toHaveLength(3)
  expect(fr.filter((r) => r.estado === 'pendiente' && r.para === 'u-demo').map((r) => r.de).sort()).toEqual(['u-05', 'u-06'])
})
it('v3: alquileres con rango y ubicación; lugares sin fechas', () => {
  const ps = getPosts()
  expect(ps.find((p) => p.zona === 'Moncloa')).toMatchObject({ precioMin: 450, precioMax: 500, ubicacion: { lat: 40.435, lng: -3.719 } })
  expect(ps.filter((p) => p.tipo === 'lugar').every((p) => !p.fechaDesde && p.categoria && p.nombreLugar)).toBe(true)
  expect(ps.every((p) => p.hashtags.length > 0 && Array.isArray(p.fotos))).toBe(true)
})
// format.test.ts
it('formatPriceRange', () => {
  expect(formatPriceRange(450, 500).replace(/\s/g, ' ')).toBe('450–500 € al mes')
  expect(formatPriceRange(450).replace(/\s/g, ' ')).toBe('desde 450 € al mes')
  expect(formatPriceRange(undefined, 500).replace(/\s/g, ' ')).toBe('hasta 500 € al mes')
  expect(formatPriceRange()).toBe('')
})
// cities.test.ts
it('coordsForCity ignora tildes y mayúsculas', () => {
  expect(coordsForCity('ciudad de mexico')).toEqual(CITY_COORDS['Ciudad de México'])
  expect(coordsForCity('Tokio')).toBeUndefined()
})
```

- [ ] **Step 2: Correr y ver que fallan** — Run: `npx vitest run src/services/seed.test.ts src/utils/format.test.ts src/services/cities.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implementar los tipos, `db`, `cities`, `seed` v3 y `formatPriceRange`.** Después, dejar compilando el resto con el **mínimo** de cambios:
  - `postsService.create`: `precio` pasa a `precioMin`/`precioMax` (la validación completa llega en la Task 8); `hashtags: []` y `fotos: []` por defecto.
  - `searchRentals`: provisoriamente con `precioMax` sobre `precioMin`.
  - Quitar `presupuesto` y `moneda` de `validation`, `usersService`, `ProfileForm` y `ProfilePage`.
  - `PostCard` muestra `formatPriceRange`.
  - `chatService.listConversations` devuelve `noLeidos: false` (se calcula en la Task 7), y las conversaciones nuevas nacen con `leidoHasta: {}`.
  - Usar `?? ''` donde se lean campos de destino que ahora son opcionales.
  - Actualizar las pruebas existentes que fijaban `precio` o `presupuesto`.
- [ ] **Step 4: Correr todo** — Run: `npm test && npx tsc -b && npm run lint` → Expected: todo en verde.
- [ ] **Step 5: Commit** — `feat: modelo de datos y demo v3 (usuario, verificación, amistades, publicaciones ricas)`

---

### Task 3: Cuentas con usuario único y confirmación de contraseña

**Files:**
- Modify: `src/services/validation.ts`, `src/services/authService.ts`, `src/context/useAuth.ts`, `src/context/AuthContext.tsx`, `src/pages/RegisterPage.tsx`, `src/pages/LoginPage.tsx`, `src/test/fixtures.ts`
- Test: `src/services/validation.test.ts`, `src/services/authService.test.ts`, `src/pages/RegisterPage.test.tsx`, `src/pages/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `User.usuario` (Task 2).
- Produces:
  - `type RegisterInput = { nombre: string; usuario: string; email: string; password: string; confirmPassword: string }`.
  - `normalizeUsername(s: string): string`: trim, quita los `@` iniciales y pasa a minúsculas.
  - `USERNAME_RE = /^(?!\.)[a-z0-9._]{3,20}(?<!\.)$/`.
  - Mensajes nuevos:
    - `MSG.usuario` = `'Usa de 3 a 20 letras minúsculas, números, punto o guion bajo'`
    - `MSG.usuarioDuplicado` = `'Ese nombre de usuario ya está en uso'`
    - `MSG.confirmar` = `'Las contraseñas no coinciden'`
    - `MSG.login` = `'Usuario, correo o contraseña incorrectos'`
  - `register(input: RegisterInput): Promise<PublicUser>` crea el usuario con `bio: ''`, `intereses: []` y `verificacion: {}`.
  - `login(identificador: string, password: string): Promise<PublicUser>`: si `identificador.trim()` contiene `@` en otra posición que no sea la primera, se trata como correo; si no, como usuario.
  - `useAuth().login(identificador, password)` cambia de nombre de parámetro, no de forma.
- **UI:**
  - Registro: Nombre completo, Nombre de usuario (placeholder `alex.romero`), Correo, Contraseña, Confirmar contraseña.
  - Login: "Usuario o correo" y Contraseña.

- [ ] **Step 1: Pruebas que fallan**

```ts
// authService.test.ts
it('registra con usuario normalizado y sin datos de destino', async () => {
  const u = await register({ ...nuevo(), usuario: '@Ana.Perez' })
  expect(u).toMatchObject({ usuario: 'ana.perez', ciudadDestino: undefined, verificacion: {} })
})
it('rechaza usuario duplicado sin importar mayúsculas ni @', async () => {
  await expect(register({ ...nuevo(), usuario: '@Alex.Romero' })).rejects.toMatchObject({ fieldErrors: { usuario: MSG.usuarioDuplicado } })
})
it('rechaza formato de usuario y contraseñas distintas', async () => {
  await expect(register({ ...nuevo(), usuario: 'a.', confirmPassword: 'otra-clave-1' }))
    .rejects.toMatchObject({ fieldErrors: { usuario: MSG.usuario, confirmPassword: MSG.confirmar } })
})
it('entra con usuario, @usuario o correo; error único', async () => {
  for (const id of ['alex.romero', '@Alex.Romero', DEMO_EMAIL]) expect((await login(id, DEMO_PASSWORD)).id).toBe('u-demo')
  await expect(login('nadie', DEMO_PASSWORD)).rejects.toThrow(MSG.login)
})
// RegisterPage.test.tsx
it('registra con los 5 campos y entra', async () => { /* llena Nombre completo, Nombre de usuario, Correo, Contraseña, Confirmar contraseña → heading 'Inicio' */ })
it('muestra "Las contraseñas no coinciden"', async () => { /* … → toHaveAccessibleDescription(MSG.confirmar) en 'Confirmar contraseña' */ })
// LoginPage.test.tsx
it('entra escribiendo el usuario', async () => { /* 'Usuario o correo' = 'alex.romero' → heading 'Inicio' */ })
```

`nuevo()` en `fixtures.ts` pasa a devolver `{ nombre: 'Ana Pérez', usuario: 'ana.perez', email: 'ana@mail.com', password: 'clave-segura-1', confirmPassword: 'clave-segura-1' }`.

- [ ] **Step 2: Correr y ver que fallan** — Run: `npx vitest run src/services/authService.test.ts src/pages/RegisterPage.test.tsx src/pages/LoginPage.test.tsx` → Expected: FAIL.
- [ ] **Step 3: Implementar** la validación, `authService`, el contexto y las dos páginas. Quitar del registro los campos de destino y fechas.
- [ ] **Step 4: Correr todo** — Run: `npm test && npx tsc -b && npm run lint` → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(cuentas): usuario único, confirmar contraseña y login con usuario o correo`

---

### Task 4: Servicio de amigos

**Files:**
- Create: `src/services/friendsService.ts`
- Test: `src/services/friendsService.test.ts`

**Interfaces:**
- Consumes: `getFriendRequests`/`setFriendRequests`, `isSeedUser`, `StorageFullError`.
- Produces:
  - `sendRequest(de: string, para: string): Promise<FriendRequest>`:
    - a uno mismo → `ValidationError({ amistad: 'No puedes agregarte a ti mismo' })`;
    - ya amigos → `ValidationError({ amistad: 'Ya son amigos' })`;
    - pendiente o rechazada de `de` a `para` → `ValidationError({ amistad: 'Ya enviaste una solicitud' })`;
    - pendiente de `para` a `de` → la acepta y la devuelve;
    - si no, crea una pendiente y, si `isSeedUser(para)`, programa `accept` entre 2000 y 4000 ms; ese timer ignora `StorageFullError` y que la solicitud ya no exista.
  - `accept(requestId: string, userId: string): Promise<void>` y `reject(requestId: string, userId: string)`: solo si `userId === para` y está pendiente; si no, `NotFoundError`.
  - `listIncoming(userId): Promise<{ request: FriendRequest; de: PublicUser }[]>`: pendientes, de la más reciente a la más antigua.
  - `listFriends(userId): Promise<PublicUser[]>`, por nombre.
  - `relation(a: string, b: string): Promise<Relation>`, según la tabla de la §4 del spec. Una rechazada enviada por `a` da `'enviada'` para `a` y `'ninguna'` para `b`.
  - `subscribe(userId: string, cb: () => void): () => void`: avisa a ambos involucrados en cada cambio.

- [ ] **Step 1: Pruebas que fallan** (`beforeEach: await resetDemo(); vi.useFakeTimers()`; `afterEach: vi.useRealTimers()`)

```ts
it('lista amigos y solicitudes de la demo', async () => {
  expect((await listFriends('u-demo')).map((u) => u.id)).toEqual(['u-04', 'u-02', 'u-01']) // Diego, Mateo, Valeria por nombre
  expect((await listIncoming('u-demo')).map((r) => r.de.id).sort()).toEqual(['u-05', 'u-06'])
})
it('relation en los cuatro estados', async () => {
  expect(await relation('u-demo', 'u-01')).toBe('amigos')
  expect(await relation('u-demo', 'u-05')).toBe('recibida')
  expect(await relation('u-05', 'u-demo')).toBe('enviada')
  expect(await relation('u-demo', 'u-07')).toBe('ninguna')
})
it('aceptar y rechazar solo quien recibe', async () => {
  const [r] = await listIncoming('u-demo')
  await expect(accept(r.request.id, 'u-07')).rejects.toBeInstanceOf(NotFoundError)
  await accept(r.request.id, 'u-demo')
  expect(await relation('u-demo', r.de.id)).toBe('amigos')
})
it('rechazada: quien envió sigue viendo enviada y no puede reenviar', async () => {
  const r = (await listIncoming('u-demo')).find((x) => x.de.id === 'u-05')!
  await reject(r.request.id, 'u-demo')
  expect(await relation('u-05', 'u-demo')).toBe('enviada')
  expect(await relation('u-demo', 'u-05')).toBe('ninguna')
  await expect(sendRequest('u-05', 'u-demo')).rejects.toMatchObject({ fieldErrors: { amistad: 'Ya enviaste una solicitud' } })
})
it('solicitud cruzada se acepta directo; a uno mismo y duplicada fallan', async () => {
  await sendRequest('u-demo', 'u-05')
  expect(await relation('u-demo', 'u-05')).toBe('amigos')
  await expect(sendRequest('u-demo', 'u-demo')).rejects.toBeInstanceOf(ValidationError)
})
it('un usuario de ejemplo acepta solo entre 2 y 4 s; una cuenta real no', async () => {
  const cb = vi.fn(); subscribe('u-demo', cb)
  await sendRequest('u-demo', 'u-07')
  await vi.advanceTimersByTimeAsync(1999); expect(await relation('u-demo', 'u-07')).toBe('enviada')
  await vi.advanceTimersByTimeAsync(2001); expect(await relation('u-demo', 'u-07')).toBe('amigos')
  expect(cb).toHaveBeenCalled()
  const ana = await register(nuevo()) // cuenta real
  await sendRequest('u-demo', ana.id); await vi.advanceTimersByTimeAsync(5000)
  expect(await relation('u-demo', ana.id)).toBe('enviada')
})
it('la aceptación automática ignora StorageFullError', async () => {
  await sendRequest('u-demo', 'u-07')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
  await expect(vi.advanceTimersByTimeAsync(4000)).resolves.not.toThrow()
})
```

- [ ] **Step 2: Correr y ver que fallan** — Run: `npx vitest run src/services/friendsService.test.ts` → Expected: FAIL.
- [ ] **Step 3: Implementar `friendsService.ts`.**
- [ ] **Step 4: Correr todo** — Run: `npm test` → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(amigos): solicitudes, aceptación automática de la demo y relación`

---

### Task 5: Buscar por usuario y botón de amistad

**Files:**
- Modify: `src/services/usersService.ts`, `src/pages/SearchPage.tsx` y `.module.css`, `src/components/UserCard.tsx` y `.module.css`, `src/components/Avatar.tsx`
- Create: `src/components/FriendButton.tsx` y `.module.css`
- Test: `src/services/usersService.test.ts`, `src/pages/SearchPage.test.tsx` (se reescribe)

**Interfaces:**
- Consumes: `friendsService.relation`, `sendRequest`, `accept`, `subscribe` y `listIncoming` (Task 4).
- Produces:
  - `searchByUsername(texto: string, currentUserId: string): Promise<PublicUser[]>`:
    - devuelve `[]` si el texto normalizado queda vacío;
    - compara con `includesNormalized(u.usuario, normalizeUsername(texto))`;
    - excluye al usuario actual y ordena por usuario.
    - Reemplaza a `search`; `UserSearchFilters` se elimina.
  - `Avatar({ id, nombre, size?, src? })`: con `src`, muestra `<img alt="">`; si no, iniciales.
  - `FriendButton({ otroId: string })`, con los estados de la tabla de la §4: "Agregar amigo", "Solicitud enviada" (deshabilitado), "Aceptar solicitud" y "Amigos ✓". Se actualiza con `subscribe`.
  - `UserCard({ user })`:
    - muestra avatar, nombre y `@usuario`;
    - muestra "ciudadDestino, paisDestino" solo si existe;
    - incluye "Ver perfil" y `FriendButton`.
  - `SearchPage`:
    - `<h1>Buscar</h1>`, un `TextField` "Nombre de usuario" (placeholder `@valeria`) y `<ul aria-label="Resultados">`;
    - con el campo vacío: "Escribe un nombre de usuario para buscar";
    - sin resultados: `EmptyState` "No encontramos a nadie con ese usuario".
    - Se quitan las pestañas y los alquileres.

- [ ] **Step 1: Pruebas que fallan**

```ts
// usersService.test.ts
it('busca por usuario parcial, con @ y sin tildes, excluyendo al actual', async () => {
  expect((await searchByUsername('@RIOS', 'u-demo')).map((u) => u.id)).toEqual(['u-01'])
  expect(await searchByUsername('  ', 'u-demo')).toEqual([])
  expect((await searchByUsername('alex', 'u-demo'))).toEqual([])
})
// SearchPage.test.tsx
it('pide escribir un usuario', async () => { /* /buscar → text 'Escribe un nombre de usuario para buscar' */ })
it('encuentra y muestra el botón según la relación', async () => {
  const { user } = await renderApp('/buscar', { session: 'demo' })
  await user.type(await screen.findByLabelText('Nombre de usuario'), 'a')
  const item = (name: string) => within(screen.getByRole('list', { name: 'Resultados' })).getByText(name).closest('li')!
  await waitFor(() => expect(within(item('Valeria Ríos')).getByRole('button', { name: 'Amigos ✓' })).toBeInTheDocument())
  expect(within(item('Sofía Castro')).getByRole('button', { name: 'Aceptar solicitud' })).toBeInTheDocument()
  await user.click(within(item('Isabella Rojas')).getByRole('button', { name: 'Agregar amigo' }))
  expect(await within(item('Isabella Rojas')).findByRole('button', { name: 'Solicitud enviada' })).toBeDisabled()
})
it('sin resultados', async () => { /* 'zzz' → 'No encontramos a nadie con ese usuario' */ })
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(buscar): buscar por nombre de usuario y botón de amistad`

---

### Task 6: Campana y página de solicitudes

**Files:**
- Create: `src/components/NotificationsBell.tsx` y `.module.css`, `src/pages/RequestsPage.tsx` y `.module.css`
- Modify: `src/App.tsx` (ruta `/solicitudes`), `src/components/AppLayout.tsx` (campana en la barra superior), `src/components/AppNav.tsx` (campana junto al logo en laptop)
- Test: `src/pages/RequestsPage.test.tsx`

**Interfaces:**
- Consumes: `listIncoming`, `accept`, `reject` y `subscribe` (Task 4).
- Produces:
  - `NotificationsBell()`: un enlace a `/solicitudes` con `aria-label` "Solicitudes de amistad (N)", o "Solicitudes de amistad" con 0. El contador visible se oculta en 0.
  - `RequestsPage`: `<h1>Solicitudes</h1>` y una lista con avatar, nombre, `@usuario` y los botones "Aceptar" y "Rechazar". Vacía: "No tienes solicitudes pendientes".

- [ ] **Step 1: Pruebas que fallan**

```tsx
it('la campana muestra 2 y lleva a solicitudes', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click((await screen.findAllByRole('link', { name: 'Solicitudes de amistad (2)' }))[0])
  expect(await screen.findByRole('heading', { name: 'Solicitudes' })).toBeInTheDocument()
})
it('aceptar y rechazar actualizan la lista y la campana', async () => {
  const { user } = await renderApp('/solicitudes', { session: 'demo' })
  const row = (await screen.findByText('Sofía Castro')).closest('li')!
  await user.click(within(row).getByRole('button', { name: 'Aceptar' }))
  await waitFor(() => expect(screen.queryByText('Sofía Castro')).toBeNull())
  expect(screen.getAllByRole('link', { name: 'Solicitudes de amistad (1)' }).length).toBeGreaterThan(0)
  await user.click(within(screen.getByText('Andrés Molina').closest('li')!).getByRole('button', { name: 'Rechazar' }))
  expect(await screen.findByText('No tienes solicitudes pendientes')).toBeInTheDocument()
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(amigos): campana de solicitudes y página para aceptar o rechazar`

---

### Task 7: Fila de amigos en el inicio y mensajes sin leer

**Files:**
- Modify: `src/services/chatService.ts`, `src/pages/HomePage.tsx` y `.module.css` (se quita `PostComposer` del inicio), `src/pages/MessagesPage.tsx` (no leídos en negrita)
- Create: `src/components/FriendsRow.tsx` y `.module.css`
- Test: `src/services/chatService.test.ts`, `src/pages/HomePage.test.tsx` (se quitan las pruebas del cuadro para publicar)

**Interfaces:**
- Consumes: `listFriends` y `subscribe` (Task 4), `useStartChat`.
- Produces:
  - `markRead(conversacionId: string, userId: string): Promise<void>`: pone `leidoHasta[userId]` = `enviadoEn` del último mensaje.
  - `listConversations(userId)` incluye `noLeidos`: `true` si el último mensaje es del otro y es posterior a `leidoHasta[userId]` (o no existe).
  - `unreadFrom(userId: string): Promise<Set<string>>`, con los ids de los otros con mensajes sin leer.
  - Las conversaciones nuevas nacen con `leidoHasta: {}`.
  - `FriendsRow()`:
    - una `<section aria-label="Amigos">` con `<h2>Amigos</h2>`;
    - un primer enlace "Agregar" a `/buscar`;
    - un botón por amigo, con `aria-label` = nombre más ", mensajes sin leer" si corresponde, y clase de anillo;
    - orden: por la conversación más reciente y luego por nombre;
    - sin amigos: "Agrega amigos para escribirles más rápido".

- [ ] **Step 1: Pruebas que fallan**

```ts
// chatService.test.ts
it('noLeidos y markRead', async () => {
  expect((await listConversations('u-demo')).find((c) => c.otro.id === 'u-01')!.noLeidos).toBe(true)
  expect([...(await unreadFrom('u-demo'))]).toEqual(['u-01'])
  await markRead('c-01', 'u-demo')
  expect((await unreadFrom('u-demo')).size).toBe(0)
})
```
```tsx
// HomePage.test.tsx
it('muestra la fila de amigos con el anillo de no leídos y sin cuadro para publicar', async () => {
  await renderApp('/', { session: 'demo' })
  const row = await screen.findByRole('region', { name: 'Amigos' })
  const names = within(row).getAllByRole('button').map((b) => b.getAttribute('aria-label'))
  expect(names).toEqual(['Valeria Ríos, mensajes sin leer', 'Diego Paredes', 'Mateo Fernández'])
  expect(within(row).getByRole('link', { name: 'Agregar' })).toHaveAttribute('href', '/buscar')
  expect(screen.queryByLabelText('Publicación')).toBeNull()
})
it('tocar un amigo abre el chat', async () => { /* click 'Mateo Fernández' → heading 'Mateo Fernández' */ })
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(inicio): fila de amigos con anillo de no leídos`

---

### Task 8: Hashtags y publicaciones con los campos nuevos

**Files:**
- Create: `src/utils/hashtags.ts`
- Modify: `src/services/postsService.ts`, `src/services/validation.ts` (`MSG`), `src/types.ts` (`NewPostInput`)
- Test: `src/utils/hashtags.test.ts`, `src/services/postsService.test.ts`

**Interfaces:**
- Produces, en `hashtags.ts`:
  - `hashtagFrom(texto: string): string`: quita los caracteres no válidos, pone mayúscula inicial a cada palabra y las une. Ejemplo: `'Ciudad de México'` → `'CiudadDeMéxico'`.
  - `hashtagKey(tag: string): string` = `normalizeText(tag)`.
  - `isValidHashtag(tag: string): boolean` con `/^[\p{L}\p{N}_]{2,30}$/u`.
  - `parseHashtagInput(raw: string): string`: quita los `#` y los espacios de los extremos.
  - `addHashtag(list: string[], tag: string): string[]` lanza `ValidationError({ hashtags: … })` si el formato es inválido (`MSG.hashtag`) o si ya hay 10 (`MSG.hashtagsMax`); devuelve la lista igual si es duplicado.
  - `TYPE_HASHTAG: Record<PostType, string>` = `BuscoRoomie`, `OfrezcoCuarto`, `LugarRecomendado`, `Viaje`.
  - `LUGAR_CATEGORIAS: Record<LugarCategoria, { label: string; hashtag?: string }>`, según la tabla del spec.
  - `SUGGESTED_HASHTAGS: Record<PostType, string[]>`, según la tabla del spec.
  - `buildAutoHashtags({ tipo, ciudad, zona?, categoria? }): string[]`: el tipo, la ciudad, la zona y la categoría, en ese orden, omitiendo vacíos e inválidos.
  - `MSG.hashtag` = `'Usa de 2 a 30 letras, números o _'` y `MSG.hashtagsMax` = `'Máximo 10 hashtags'`.
- Produces, en `postsService`:
  - `NewPostInput = { tipo; texto; ciudad; zona?; fechaDesde?; fechaHasta?; precioMin?; precioMax?; moneda?; personas?; categoria?; nombreLugar?; hashtags: string[]; enlace?; fotos: string[]; ubicacion? }`.
  - `create(autorId, input)` valida con la §5.1 del spec:
    - `MSG.precio`;
    - `MSG.precioRango` = `"El precio 'desde' no puede ser mayor que 'hasta'"`;
    - `MSG.personas` = `'Indica entre 1 y 6 personas'`;
    - `MSG.fechasPost`;
    - `MSG.enlace` = `'Ingresa un enlace que empiece con https://'`;
    - `MSG.categoria` = `'Elige qué tipo de lugar es'`;
    - `nombreLugar` requerido y de máximo 80 (`'El nombre puede tener hasta 80 caracteres'`);
    - más de 4 fotos → `'Puedes subir hasta 4 fotos'`;
    - hashtags deduplicados por `hashtagKey`, con máximo 10.
    Además:
    - Descarta los campos que no corresponden al tipo, según la tabla.
    - Llama a `assertPhotoBudget(input.fotos)` antes de guardar.
  - `searchRentals({ precioDesde?: number; precioHasta?: number }): Promise<PostWithAuthor[]>`: cruce de rangos. El rango de la publicación es `[min ?? max, max ?? min]`, y sin precio queda fuera si hay algún límite.
  - `maxRentalPrice(): Promise<number>`: el mayor `precioMax ?? precioMin` de los alquileres, redondeado a la centena siguiente (mínimo 100).

- [ ] **Step 1: Pruebas que fallan**

```ts
// hashtags.test.ts
it('hashtagFrom', () => { expect(hashtagFrom('Ciudad de México')).toBe('CiudadDeMéxico'); expect(hashtagFrom('busco roomie!')).toBe('BuscoRoomie') })
it('addHashtag deduplica sin importar tildes ni mayúsculas, valida y limita a 10', () => {
  expect(addHashtag(['Café'], '#cafe')).toEqual(['Café'])
  expect(() => addHashtag([], 'a')).toThrow(ValidationError)
  const diez = Array.from({ length: 10 }, (_, i) => `tag${i}`)
  expect(() => addHashtag(diez, 'otro')).toThrow(MSG.hashtagsMax)
})
it('buildAutoHashtags', () => {
  expect(buildAutoHashtags({ tipo: 'lugar', ciudad: 'Madrid', zona: 'Lavapiés', categoria: 'zona' })).toEqual(['LugarRecomendado', 'Madrid', 'Lavapiés', 'ZonaBonita'])
  expect(buildAutoHashtags({ tipo: 'lugar', ciudad: '', categoria: 'otro' })).toEqual(['LugarRecomendado'])
})
// postsService.test.ts
const base = { texto: 'x', ciudad: 'Madrid', hashtags: [], fotos: [] }
it('valida rango, personas, enlace, lugar y fotos', async () => {
  await expect(create('u-demo', { ...base, tipo: 'ofrezco-cuarto', precioMin: 600, precioMax: 500 })).rejects.toMatchObject({ fieldErrors: { precioMin: MSG.precioRango } })
  await expect(create('u-demo', { ...base, tipo: 'busco-roomie', personas: 7 })).rejects.toMatchObject({ fieldErrors: { personas: MSG.personas } })
  await expect(create('u-demo', { ...base, tipo: 'viaje', enlace: 'airbnb.com/x' })).rejects.toMatchObject({ fieldErrors: { enlace: MSG.enlace } })
  await expect(create('u-demo', { ...base, tipo: 'lugar' })).rejects.toMatchObject({ fieldErrors: { categoria: MSG.categoria, nombreLugar: MSG.requerido } })
  await expect(create('u-demo', { ...base, tipo: 'viaje', fotos: ['data:a', 'data:b', 'data:c', 'data:d', 'data:e'] })).rejects.toMatchObject({ fieldErrors: { fotos: 'Puedes subir hasta 4 fotos' } })
})
it('descarta campos ajenos al tipo: lugar sin fechas ni precio; personas solo en busco-roomie', async () => {
  const p = await create('u-demo', { ...base, tipo: 'lugar', categoria: 'cafe', nombreLugar: 'Café X', fechaDesde: '2027-01-01', precioMin: 5, personas: 2, ubicacion: { lat: 1, lng: 2 } })
  expect(p).toMatchObject({ fechaDesde: undefined, precioMin: undefined, personas: undefined, ubicacion: { lat: 1, lng: 2 } })
  const v = await create('u-demo', { ...base, tipo: 'viaje', ubicacion: { lat: 1, lng: 2 } })
  expect(v.ubicacion).toBeUndefined()
})
it('precio y hasta son opcionales; hashtags se guardan deduplicados', async () => {
  const p = await create('u-demo', { ...base, tipo: 'busco-roomie', personas: 2, hashtags: ['Madrid', 'madrid', 'NoFumador'] })
  expect(p).toMatchObject({ precioMin: undefined, fechaHasta: undefined, personas: 2, hashtags: ['Madrid', 'NoFumador'] })
})
it('respeta el presupuesto de fotos', async () => {
  await expect(create('u-demo', { ...base, tipo: 'viaje', fotos: ['data:' + 'a'.repeat(PHOTO_BUDGET_BYTES)] })).rejects.toBeInstanceOf(StorageFullError)
  expect((await list()).length).toBe(12)
})
it('searchRentals por cruce de rangos y maxRentalPrice', async () => {
  expect((await searchRentals({ precioDesde: 480, precioHasta: 530 })).map((p) => p.zona).sort()).toEqual(['Gràcia', 'Moncloa'])
  expect((await searchRentals({ precioDesde: 610 }))).toEqual([])
  expect(await maxRentalPrice()).toBe(600)
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(publicaciones): hashtags, campos por tipo, rangos de precio y validaciones`

---

### Task 9: Compresión de imágenes y fotos de perfil y portada

**Files:**
- Create: `src/utils/image.ts`, `src/components/PhotoPicker.tsx` y `.module.css`
- Modify: `src/services/usersService.ts`, `src/test/setup.ts`
- Test: `src/utils/image.test.ts`, `src/services/usersService.test.ts`, `src/components/PhotoPicker.test.tsx`

**Interfaces:**
- Produces, en `image.ts`:
  - `type ImageMode = 'avatar' | 'portada' | 'post'`.
  - `IMAGE_SIZES`:
    - `avatar`: `{ w: 256, h: 256, crop: true, q: 0.8 }`;
    - `portada`: `{ w: 1200, h: 400, crop: true, q: 0.75 }`;
    - `post`: `{ max: 900, q: 0.65 }`.
  - `targetSize(srcW, srcH, mode): { sx, sy, sw, sh, w, h }`: una función pura que se puede probar.
  - `compressImage(file: File, mode: ImageMode): Promise<string>`: usa `createImageBitmap` (o un `Image` desde un object URL) y `canvas.toDataURL('image/jpeg', q)`. Si el archivo no es `image/*` o falla, lanza `ValidationError({ imagen: MSG.imagen })`, con `MSG.imagen` = `'No pudimos leer esa imagen. Prueba con otra (JPG o PNG)'`.
  - En `setup.ts`: `vi.mock` global no; las pruebas de UI simulan `compressImage` con `vi.mock('../utils/image', …)` por archivo.
- Produces, en `usersService`:
  - `setAvatar(id: string, dataUrl: string): Promise<PublicUser>` y `setPortada(id, dataUrl)`. Llaman a `assertPhotoBudget([nueva], [anterior])` antes de guardar.
- Produces, `PhotoPicker({ label: string; mode: ImageMode; onPicked: (dataUrl: string) => void; multiple?: boolean })`:
  - un botón accesible por `label`, con un `<input type="file" accept="image/*">` oculto;
  - comprime y llama a `onPicked` por cada archivo;
  - muestra su error en `Alert`.

- [ ] **Step 1: Pruebas que fallan**

```ts
// image.test.ts
it('targetSize recorta al centro para avatar y portada, y escala post', () => {
  expect(targetSize(1000, 500, 'avatar')).toEqual({ sx: 250, sy: 0, sw: 500, sh: 500, w: 256, h: 256 })
  expect(targetSize(1800, 1200, 'portada')).toEqual({ sx: 0, sy: 300, sw: 1800, sh: 600, w: 1200, h: 400 })
  expect(targetSize(1800, 1200, 'post')).toEqual({ sx: 0, sy: 0, sw: 1800, sh: 1200, w: 900, h: 600 })
  expect(targetSize(600, 400, 'post')).toMatchObject({ w: 600, h: 400 }) // no agranda
})
it('rechaza archivos que no son imagen', async () => {
  await expect(compressImage(new File(['x'], 'a.txt', { type: 'text/plain' }), 'post')).rejects.toMatchObject({ fieldErrors: { imagen: MSG.imagen } })
})
// usersService.test.ts
it('setAvatar reemplaza y libera la anterior en el presupuesto', async () => {
  const mitad = 'data:' + 'a'.repeat(PHOTO_BUDGET_BYTES / 2)
  await setAvatar('u-demo', mitad); await setAvatar('u-demo', mitad) // no suma dos veces
  expect((await getById('u-demo')).avatarUrl).toBe(mitad)
  await expect(setPortada('u-demo', mitad + 'x'.repeat(PHOTO_BUDGET_BYTES))).rejects.toBeInstanceOf(StorageFullError)
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(fotos): compresión en el navegador y fotos de perfil y portada`

---

### Task 10: Mapas con Leaflet

**Files:**
- Install: `npm install leaflet react-leaflet` y `npm install -D @types/leaflet`
- Create:
  - `src/components/map/LeafletMap.tsx`: la única pieza que importa `leaflet`, `react-leaflet` y `leaflet/dist/leaflet.css`.
  - `src/components/map/MapView.tsx` y `src/components/map/MapPicker.tsx`: wrappers con `React.lazy`, `Suspense` y un error boundary.
  - `src/components/map/Map.module.css`.
- Test: `src/components/map/Map.test.tsx`

**Interfaces:**
- Produces:
  - `LeafletMap({ center: {lat,lng}; zoom: number; marker?: {lat,lng}; onPick?: (p: {lat,lng}) => void; height: number })`: export por defecto, para `lazy`. Usa las teselas OSM con su atribución.
  - **Ícono del marcador:** se usa `L.divIcon` con un pin hecho en CSS, para no depender de las imágenes del paquete, que con `base: './'` no cargan bien.
  - `MapView({ lat, lng, height = 200 })`:
    - un mapa de solo lectura;
    - debajo, el enlace "Abrir en Google Maps" (`https://www.google.com/maps?q=LAT,LNG`, `target="_blank"`, `rel="noopener noreferrer"`), que se muestra **siempre**, cargue o no el mapa;
    - fallback mientras carga: "Cargando mapa…"; si falla: "No pudimos cargar el mapa".
  - `MapPicker({ value?: {lat,lng}; onChange: (v?: {lat,lng}) => void; center: {lat,lng}; height = 240 })`: tocar pone o mueve el pin; el botón "Quitar ubicación" aparece si hay `value`.
  - **En pruebas:** las demás tareas simulan `./LeafletMap` con `vi.mock`, con un `<div data-testid="leaflet" />` y un botón "Elegir punto de prueba" que llama `onPick({ lat: 1, lng: 2 })`.

- [ ] **Step 1: Pruebas que fallan**

```tsx
vi.mock('./LeafletMap', () => ({ default: ({ onPick }: any) => <div data-testid="leaflet"><button onClick={() => onPick?.({ lat: 1, lng: 2 })}>Elegir punto de prueba</button></div> }))
it('MapView muestra el mapa y el enlace a Google Maps', async () => {
  render(<MapView lat={40.435} lng={-3.719} />)
  expect(await screen.findByTestId('leaflet')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute('href', 'https://www.google.com/maps?q=40.435,-3.719')
})
it('MapPicker elige y quita la ubicación', async () => {
  const onChange = vi.fn(); const { rerender } = render(<MapPicker center={DEFAULT_COORDS} onChange={onChange} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Elegir punto de prueba' }))
  expect(onChange).toHaveBeenCalledWith({ lat: 1, lng: 2 })
  rerender(<MapPicker center={DEFAULT_COORDS} value={{ lat: 1, lng: 2 }} onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: 'Quitar ubicación' }))
  expect(onChange).toHaveBeenLastCalledWith(undefined)
})
```
Y en un archivo aparte, `src/components/map/MapError.test.tsx`, con un mock que lanza al renderizar:
```tsx
it('si el mapa falla se ve el aviso y el enlace sigue', async () => {
  render(<MapView lat={1} lng={2} />)
  expect(await screen.findByText('No pudimos cargar el mapa')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Abrir en Google Maps' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Instalar las dependencias e implementar.**
- [ ] **Step 4: Correr todo, incluido el build** (para que Leaflet quede en un chunk aparte) → Expected: PASS; `npm run build` muestra un chunk separado para `LeafletMap`.
- [ ] **Step 5: Commit** — `feat(mapa): vista y selector de ubicación con Leaflet y OpenStreetMap`

---

### Task 11: Página para publicar

**Files:**
- Create: `src/pages/PublishPage.tsx` y `.module.css`, `src/components/HashtagEditor.tsx` y `.module.css`, `src/components/TypePicker.tsx` y `.module.css`
- Delete: `src/components/PostComposer.tsx` y `.module.css`
- Modify: `src/App.tsx` (ruta `/publicar`), `src/components/AppNav.tsx` (el + apunta a `/publicar`), `src/pages/HomePage.tsx` (se quita la lógica de `?publicar=1`)
- Test: `src/pages/PublishPage.test.tsx`

**Interfaces:**
- Consumes: `create`, `buildAutoHashtags`, `SUGGESTED_HASHTAGS`, `LUGAR_CATEGORIAS`, `addHashtag` (Task 8), `PhotoPicker` (Task 9), `MapPicker` y `coordsForCity` (Tasks 10 y 2).
- Produces:
  - `TYPE_INFO: Record<PostType, { descripcion: string; placeholder: string }>`, con los textos exactos de la tabla del spec, en `TypePicker.tsx`.
  - `TypePicker({ value, onChange })`: un `role="radiogroup"` con `aria-label` "Tipo de publicación" y cuatro `role="radio"`.
  - `HashtagEditor({ auto: string[]; extra: string[]; suggestions: string[]; onChange(extra: string[], removedAuto: string[]): void; removedAuto: string[] })`:
    - chips con "Quitar #X";
    - botones "+ X" para las sugerencias, que agregan o quitan;
    - un `TextField` "Agregar hashtag" que confirma con Enter, coma o espacio;
    - muestra los errores de `addHashtag`.
  - `PublishPage`:
    - `<h1>Nueva publicación</h1>`, `TypePicker` y la descripción del tipo;
    - los campos por tipo, con las etiquetas exactas de la tabla del spec;
    - `HashtagEditor`;
    - un `<details>` "Opciones avanzadas" con enlace, fotos (hasta 4, miniaturas con "Quitar foto N") y ubicación (solo `ofrezco-cuarto` y `lugar`);
    - los botones "Cancelar" (vuelve con `navigate(-1)`) y "Publicar";
    - al publicar, navega a `/`;
    - si `create` lanza `StorageFullError`, muestra `MSG.espacioFotos` en `Alert` y conserva el formulario.
  - **Hashtags automáticos:** se recalculan cuando cambian tipo, ciudad, zona o categoría. Un automático que quitaste vuelve a aparecer solo si cambia el campo que lo generó.

- [ ] **Step 1: Pruebas que fallan** (simulando `../utils/image` y `../components/map/LeafletMap`)

```tsx
it('el + de la navegación abre /publicar', async () => { /* click link 'Publicar' → heading 'Nueva publicación' */ })
it('cada tipo muestra su descripción y sus campos', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Lugar recomendado' }))
  expect(screen.getByText(/Recomienda un sitio que valga la pena/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Desde')).toBeNull(); expect(screen.getByLabelText('Nombre del lugar')).toBeInTheDocument()
  await user.click(screen.getByRole('radio', { name: 'Busco roomie' }))
  expect(screen.getByLabelText('¿A cuántas personas buscas?')).toHaveValue(1)
})
it('hashtags automáticos, sugeridos y escritos; quitar uno', async () => {
  const { user } = await renderApp('/publicar', { session: 'demo' })
  await user.click(await screen.findByRole('radio', { name: 'Ofrezco cuarto' }))
  await user.type(screen.getByLabelText('Ciudad'), 'Madrid')
  expect(screen.getByRole('button', { name: 'Quitar #OfrezcoCuarto' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Quitar #Madrid' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '+ Amoblado' }))
  await user.type(screen.getByLabelText('Agregar hashtag'), '#CercaDeLaUPC{Enter}')
  await user.type(screen.getByLabelText('Agregar hashtag'), 'cercadelaupc{Enter}') // duplicado: no se agrega
  expect(screen.getAllByRole('button', { name: /^Quitar #/ })).toHaveLength(4)
  await user.click(screen.getByRole('button', { name: 'Quitar #Madrid' }))
  expect(screen.queryByRole('button', { name: 'Quitar #Madrid' })).toBeNull()
})
it('publica con avanzadas y vuelve al inicio con la publicación arriba', async () => {
  /* tipo Ofrezco cuarto, Descripción, Ciudad, abrir 'Opciones avanzadas', Enlace del anuncio 'https://airbnb.com/rooms/1',
     subir 1 foto (mock de compressImage → 'data:image/jpeg;base64,AA'), 'Elegir punto de prueba', 'Publicar'
     → heading 'Inicio' y el primer article contiene el texto */
})
it('si las fotos no entran, avisa y conserva lo escrito', async () => {
  /* create lanza StorageFullError('fotos') (fotos gigantes desde el mock) → alert con MSG.espacioFotos; 'Descripción' conserva el texto */
})
it('valida precio desde > hasta y enlace', async () => { /* → descripciones accesibles MSG.precioRango y MSG.enlace */ })
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar** y borrar `PostComposer`.
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(publicar): página para publicar con tipos guiados, hashtags y opciones avanzadas`

---

### Task 12: Tarjeta con fotos y "Ver más", y filtro de precio

**Files:**
- Modify: `src/components/PostCard.tsx` y `.module.css`, `src/pages/HomePage.tsx`
- Create: `src/components/PhotoViewer.tsx` y `.module.css`, `src/components/PriceRangeFilter.tsx` y `.module.css`
- Test: `src/components/PostCard.test.tsx`, `src/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: `MapView` (Task 10), `formatPriceRange` (Task 2), `searchRentals` y `maxRentalPrice` (Task 8).
- Produces:
  - **`PostCard` plegada:**
    - autor con `Avatar src={autor.avatarUrl}`; el subtítulo es "universidad → ciudadDestino" si existen las dos, si no `@usuario`;
    - el texto recortado a 4 líneas con CSS, más un `data-clamped` medido;
    - "Busca N roomie(s)" en busco-roomie;
    - "nombreLugar · etiqueta de la categoría" en lugar;
    - el precio con `formatPriceRange`;
    - la franja de fotos: botones "Ver foto N de M";
    - los hashtags `#X`.
  - **"Ver más" / "Ver menos"** (`aria-expanded`) se muestra solo si hay fechas, enlace, ubicación o texto recortado (en jsdom: texto de más de 180 caracteres).
  - **Expandida:**
    - el texto completo y las fechas;
    - el enlace "Ver anuncio en {dominio}" (`target="_blank"`, `rel="noopener noreferrer"`);
    - `MapView` si hay ubicación.
  - `PhotoViewer({ fotos, inicio, onClose })`: un `role="dialog"` con `aria-label` "Fotos", y los botones "Cerrar", "Foto anterior" y "Foto siguiente". Escape cierra.
  - `PriceRangeFilter({ max: number; value: [number, number]; onChange })`: dos `input type="range"` ("Precio desde" y "Precio hasta", con pasos de 25) y el texto "Desde X € · Hasta Y €". Solo aparece con el chip "Ofrezco cuarto".
  - **HomePage:** con "Ofrezco cuarto" y un rango distinto de `[0, max]`, usa `searchRentals`; si no, `list({ tipo })`.

- [ ] **Step 1: Pruebas que fallan**

```tsx
// PostCard.test.tsx (render dentro de MemoryRouter + AuthProvider con sesión demo; LeafletMap simulado)
it('plegada muestra fotos, personas y precio; Ver más muestra enlace y mapa', async () => { /* post con fotos 2, enlace, ubicacion → 'Ver foto 1 de 2' visible; sin enlace visible; click 'Ver más' → link 'Ver anuncio en airbnb.com' y testid 'leaflet' */ })
it('sin nada extra no hay Ver más', async () => { /* post corto sin fechas/enlace/ubicación → queryByRole('button', {name:'Ver más'}) null */ })
it('autor sin destino muestra @usuario', async () => { /* autor recién registrado → '@ana.perez' */ })
it('el visor de fotos navega y cierra con Escape', async () => { /* click 'Ver foto 1 de 2' → dialog 'Fotos'; 'Foto siguiente'; Escape → sin dialog */ })
// HomePage.test.tsx
it('el rango de precio filtra alquileres', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Ofrezco cuarto' }))
  fireEvent.change(await screen.findByLabelText('Precio desde'), { target: { value: '550' } })
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2)) // Chamberí (600) y Gràcia (520–560)
  expect(screen.queryByText(/Moncloa, a 10 minutos/)).toBeNull()
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(publicaciones): fotos en la tarjeta, Ver más con enlace y mapa, y filtro de precio`

---

### Task 13: Perfil con fotos, insignias y destino opcional

**Files:**
- Modify: `src/pages/ProfilePage.tsx` y `.module.css`, `src/components/ProfileForm.tsx`, `src/services/validation.ts`, `src/services/usersService.ts`
- Test: `src/pages/ProfilePage.test.tsx`, `src/services/usersService.test.ts`

**Interfaces:**
- Consumes: `setAvatar`, `setPortada` y `PhotoPicker` (Task 9), `FriendButton` (Task 5).
- Produces:
  - `MSG.fechasPar` = `'Completa las dos fechas o ninguna'`: `update` lo lanza en `fechaSalida` si solo viene una de las dos, contando también lo ya guardado.
  - **Perfil:**
    - la portada es `portadaUrl` o la banda celeste; en tu perfil, `PhotoPicker` "Cambiar portada" (`mode="portada"`) y "Cambiar foto de perfil" (`mode="avatar"`);
    - debajo del nombre, `@usuario`;
    - insignias "✓ DNI", "✓ Celular" y "✓ Universidad"; en tu perfil, las faltantes como "Sin verificar: X";
    - tu perfil sin destino muestra "Agrega tu destino" (abre el formulario);
    - en tu perfil, el botón "Verificar cuenta (N de 3)", que es un enlace a `/verificar`, o el texto "Cuenta verificada" con los tres pasos hechos;
    - en el de otros, `FriendButton` y "Enviar mensaje";
    - con `StorageFullError`, `Alert` con el mensaje correspondiente al `kind`.
  - **`ProfileForm`:** sin presupuesto, moneda ni universidad. Campos: Nombre completo, País de origen, Ciudad destino, País destino, Fecha de llegada, Fecha de salida, Biografía, Intereses e Instagram.

- [ ] **Step 1: Pruebas que fallan**

```tsx
it('sube foto de perfil y portada', async () => { /* mock compressImage → 'data:image/jpeg;base64,AA'; upload en input de 'Cambiar foto de perfil' → img del avatar con src data:…; idem portada */ })
it('presupuesto de fotos excedido muestra el aviso', async () => { /* mock devuelve data gigante → alert MSG.espacioFotos */ })
it('insignias y botón de verificación', async () => {
  await renderApp('/perfil', { session: 'demo' })
  expect(await screen.findByText('@alex.romero')).toBeInTheDocument()
  expect(screen.getByText('✓ DNI')).toBeInTheDocument(); expect(screen.getByText('Sin verificar: Universidad')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Verificar cuenta (2 de 3)' })).toHaveAttribute('href', '/verificar')
  expect(screen.queryByText(/Presupuesto/)).toBeNull()
})
it('perfil de otro: botón de amistad y solo insignias verificadas', async () => { /* /perfil/u-07 → 'Agregar amigo'; sin 'Sin verificar' */ })
it('cuenta nueva sin destino muestra "Agrega tu destino"', async () => { /* registrar y ir a /perfil */ })
// usersService.test.ts
it('las fechas van juntas', async () => { /* cuenta nueva: update({ fechaLlegada: '2027-02-01' }) → fieldErrors.fechaSalida = MSG.fechasPar */ })
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(perfil): fotos de perfil y portada, insignias y destino opcional`

---

### Task 14: Verificación de cuenta en 3 pasos

**Files:**
- Create: `src/pages/VerifyPage.tsx` y `.module.css`, `src/utils/mask.ts`
- Modify: `src/services/usersService.ts`, `src/services/validation.ts`, `src/App.tsx` (ruta `/verificar`)
- Test: `src/utils/mask.test.ts`, `src/services/usersService.test.ts`, `src/pages/VerifyPage.test.tsx`

**Interfaces:**
- Produces, en `mask.ts`:
  - `maskPhone(codigoPais, numero)` → `'+51 ••• ••• 321'`;
  - `maskEmail('ana.perez@ulima.edu.pe')` → `'a•••@ulima.edu.pe'`;
  - `lastChars(s, 3)`.
- Produces, en `usersService`:
  - `verifyDni(id, { numero })`: valida `/^[A-Za-z0-9]{6,12}$/` (`MSG.documento` = `'Ingresa de 6 a 12 letras o números'`) y guarda `{ ultimos, verificadoEn }`.
  - `verifyCelular(id, { codigoPais, numero })`: valida `/^\d{6,12}$/` (`MSG.celular` = `'Ingresa un número de 6 a 12 dígitos'`) y guarda `{ enmascarado, verificadoEn }`.
  - `verifyUniversidad(id, { universidad, correo })`:
    - requiere la universidad y un correo válido;
    - rechaza los dominios de `PUBLIC_EMAIL_DOMAINS` = `['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com', 'icloud.com']` con `MSG.correoPersonal` = `'Usa el correo de tu universidad, no uno personal'`;
    - guarda `user.universidad` y `verificacion.universidad = { nombre, correoEnmascarado, verificadoEn }`.
  - `generateCode(): string`: 6 dígitos con `crypto.getRandomValues`. Solo lo usa la UI y vive en su estado.
- Produces, `VerifyPage`:
  - `<h1>Verifica tu cuenta</h1>` y la intro exacta del spec;
  - un indicador de pasos (`<ol aria-label="Pasos">`, con `aria-current="step"` en el actual) que salta los ya verificados;
  - **DNI:** "Número de DNI o pasaporte" y `PhotoPicker`-like "Foto del documento (frente)". La foto queda solo en el estado del componente y nunca se pasa al servicio; sin foto, `MSG.fotoDocumento` = `'Sube una foto del frente de tu documento'`.
  - **Celular:** "Código de país" (select), "Número de celular", "Enviar código", el texto "Demo: no se envían SMS reales. Tu código es NNNNNN.", "Código de 6 dígitos" y un error `MSG.codigo` = `'El código no es correcto'`.
  - **Universidad:** "Universidad", "Correo institucional", "Enviar código" (el texto demo dice "correos"), el código y "Verificar".
  - En cada paso: "Verificar" y "Omitir este paso".
  - **Pantalla final:** `<h2>Listo</h2>`, la lista de lo verificado y el enlace "Volver a mi perfil".

- [ ] **Step 1: Pruebas que fallan**

```ts
// mask.test.ts
it('enmascara', () => { expect(maskPhone('+51', '987654321')).toBe('+51 ••• ••• 321'); expect(maskEmail('ana.perez@ulima.edu.pe')).toBe('a•••@ulima.edu.pe') })
// usersService.test.ts
it('verifyDni guarda solo los últimos 3', async () => {
  await verifyDni('u-08', { numero: '45678912' })
  const raw = localStorage.getItem('rumi:users')!
  expect(raw).not.toContain('45678912'); expect((await getById('u-08')).verificacion.dni?.ultimos).toBe('912')
})
it('verifyUniversidad rechaza correos personales y guarda la universidad', async () => {
  await expect(verifyUniversidad('u-demo', { universidad: 'Universidad de Lima', correo: 'alex@gmail.com' })).rejects.toMatchObject({ fieldErrors: { correo: MSG.correoPersonal } })
  await verifyUniversidad('u-demo', { universidad: 'Universidad de Lima', correo: 'alex@aloe.ulima.edu.pe' })
  expect(await getById('u-demo')).toMatchObject({ universidad: 'Universidad de Lima', verificacion: { universidad: { correoEnmascarado: 'a•••@aloe.ulima.edu.pe' } } })
})
```
```tsx
// VerifyPage.test.tsx
it('para Alex empieza en Universidad y la verifica con el código mostrado', async () => {
  const { user } = await renderApp('/verificar', { session: 'demo' })
  expect(await screen.findByRole('heading', { name: 'Verifica tu cuenta' })).toBeInTheDocument()
  await user.type(screen.getByLabelText('Universidad'), 'Universidad de Lima')
  await user.type(screen.getByLabelText('Correo institucional'), 'alex@aloe.ulima.edu.pe')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  const code = screen.getByText(/Tu código es (\d{6})/).textContent!.match(/(\d{6})/)![1]
  await user.type(screen.getByLabelText('Código de 6 dígitos'), '000000')
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(screen.getByLabelText('Código de 6 dígitos')).toHaveAccessibleDescription(MSG.codigo)
  await user.clear(screen.getByLabelText('Código de 6 dígitos')); await user.type(screen.getByLabelText('Código de 6 dígitos'), code)
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
  expect(await screen.findByRole('heading', { name: 'Listo' })).toBeInTheDocument()
  expect(localStorage.getItem('rumi:users')).not.toContain(code)
})
it('se pueden omitir los tres pasos', async () => { /* cuenta nueva → 3 × 'Omitir este paso' → 'Listo' sin verificaciones */ })
it('DNI exige la foto y no la guarda', async () => { /* cuenta nueva: número sin foto → MSG.fotoDocumento; con foto (mock) → avanza; users no contiene 'data:image' */ })
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr todo** → Expected: PASS.
- [ ] **Step 5: Commit** — `feat(verificación): DNI, celular y universidad en 3 pasos que se pueden omitir`

---

### Task 15: Chat con la caja fija y marcar como leído

**Files:**
- Modify: `src/pages/ChatPage.tsx` y `.module.css`, `src/components/AppLayout.tsx` y `.module.css`
- Test: `src/pages/ChatPage.test.tsx`

**Interfaces:**
- Consumes: `markRead` (Task 7), `StorageFullError` (Task 1).
- Produces:
  - **`chatService`:** la respuesta automática ignora en silencio un `StorageFullError`.
  - **`AppLayout`:** el `<main>` recibe `data-fill` cuando la ruta es `/mensajes/:id`, con `useMatch('/mensajes/:id')`. En ese modo el padding inferior se ajusta y la página no tiene scroll.
  - **`ChatPage`:**
    - es un contenedor flex en columna con `height: calc(100dvh - var(--alto-topbar) - var(--alto-barra-inferior) - env(safe-area-inset-bottom) - 40px)` en el celular y `calc(100dvh - 80px)` desde 768 px (agregar `--alto-topbar: 56px` a los tokens);
    - el `<ol role="log">` lleva `overflow-y: auto; flex: 1`;
    - la caja va al final, **sin** `position: sticky`;
    - el scroll al último mensaje mueve la lista (`list.scrollTop = list.scrollHeight`), no la página;
    - llama a `markRead` al cargar y cada vez que llega un mensaje con la conversación abierta.

- [ ] **Step 1: Prueba que falla**

```tsx
it('abrir el chat marca como leído y el anillo desaparece del inicio', async () => {
  const { user } = await renderApp('/', { session: 'demo' })
  await user.click(await screen.findByRole('button', { name: 'Valeria Ríos, mensajes sin leer' }))
  await screen.findByRole('heading', { name: 'Valeria Ríos' })
  await user.click(screen.getAllByRole('link', { name: 'Inicio' })[0])
  expect(await screen.findByRole('button', { name: 'Valeria Ríos' })).toBeInTheDocument()
})
```

```ts
// chatService.test.ts
it('la respuesta automática ignora StorageFullError', async () => {
  vi.useFakeTimers(); await send('c-01', 'u-demo', 'hola')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError') })
  await expect(vi.advanceTimersByTimeAsync(2500)).resolves.not.toThrow()
  vi.restoreAllMocks(); vi.useRealTimers()
})
```

- [ ] **Step 2: Correr y ver que fallan** → Expected: FAIL.
- [ ] **Step 3: Implementar** el layout, `markRead` y la protección de la respuesta automática.
- [ ] **Step 4: Correr todo** → Expected: PASS. Se verifica a mano en la Task 16 que solo se mueve la lista y la caja queda fija.
- [ ] **Step 5: Commit** — `fix(chat): la caja para escribir queda fija y abrir un chat lo marca como leído`

---

### Task 16: README, verificación en el navegador y cierre

**Files:**
- Modify: `README.md` (registro con usuario, amigos, publicar, verificación, mapa con internet, presupuesto de fotos, `@alex.romero` como usuario demo)

- [ ] **Step 1: Actualizar el README.**
- [ ] **Step 2: Verificación completa** — Run: `npm run lint && npm test && npm run build` → Expected: todo en verde.
- [ ] **Step 3: Recorrido en el navegador** (`npm run preview`, a 375×812 y 1280×800):
  - registrar una cuenta con usuario;
  - aceptar y rechazar en la campana;
  - buscar `@isa` y agregarla; esperar la aceptación automática; verla en la fila;
  - abrir un chat desde la fila y comprobar que la caja queda fija con muchos mensajes y que el anillo desaparece;
  - publicar un "Ofrezco cuarto" con fotos, enlace y pin, y verlo en el inicio con fotos, "Ver más" y el mapa;
  - publicar un "Lugar recomendado" sin fechas;
  - filtrar por precio;
  - subir foto de perfil y portada;
  - verificar la universidad;
  - revisar la consola sin errores y la página sin scroll horizontal.
- [ ] **Step 4: Commit** — `docs: README con amigos, publicar y verificación`
- [ ] **Step 5:** Revisión final de toda la rama (executing-plans), correcciones y push a `main`.
