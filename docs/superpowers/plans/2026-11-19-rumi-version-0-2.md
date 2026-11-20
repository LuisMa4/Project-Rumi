# Rumi 0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paleta 6 p. m., bienvenida con postales, inicio con reacciones, asistente Gemini real vía Cloudflare Worker, búsqueda de lugares con mapa y perfil tipo pasaporte.

**Architecture:** La app sigue siendo React + Vite con datos en `localStorage` detrás de `src/services/`. Se suma `worker/` (Cloudflare Worker en TypeScript) que guarda la clave de Gemini y es la única pieza que habla con Google. La app llama al Worker por `VITE_AI_URL`.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest + Testing Library, CSS Modules, react-leaflet, lucide-react, Wrangler 4, Gemini 2.5 Flash, `country-flag-icons`.

**Spec:** `docs/superpowers/specs/2026-11-19-rumi-version-0-2-design.md`

## Global Constraints

- Español en código, UI, pruebas y commits; CSS Modules; ningún hex fuera de `src/styles/tokens.css`.
- Paleta de origen: azul `#8299C2`, naranja `#E99A59`, crema `#F3EBDD`, lavanda `#B5A9D0`.
- Texto y botones ≥ 4.5:1; bordes de campo y foco ≥ 3:1.
- `prefers-reduced-motion`: sin desplazamientos ni avance automático.
- La clave de Gemini nunca en el repo, `dist/`, `.env` ni pruebas. Secret del Worker: `GEMINI_API_KEY`.
- Orígenes permitidos del Worker: `https://luisma4.github.io`, `http://localhost:5173`, `http://localhost:4173`.
- Modelo: `gemini-2.5-flash`. Límites: cuerpo 100 KB, 20 mensajes, 200 publicaciones, 10 consultas/min por IP.
- A Gemini no van nombres ni usuarios de nadie.
- Ninguna prueba llama a la red.
- Cada tarea termina con `npm test`, `npm run lint` y `npm run build` en verde.

## Review Focus

1. Usuario que entra por primera vez con la cuenta demo en una prueba existente: el tutorial no debe tapar la pantalla en las pruebas viejas (`renderApp` marca el onboarding como visto salvo que se pida). → Task 5.
2. El Worker responde algo que no es JSON válido o sin `postIds`: la app muestra el texto si lo hay y ninguna tarjeta, sin romperse. → Task 8.
3. Gemini devuelve un id que no existe (o que existía y ya no): ni el Worker ni la app muestran esa tarjeta. → Tasks 7 y 8.
4. `paisOrigen` guardado con un texto que no está en la lista ("peru", "Perú ", "Narnia"): el perfil lo muestra sin bandera y el formulario no lo borra al guardar. → Task 2.
5. Ciudad en Lugares sin publicaciones o sin coordenadas: mensaje vacío claro, sin mapa roto. → Task 10.

---

### Task 1: Paleta 6 p. m.

**Files:**
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, todos los `*.module.css` que usan `--celeste*`
- Test: `src/styles/tokens.test.ts`

**Interfaces:**
- Produces tokens: `--azul`, `--azul-oscuro`, `--azul-suave`, `--naranja`, `--naranja-oscuro`, `--naranja-suave`, `--crema`, `--lavanda`, `--lavanda-oscuro`, `--lavanda-suave`, `--blanco`, `--tinta`, `--tinta-suave`, `--borde`, `--borde-campo`, más los que ya existen (`--verde-*`, `--error`, `--fondo-visor`, radios, fuentes, medidas). Se eliminan `--celeste`, `--celeste-suave` y `--celeste-tinta`.

