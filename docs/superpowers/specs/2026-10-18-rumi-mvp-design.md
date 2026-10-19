# Rumi — Diseño del MVP (Release 01)

- **Fecha:** 2026-10-18
- **Equipo:** Ariana Vizcarra (producto) · Luis Marcelo Espinoza (diseño, desarrollo y arquitectura)
- **Fuente:** `Documentos/Información General.docx` (Capítulo II: Release 01)

## 1. Objetivo

Construir el primer release de Rumi: una **web responsive** que se ve y se usa como una app en el celular y que también funciona en laptop. Debe cubrir las historias HU-01 a HU-07 del Release 01 y poder presentarse completa en clase.

Según el documento del proyecto, el MVP es **solo front end**. Por eso, los datos se simulan en el navegador detrás de una capa de servicios que luego se puede reemplazar por un backend real.

**Criterios de éxito**

1. Se puede crear una cuenta, iniciar sesión (también con la cuenta demo) y cerrar sesión.
2. El inicio muestra publicaciones, se filtran por tipo y se pueden crear publicaciones nuevas que persisten al recargar.
3. Se pueden buscar estudiantes (por nombre, ciudad destino, universidad y fechas que coinciden) y alquileres.
4. Se puede chatear con otro estudiante; en la demo, el otro responde automáticamente.
5. Se puede ver y editar el perfil propio y ver el de otros.
6. Se ve bien en celular (375 px) y en laptop (1280 px o más).
7. `npm test` y `npm run build` pasan sin errores.
8. El código está en GitHub (`LuisMa4/Project-Rumi`, rama `main`) y hay un workflow listo para publicarlo en GitHub Pages.

## 2. Stack

| Pieza | Elección |
|---|---|
| Lenguaje | TypeScript (modo `strict`) |
| Framework | React + Vite (plantilla `react-ts`) |
| Rutas | React Router con `HashRouter` (funciona en GitHub Pages sin configuración del servidor) |
| Estilos | CSS Modules (`Componente.module.css`) + variables globales en `src/styles/tokens.css` |
| Íconos | `lucide-react` |
| Fuentes | `@fontsource/bricolage-grotesque` (títulos) y `@fontsource/dm-sans` (texto), instaladas en el proyecto para funcionar sin internet |
| Pruebas | Vitest + React Testing Library + jsdom |
| Calidad | ESLint (configuración de la plantilla de Vite) |

Vite usa `base: './'` para que el build funcione en cualquier ruta, incluida `luisma4.github.io/Project-Rumi/`.

## 3. Pantallas y navegación

| Ruta | Pantalla | Historia |
|---|---|---|
| `/registro` | Crear cuenta: nombre, correo, universidad, país de origen, ciudad y país destino, fecha de llegada, fecha de salida, contraseña | HU-01 |
| `/login` | Iniciar sesión, más el botón "Entrar con cuenta demo" | HU-02 |
| `/` | Inicio: publicaciones (más recientes primero), filtros por tipo y cuadro para publicar | HU-03, HU-06 |
| `/buscar` | Búsqueda con pestañas *Personas* y *Alquileres* | HU-07 |
| `/mensajes` | Lista de conversaciones con el último mensaje | HU-05 |
| `/mensajes/:id` | Conversación | HU-05 |
| `/perfil` | Perfil propio, editable; incluye "Cerrar sesión" y "Restablecer datos de demo" | HU-04 |
| `/perfil/:id` | Perfil de otro estudiante, con botón "Enviar mensaje" | HU-04, HU-05 |

- **Rutas protegidas:** sin sesión, cualquier ruta salvo `/login` y `/registro` redirige a `/login`. Con sesión, `/login` y `/registro` redirigen a `/`.
- **Navegación:**
  - Menos de 768 px: barra inferior fija con Inicio · Buscar · Publicar (botón central naranja) · Mensajes · Perfil.
  - 768 px o más: menú lateral izquierdo con el logo y las mismas opciones; el contenido va en una columna central de máximo 640 px.
  - "Publicar" lleva al inicio y abre el cuadro para publicar.