- [ ] **Step 1: Pruebas de contraste** en `tokens.test.ts`: los valores de origen están tal cual (`azul` = `#8299c2`, `naranja` = `#e99a59`, `crema` = `#f3ebdd`, `lavanda` = `#b5a9d0`). `contrast(x, 'blanco') >= 4.5` y `contrast(x, 'crema') >= 4.5` para `naranja-oscuro`, `azul-oscuro`, `lavanda-oscuro`, `tinta` y `tinta-suave`. `contrast(borde-campo, blanco|crema) >= 3`. Se mantienen las pruebas existentes que sigan aplicando, cambiando `celeste-suave` por `crema`.
- [ ] **Step 2:** `npx vitest run src/styles/tokens.test.ts` → FALLA.
- [ ] **Step 3:** Reescribir `tokens.css` con la paleta. Los oscuros se eligen con la misma tonalidad, bajando la luminosidad hasta pasar la prueba. Reemplazar los usos: `--celeste-suave` → `--crema` (fondos de página) o `--azul-suave` (chips/etiquetas); `--celeste` → `--azul`; `--celeste-tinta` → `--azul-oscuro`. Fondo del `body` en `--crema`; tarjetas y campos en `--blanco`. Etiquetas de tipo de publicación: roomie → lavanda, cuarto → naranja, lugar → azul, viaje → crema con tinta azul oscuro. Logo: mismos colores, con los nombres nuevos.
- [ ] **Step 4:** `npm test && npm run lint && npm run build` → PASA, y `grep -r "celeste" src` no encuentra nada.
- [ ] **Step 5: Commit** `feat(marca): paleta 6 p. m.`

### Task 2: Perfil — pronombres, idiomas y país con bandera (datos y formulario)

**Files:**
- Create: `src/utils/countries.ts`, `src/utils/countries.test.ts`, `src/components/Flag.tsx`
- Modify: `src/types.ts` (`User`, `ProfileChanges`), `src/services/validation.ts`, `src/services/usersService.ts`, `src/components/ProfileForm.tsx`, `src/services/seed.ts`
- Test: `src/services/usersService.test.ts`, `src/services/validation.test.ts`

**Interfaces:**
- Produces: `User.pronombres?: string`, `User.idiomas?: string[]`; los dos en `ProfileChanges`.
- Produces: `COUNTRIES: { code: string; nombre: string }[]` (ISO alfa-2, nombre en español; al menos Latinoamérica, España, Portugal, Francia, Italia, Alemania, Reino Unido, Estados Unidos y Canadá) y `countryCode(nombre: string): string | undefined` (ignora mayúsculas, tildes y espacios).
- Produces: `<Flag pais={string} />`: dibuja el SVG de `country-flag-icons/react/3x2` con `aria-hidden`, o `null` si no hay código.
- Dependencia nueva: `country-flag-icons`.

- [ ] **Step 1: Pruebas.** `countryCode('Perú') === 'PE'`, `countryCode(' peru ') === 'PE'`, `countryCode('españa') === 'ES'`, `countryCode('Narnia') === undefined`. Validación: pronombres > 30 caracteres → error; más de 8 idiomas → error; idioma vacío o > 30 caracteres → error. `update(id, { pronombres: 'él', idiomas: ['Español', 'Inglés'] })` los guarda; `update` con `paisOrigen: 'Narnia'` lo guarda tal cual.
- [ ] **Step 2:** correr esas pruebas → FALLAN.
- [ ] **Step 3:** Implementar. En `ProfileForm`: "Pronombres" con `<datalist>` (él, ella, elle, él/elle, ella/elle); "Idiomas" con chips reutilizando el patrón de `HashtagEditor` o los intereses; "País de origen" con `<input list>` de `COUNTRIES`, que acepta texto libre. Semilla: pronombres, idiomas y país para todos los usuarios demo (Alex: "él", ["Español", "Inglés"]); `SEED_VERSION = '5'`.
- [ ] **Step 4:** `npm test && npm run lint && npm run build` → PASA.
- [ ] **Step 5: Commit** `feat(perfil): pronombres, idiomas y bandera del país`

### Task 3: Reacciones por tipo

**Files:**
- Create: `src/services/reactionsService.ts` (+ `.test.ts`), `src/utils/reactions.ts`, `src/components/ReactionBar.tsx` (+ `.module.css`, `.test.tsx`), `src/components/ReactionsDialog.tsx` (+ `.module.css`)
- Modify: `src/types.ts`, `src/services/db.ts`, `src/services/seed.ts`, `src/components/PostCard.tsx`

**Interfaces:**
- Produces: `type ReactionTipo = 'recomendar' | 'buen-lugar' | 'lo-conozco' | 'recomendado' | 'like' | 'me-encanta' | 'me-interesa'`; `interface Reaction { id; postId; userId; tipo: ReactionTipo; creadoEn }`.
- Produces: `REACTIONS_BY_POST_TYPE: Record<PostType, { tipo: ReactionTipo; label: string; icon: LucideIcon }[]>`, con la tabla de la sección 5 del spec: roomie → Recomendar/ThumbsUp; cuarto → Buen lugar/Home, Lo conozco/MapPinCheck, Recomendado/ThumbsUp; lugar → Like/Heart, Me encanta/Sparkles, Recomendar/ThumbsUp; viaje → Me interesa/Star, Recomendado/ThumbsUp.
- Produces: `toggle(postId, userId, tipo): Promise<boolean>` (true = quedó marcada; tipo inválido para ese post → `ValidationError`; post inexistente → `NotFoundError`); `summary(postId, userId): Promise<{ tipo; count; mine }[]>` en el orden de la tabla; `listUsers(postId): Promise<{ tipo; users: PublicUser[] }[]>`.
- `db.ts`: `getReactions` / `setReactions` (clave `reactions`).

- [ ] **Step 1: Pruebas del servicio:** toggle marca y desmarca; dos tipos distintos conviven; tipo ajeno al tipo de post → error; summary cuenta y marca `mine`; listUsers agrupa. **Pruebas del componente:** en una publicación de lugar aparecen los botones "Like", "Me encanta" y "Recomendar" con `aria-pressed`; al hacer clic sube el contador y `aria-pressed="true"`; el enlace "Ver quién reaccionó (N)" abre un diálogo con el nombre de quien reaccionó y enlace a su perfil.
- [ ] **Step 2:** correr → FALLAN.
- [ ] **Step 3:** Implementar. El diálogo usa `<dialog>` o el patrón de `PhotoViewer` (foco atrapado, Esc cierra). La semilla agrega reacciones de varios usuarios a varias publicaciones (ids fijos); `SEED_VERSION = '6'` si Task 2 ya subió a 5. `resetDemo` limpia reacciones (lo hace `clearAll`; comprobarlo).
- [ ] **Step 4:** `npm test && npm run lint && npm run build` → PASA.
- [ ] **Step 5: Commit** `feat(inicio): reacciones por tipo de publicación`

### Task 4: Inicio sin encabezado y arrancando en "Lugar recomendado"

**Files:** Modify `src/pages/HomePage.tsx`, `HomePage.module.css`, `HomePage.test.tsx`

- [ ] **Step 1: Pruebas:** al entrar, el chip "Lugar recomendado" tiene `aria-pressed="true"` y solo se ven publicaciones de lugar; no hay texto "Hola, Alex"; existe un encabezado de nivel 1 "Inicio" (solo para lectores, clase `visually-hidden` de `global.css` o equivalente). Ajustar las pruebas viejas que asumían "Todo".
- [ ] **Step 2:** → FALLAN. **Step 3:** `useState<PostType | null>('lugar')`, quitar saludo. **Step 4:** verde. **Step 5: Commit** `feat(inicio): arranca en lugar recomendado`

### Task 5: Estado de bienvenida/tutorial y pantalla de postales

**Files:**
- Create: `src/services/onboardingService.ts` (+ test), `src/pages/WelcomePage.tsx` (+ `.module.css`, `.test.tsx`), `src/components/postcards/*.tsx` (5 ilustraciones SVG)
- Modify: `src/App.tsx` (ruta `/bienvenida`, protegida y sin `AppLayout`), `src/pages/RegisterPage.tsx` (navega a `/bienvenida`), `src/pages/ProfilePage.tsx` (enlaces "Ver bienvenida" y "Ver tutorial" en el perfil propio), `src/test/renderApp.tsx`, `src/services/seed.ts`