- **Tipos de publicación:** `busco-roomie` (Busco roomie), `ofrezco-cuarto` (Ofrezco cuarto), `lugar` (Lugar recomendado) y `viaje` (Viaje).
- **Pestaña Alquileres:** muestra las publicaciones de tipo `ofrezco-cuarto`, con filtros de ciudad y precio máximo.

**Fuera de este release:** calendario de llegadas y salidas, módulo propio de lugares turísticos, login con redes sociales, notificaciones, fotos subidas por el usuario, modo oscuro y chat en tiempo real entre personas distintas.

## 4. Identidad visual

Todos los valores viven en `src/styles/tokens.css`.

| Token | Valor | Uso |
|---|---|---|
| `--naranja` | `#C86734` | Botones principales, botón Publicar, filtro activo, mis burbujas de chat |
| `--naranja-oscuro` | `#A9532A` | Enlaces, textos naranjas pequeños, pestaña activa, hover de botones |
| `--naranja-suave` | `#FBEDE4` | Fondo de la etiqueta "Busco roomie" |
| `--celeste` | `#9AD4E8` | Etiquetas, burbujas del otro en el chat, portada del perfil, avatares |
| `--celeste-suave` | `#EAF6FA` | Fondo general de la app |
| `--celeste-tinta` | `#174559` | Texto sobre fondos celestes |
| `--blanco` | `#FFFFFF` | Tarjetas, formularios, barras de navegación |
| `--tinta` | `#1F2A33` | Texto principal |
| `--tinta-suave` | `#5B6B76` | Texto secundario |
| `--borde` | `#E3ECF0` | Bordes de tarjetas y separadores |
| `--borde-campo` | `#7F8F99` | Borde de los campos de formulario (3.3:1 sobre blanco) |
| `--error` | `#B42318` | Mensajes de error en formularios |

- **Colores de origen:** Pantone 16-1448 TCX *Burnt Orange* y 14-4514 TCX *Atomizer*, tomados de `Documentos/Colores.jpeg`.
- **Tipografía:** títulos en Bricolage Grotesque; texto en DM Sans (16 px base).
- **Formas:** tarjetas con radio de 16 px, botones y etiquetas tipo píldora y sombras muy suaves.
- **Logo provisional:** la palabra "rumi" en Bricolage Grotesque, naranja, con el punto de la i en celeste (`components/Logo.tsx`). También se usa como favicon.
- **Avatares:** círculo con iniciales; el color de fondo es celeste o naranja suave según el usuario.
- **Accesibilidad:** cada campo tiene su `label`, el foco del teclado es visible, el menú activo usa `aria-current="page"` y los errores se asocian a su campo con `aria-describedby`. El texto naranja pequeño usa `--naranja-oscuro` (contraste 5.3:1 sobre blanco).

## 5. Modelo de datos

Los tipos van en `src/types.ts`.

```ts
type PostType = 'busco-roomie' | 'ofrezco-cuarto' | 'lugar' | 'viaje';

interface User {
  id: string;
  nombre: string;
  email: string;            // se guarda en minúsculas; es único
  passwordHash: string;     // SHA-256 en hex; nunca sale de los servicios
  universidad: string;
  paisOrigen: string;
  ciudadDestino: string;
  paisDestino: string;
  fechaLlegada: string;     // ISO 'YYYY-MM-DD'
  fechaSalida: string;      // ISO 'YYYY-MM-DD', posterior a fechaLlegada
  bio: string;
  intereses: string[];
  presupuesto?: number;     // mensual
  moneda?: string;          // 'EUR', 'USD', 'ARS', ...
  instagram?: string;       // usuario sin '@'
  creadoEn: string;         // ISO datetime
}

type PublicUser = Omit<User, 'passwordHash'>;

interface Post {
  id: string;
  autorId: string;
  tipo: PostType;
  texto: string;
  ciudad: string;
  fechaDesde?: string;
  fechaHasta?: string;
  precio?: number;          // solo 'ofrezco-cuarto' y 'busco-roomie'
  moneda?: string;
  zona?: string;            // barrio o zona, solo 'ofrezco-cuarto'
  creadoEn: string;
}

interface Conversation {
  id: string;
  participantes: [string, string];
  actualizadoEn: string;
}

interface Message {
  id: string;
  conversacionId: string;
  autorId: string;
  texto: string;
  enviadoEn: string;
}
```