**Interfaces:**
- Produces: `getOnboarding(userId): { bienvenida: boolean; tutorial: boolean }`, `markSeen(userId, paso: 'bienvenida' | 'tutorial')`, `resetSeen(userId, paso)`. Clave de storage `onboarding` (mapa por userId).
- `renderApp(route, { session, onboarding?: boolean })`: por defecto marca los dos pasos como vistos para la sesión; `onboarding: true` los deja pendientes.
- Semilla: la cuenta demo empieza con `bienvenida: true` (vista) y `tutorial: false` (pendiente).

- [ ] **Step 1: Pruebas.** Servicio: por defecto nada visto; `markSeen` y `resetSeen` funcionan por usuario. Página: tras registrarse, la ruta es `/bienvenida` y se ve "Bienvenido a Rumi"; "Siguiente" avanza a "Encuentra roomie"; "Omitir" lleva a `/` y marca la bienvenida como vista; en la última postal el botón dice "Empezar". Con `matchMedia('(prefers-reduced-motion: reduce)')` simulado no hay avance automático (con *fake timers*, tras 10 s sigue en la primera). Sin reducción, tras 4 s pasa a la segunda.
- [ ] **Step 2:** → FALLAN.
- [ ] **Step 3:** Implementar. Textos de las 5 postales del spec §4. Postal: tarjeta con borde, sello dibujado arriba a la derecha y matasellos; fondo de página dividido naranja/azul en diagonal. Animación CSS de entrada (rotación ±3°, desplazamiento) desactivada bajo `prefers-reduced-motion`. Deslizar en táctil = Siguiente/Anterior. "Ver bienvenida" en el perfil hace `resetSeen` y navega.
- [ ] **Step 4:** verde. **Step 5: Commit** `feat(bienvenida): postales al crear la cuenta`

### Task 6: Worker de Cloudflare

**Files:**
- Create: `worker/src/index.ts`, `worker/src/index.test.ts`, `worker/src/prompt.ts`, `worker/wrangler.toml`, `worker/tsconfig.json`
- Modify: `package.json` (devDependency `wrangler`, scripts `worker:dev` y `worker:deploy`), `vite.config.ts` (`test.include` suma `worker/src/**/*.test.ts`), `.gitignore` (`.dev.vars`, `.wrangler/`)

**Interfaces:**
- `POST /chat` body: `{ mensajes: { rol: 'usuario' | 'asistente'; texto: string }[]; publicaciones: PostResumen[]; usuario: { ciudadDestino?: string; paisDestino?: string } }`.
- `PostResumen`: `{ id; tipo; texto; ciudad; zona?; precioMin?; precioMax?; moneda?; fechaDesde?; fechaHasta?; personas?; categoria?; nombreLugar?; hashtags: string[]; conUbicacion: boolean }`. Se define en `worker/src/index.ts` y se exporta; la app lo importa con `import type` desde `../../worker/src/index` o lo duplica en `src/services/aiService.ts`, a elección del builder.
- Respuestas: 200 `{ texto: string; postIds: string[] }`; 400 `{ error: 'invalido' }`; 403 `{ error: 'origen' }`; 413 `{ error: 'grande' }`; 429 `{ error: 'limite' }`; 502 `{ error: 'no-disponible' }`. `OPTIONS` responde al preflight solo para orígenes permitidos.
- `Env`: `{ GEMINI_API_KEY: string; LIMITADOR: { limit(o: { key: string }): Promise<{ success: boolean }> } }`.
- `wrangler.toml`: `name = "rumi-ia"`, `main = "src/index.ts"`, `compatibility_date = "2026-11-01"`, `[[ratelimits]] name = "LIMITADOR"`, `namespace_id = "1001"`, `simple = { limit = 10, period = 60 }`.

- [ ] **Step 1: Pruebas** (archivo con `// @vitest-environment node`, `fetch` de Gemini simulado con `vi.fn`): origen no permitido → 403; preflight de origen permitido → 204 con `Access-Control-Allow-Origin` igual al origen; cuerpo > 100 KB → 413; JSON roto o sin `mensajes` → 400; 21 mensajes → 400; limitador `success: false` → 429; Gemini responde `{"texto":"Hola","postIds":["p-01","p-99"]}` con `p-01` en la lista → 200 `{ texto: 'Hola', postIds: ['p-01'] }`; Gemini 500 o 429 → 502; la petición a Gemini va a `.../models/gemini-2.5-flash:generateContent` con encabezado `x-goog-api-key` igual a `env.GEMINI_API_KEY`, `generationConfig.responseMimeType === 'application/json'` y el esquema `{texto, postIds}`; el cuerpo enviado a Gemini no contiene la palabra "autor".
- [ ] **Step 2:** → FALLAN.
- [ ] **Step 3:** Implementar. `prompt.ts` arma la instrucción de sistema en español (qué es Rumi; respuestas breves y cálidas; recomendar solo ids de la lista; si falta ciudad/presupuesto/fechas, preguntarlo; aclarar cuando habla de conocimiento general) y adjunta las publicaciones como JSON en el último turno del usuario. Roles: `usuario` → `user`, `asistente` → `model`. Textos de publicación recortados a 600 caracteres.
- [ ] **Step 4:** `npm test && npm run lint && npm run build` → PASA.
- [ ] **Step 5: Commit** `feat(ia): worker de Cloudflare para Gemini`

### Task 7: Servicio de IA y panel del asistente

**Files:**
- Create: `src/services/aiService.ts` (+ test), `src/context/AssistantContext.tsx`, `src/context/useAssistant.ts`, `src/components/assistant/AssistantButton.tsx`, `AssistantPanel.tsx`, `SuggestedPost.tsx` (+ `.module.css`, `AssistantPanel.test.tsx`), `src/pages/PostPage.tsx` (+ test), `.env`
- Modify: `src/App.tsx` (ruta `/publicacion/:id`, `AssistantProvider` dentro de `AppLayout`), `src/components/AppLayout.tsx` (botón flotante salvo en `/mensajes/:id`), `src/services/postsService.ts` (`getById(id): Promise<PostWithAuthor>`, `NotFoundError` si no existe)

**Interfaces:**
- `aiService.ask(mensajes, usuario: PublicUser): Promise<{ texto: string; posts: PostWithAuthor[] }>`: resume `postsService.list()` a `PostResumen[]` (máx. 200, los más recientes), manda solo `ciudadDestino`/`paisDestino` del usuario, y convierte `postIds` en publicaciones existentes, descartando los ids desconocidos. Errores: `AiUnavailableError` (red, 502, URL sin configurar), `AiRateLimitError` (429).
- `aiService.isConfigured(): boolean` (= `import.meta.env.VITE_AI_URL` no vacío).
- `useAssistant(): { open(pregunta?: string): void; close(): void; isOpen: boolean }`.
- `.env`: `VITE_AI_URL=` vacío hasta Task 12.

- [ ] **Step 1: Pruebas.** `aiService` (con `fetch` simulado): el cuerpo enviado no contiene `nombre` ni `usuario` de ningún autor ni de quien pregunta; ids desconocidos se descartan; 429 → `AiRateLimitError`; respuesta sin `postIds` → `posts: []` con el texto; JSON inválido → `AiUnavailableError`. Panel (con `aiService` simulado): el botón "Asistente Rumi" abre el panel con "¿En qué te ayudo?" y los atajos; "Crear publicación" navega a `/publicar` y cierra; "Buscar cuarto" envía "Busco cuarto" y muestra la respuesta y una tarjeta sugerida que enlaza a `/publicacion/p-02`; error → "El asistente no está disponible ahora, intenta en un rato"; 429 → "Vas muy rápido, espera un minuto"; se ve la nota "Tus preguntas se envían a Google Gemini. No compartas datos personales."; sin URL configurada, el panel dice que el asistente aún no está configurado. El botón no aparece en `/mensajes/:id`. `PostPage` muestra la publicación completa y "No encontramos esta publicación" para un id inexistente.
- [ ] **Step 2:** → FALLAN.
- [ ] **Step 3:** Implementar. Panel: hoja inferior en < 768 px, lateral a la derecha desde 768 px; foco al campo al abrir; Esc cierra; `aria-live="polite"` para las respuestas. Botón flotante naranja de origen con ícono oscuro (`Sparkles`), encima de la barra inferior.
- [ ] **Step 4:** verde. **Step 5: Commit** `feat(ia): asistente Rumi`