## 6. Capa de servicios (`src/services/`)

Las pantallas **solo** usan estos módulos; ninguna pantalla lee `localStorage`. Todas las funciones devuelven `Promise` para que el cambio a un backend real no afecte a la UI.

| Módulo | Funciones |
|---|---|
| `storage.ts` | `read<T>(key, fallback)`, `write(key, value)`, `remove(key)`. Claves con prefijo `rumi:`. Si `localStorage` no está disponible (modo privado o bloqueado), usa un `Map` en memoria. |
| `seed.ts` | Datos de ejemplo: 8 estudiantes, la cuenta demo, unas 12 publicaciones de los 4 tipos y 2–3 conversaciones de la cuenta demo. `ensureSeeded()` los carga si falta la clave `rumi:version`. `resetDemo()` borra todo y vuelve a cargar. |
| `authService.ts` | `register(input)`, `login(email, password)`, `loginDemo()`, `logout()`, `getCurrentUser()`. La sesión es el id del usuario en `rumi:session`. |
| `usersService.ts` | `getById(id)`, `update(id, cambios)`, `search(filtros)`. `search` acepta `texto` (nombre), `ciudadDestino`, `universidad` y `coincideCon` (id de un usuario cuyas fechas deben solaparse), y excluye al usuario actual. |
| `postsService.ts` | `list({ tipo? })` (más recientes primero), `listByAuthor(id)`, `searchRentals({ ciudad?, precioMax? })`, `create(autorId, input)`. |
| `chatService.ts` | `listConversations(userId)` (con el otro usuario y el último mensaje, ordenadas por actividad), `getOrCreateConversation(a, b)`, `getMessages(id)`, `send(id, autorId, texto)`, `subscribe(id, callback)` (devuelve una función para desuscribirse). |
| `crypto.ts` | `hashPassword(texto)` con `crypto.subtle` (SHA-256). |
| `errors.ts` | `ValidationError` con `fieldErrors: Record<string, string>` y `AuthError`. |

**Respuesta automática del chat (solo demo):** después de `send`, el servicio programa una respuesta del otro participante a los 1.5–2.5 s, elegida de una lista de frases. Se guarda como un mensaje normal y se notifica a quienes estén suscritos a esa conversación.

**Validaciones** (en los servicios, mostradas en los formularios):

- Registro:
  - Campos obligatorios: nombre, correo, universidad, país de origen, ciudad destino, país destino, fecha de llegada, fecha de salida y contraseña.
  - El correo debe tener formato válido y no estar registrado.
  - La contraseña debe tener 8 caracteres o más.
  - La fecha de salida debe ser posterior a la de llegada.
- Login: ante cualquier error responde "Correo o contraseña incorrectos" (no revela si el correo existe).
- Publicación: el texto es obligatorio (1–500 caracteres) y la ciudad también; el precio, si se ingresa, debe ser mayor que 0.
- Perfil: mismas reglas que el registro para los campos que se editan; la bio tiene un máximo de 300 caracteres; el Instagram se guarda sin `@`.
- Mensaje: no puede estar vacío (máximo 1000 caracteres).

**Sesión en React:** `context/AuthContext.tsx` expone `user`, `login`, `loginDemo`, `register`, `logout` y `refreshUser`. `components/ProtectedRoute.tsx` aplica las redirecciones.