### Task 8: Tutorial de la primera vez

**Files:** Create `src/components/assistant/Tutorial.tsx` (+ `.module.css`, `.test.tsx`); Modify `AppNav.tsx` y `HomePage.tsx` (atributos `data-tutorial="filtros|buscar|publicar|mensajes|perfil|asistente"` en cada destino), `AppLayout.tsx` (monta el tutorial en `/` si `getOnboarding(user.id).tutorial` es falso).

**Interfaces:** Consume `onboardingService` (Task 5) y `useAssistant` (Task 7).

- [ ] **Step 1: Pruebas** (`renderApp('/', { session: 'demo', onboarding: true })`): aparece un diálogo con el primer paso (filtros); "Siguiente" recorre filtros → Buscar → Publicar → Mensajes → Perfil → Asistente; al terminar se cierra, se abre el panel con "¿En qué te ayudo?" y queda marcado como visto (al volver a montar no aparece); "Saltar" lo cierra y lo marca como visto; Esc equivale a Saltar. Con `renderApp` por defecto no aparece.
- [ ] **Step 2:** → FALLAN.
- [ ] **Step 3:** Implementar. Fondo oscuro (`--fondo-visor`) con un recorte alrededor del elemento (`getBoundingClientRect` + `box-shadow` gigante, o SVG con máscara). Si el destino no existe o no se ve (por ejemplo, el menú lateral en escritorio frente a la barra inferior), la burbuja va centrada sin foco. Textos de cada paso: una frase corta en la voz del asistente.
- [ ] **Step 4:** verde. **Step 5: Commit** `feat(ia): tutorial de la primera vez`

### Task 9: Mapa con varios pines

**Files:** Create `src/components/map/MapMulti.tsx` (+ test); Modify `LeafletMap.tsx` (prop `markers?: { id: string; position: LatLng; label: string; active?: boolean }[]`, `onMarkerClick?: (id) => void`, ajuste de límites a los pines con `fitBounds` cuando hay más de uno).

- [ ] **Step 1: Prueba:** `MapMulti` con 0 pines no dibuja mapa y muestra "No hay lugares con ubicación en esta ciudad"; con pines muestra el marco del mapa (Leaflet simulado como en `Map.test.tsx`).
- [ ] **Steps 2–4:** fallar, implementar (pin tipo píldora con el precio "450 €" o un ícono para lugares; el activo en naranja oscuro), verde. **Step 5: Commit** `feat(mapa): varios pines`

### Task 10: Buscar — Personas y Lugares

**Files:** Modify `src/pages/SearchPage.tsx` (+ `.module.css`, `.test.tsx`); Create `src/pages/search/PeopleSearch.tsx`, `src/pages/search/PlacesSearch.tsx`; Modify `postsService.ts` (`listByCity(ciudad: string): Promise<PostWithAuthor[]>`: solo `ofrezco-cuarto` y `lugar`, comparando la ciudad sin mayúsculas, tildes ni espacios).

**Interfaces:** Consume `MapMulti` (Task 9) y `useAssistant().open(pregunta)` (Task 7).

- [ ] **Step 1: Pruebas:** pestañas "Personas" y "Lugares" (`role="tab"`, flechas del teclado como en `radioGroup.ts`); Personas conserva las pruebas actuales; Lugares arranca con la ciudad de destino de Alex ("Madrid") y lista sus cuartos y lugares; "madrid " da lo mismo; una ciudad sin resultados → "Todavía no hay cuartos ni lugares en {ciudad}"; "Pídele a la IA los mejores" abre el asistente con "¿Cuáles son los mejores lugares y cuartos en Madrid?" ya enviado; tocar un pin resalta su tarjeta (`aria-current="true"`) y la desplaza a la vista.
- [ ] **Step 2:** → FALLAN. **Step 3:** Implementar; la semilla debe tener al menos 6 publicaciones con ubicación en Madrid (agregar las que falten en `seed.ts`, subiendo `SEED_VERSION`). **Step 4:** verde. **Step 5: Commit** `feat(buscar): lugares con mapa`

### Task 11: Perfil tipo pasaporte

**Files:** Modify `src/pages/ProfilePage.tsx`, `ProfilePage.module.css`, `ProfilePage.test.tsx`; Create `src/components/passport/PassportPage.tsx` (+ `.module.css`), `src/utils/mrz.ts` (+ test)

**Interfaces:** Consume `Flag` y `countryCode` (Task 2). Produces `mrz(user: PublicUser): [string, string]`: dos líneas de 44 caracteres, en mayúsculas sin tildes, `<` como relleno; línea 1 `P<RUMI` + apellidos `<<` nombres; línea 2 usuario + código de país de origen (o `XXX`) + fecha de llegada `AAMMDD` (o `<` si falta).

- [ ] **Step 1: Pruebas.** `mrz` de Alex: `'P<RUMIROMERO<<ALEX<<<<<<<<<<<<<<<<<<<<<<<<<<'` (44 caracteres) y la segunda línea con `ALEX.ROMERO`, `PE` y `270201`. Perfil: se ven "Pronombres: él", "Idiomas: Español, Inglés" y la nacionalidad "Perú" con la bandera (`data-pais="PE"` o similar en el SVG); las líneas MRZ tienen `aria-hidden="true"`; todo lo que las pruebas actuales verifican (verificación, editar, amistad, mensaje, publicaciones, cerrar sesión, restablecer demo, "Ver bienvenida", "Ver tutorial") sigue pasando.
- [ ] **Step 2:** → FALLAN.
- [ ] **Step 3:** Implementar según el spec §8: tapa (la portada) arriba; página de datos en crema con encabezado "RUMI · PASAPORTE"; foto a la izquierda; pares etiqueta/valor en versalitas (Nombre, Usuario, Pronombres, Nacionalidad, Idiomas, Destino, Fechas); franja MRZ en monoespaciada; descripción, intereses, Instagram y verificación en la misma libreta; botones debajo. Sin scroll horizontal a 320 px (seguir `viewport.test.ts`).
- [ ] **Step 4:** verde. **Step 5: Commit** `feat(perfil): diseño de pasaporte`

### Task 12: Publicar el Worker y conectar

**Files:** Modify `.env` (`VITE_AI_URL=https://rumi-ia.<subdominio>.workers.dev/chat`), `README.md` (sección "Asistente IA": publicar con `npm run worker:deploy`, cargar o cambiar la clave con `npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml`, tope de gasto en Google AI Studio), `package.json` (`version: "0.2.0"`)

- [ ] **Step 1:** `npm run worker:deploy` → imprime la URL `*.workers.dev`.
- [ ] **Step 2:** Poner la URL en `.env`. `curl -i -X OPTIONS <url> -H "Origin: https://evil.example"` → 403; con `Origin: http://localhost:5173` → 204.
- [ ] **Step 3:** El equipo carga la clave (`npx wrangler secret put GEMINI_API_KEY --config worker/wrangler.toml`). Después: `curl -s <url> -H "Origin: http://localhost:5173" -H "Content-Type: application/json" -d '{"mensajes":[{"rol":"usuario","texto":"Hola"}],"publicaciones":[],"usuario":{}}'` → JSON con `texto`.
- [ ] **Step 4:** `npm test && npm run lint && npm run build`; `grep -r "AQ\.\|AIza" dist src worker .env` → nada.
- [ ] **Step 5: Commit** `chore: versión 0.2.0 y URL del asistente`