**Seguridad:** las contraseñas se guardan como hash y los servicios nunca devuelven `passwordHash`. El README aclara que es una demo y que no deben usarse contraseñas reales. La contraseña de la cuenta demo se documenta en el README.

## 7. Estructura de carpetas

```
src/
  main.tsx              App.tsx (rutas)        types.ts
  styles/               tokens.css  global.css
  services/             storage.ts seed.ts crypto.ts errors.ts
                        authService.ts usersService.ts postsService.ts chatService.ts
  context/              AuthContext.tsx
  components/           Logo, Avatar, Button, Chip, TextField, PostCard, PostComposer,
                        AppLayout (BottomNav + Sidebar), ProtectedRoute, EmptyState
  pages/                LoginPage, RegisterPage, HomePage, SearchPage,
                        MessagesPage, ChatPage, ProfilePage
  utils/                format.ts (fechas y precios en español)
```

Cada componente y página tiene su `.module.css` al lado. Las pruebas van junto al archivo que prueban (`authService.test.ts`, `LoginPage.test.tsx`).

## 8. Manejo de errores y estados

- **Errores de formulario:** el mensaje se muestra debajo de cada campo (desde `ValidationError.fieldErrors`). Los errores generales aparecen arriba del formulario.
- **Estados de carga:** como los servicios son asíncronos, las listas muestran un estado de carga breve.
- **Listas vacías:** sin publicaciones, sin resultados o sin conversaciones se muestra un mensaje que invita a actuar (por ejemplo, "Publica lo que estás buscando").
- **Rutas o ids inexistentes:** `/perfil/:id` o `/mensajes/:id` con un id inválido muestran "No encontramos este perfil o conversación" y un enlace al inicio. Cualquier otra ruta redirige a `/`.

## 9. Pruebas

Con Vitest y React Testing Library; se corren con `npm test`. Antes de cada prueba se limpia `localStorage`.

- **Servicios:**
  - `register`: crea el usuario, rechaza un correo duplicado, una contraseña corta y fechas invertidas, y no devuelve el hash.
  - `login`: funciona con los datos correctos, falla con los incorrectos y `loginDemo` funciona.
  - `postsService`: el orden y el filtro por tipo, `create` con validaciones y `searchRentals` con precio máximo.
  - `usersService.search`: filtra por texto, ciudad y universidad, por fechas que se solapan y excluye al usuario actual.
  - `chatService`: `getOrCreateConversation` no duplica conversaciones, `send` guarda el mensaje y la respuesta automática llega (con temporizadores falsos).
  - `storage`: usa el respaldo en memoria si `localStorage` lanza un error.
- **Componentes:**
  - `LoginPage`: muestra el error con credenciales malas y entra con la cuenta demo.
  - `RegisterPage`: muestra los errores por campo.
  - `HomePage`: filtra por tipo y la publicación nueva aparece en la lista.
  - `ChatPage`: el mensaje enviado aparece.
- **Verificación manual:** recorrer todas las pantallas en el navegador a 375 px y a 1280 px.

## 10. Repositorio y publicación

- La carpeta local del proyecto es el repositorio, conectado a `https://github.com/LuisMa4/Project-Rumi.git` en la rama `main`, que ya tiene el commit inicial con el README.
- Se versiona todo, incluida la carpeta `Documentos/`. Se ignoran `node_modules/`, `dist/` y `coverage/`. `.gitattributes` normaliza los fines de línea.
- Commits por etapas en `main`; el push se hace al final, cuando `npm test` y `npm run build` pasen.
- `.github/workflows/deploy.yml` hace el build y publica en GitHub Pages con cada push a `main`. Para activarlo, el equipo debe elegir *Settings → Pages → Source: GitHub Actions* en el repositorio. La URL esperada es `https://luisma4.github.io/Project-Rumi/`.
- El `README.md` explica qué es Rumi, cómo correrlo (`npm install`, `npm run dev`, `npm test`), la cuenta demo, la estructura de carpetas y cómo reemplazar los servicios por un backend.
