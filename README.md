# Rumi

Rumi es una red para estudiantes universitarios que se van de intercambio: encuentra con quién compartir piso en tu ciudad destino, mira alquileres, conversa con otros estudiantes y descubre lugares recomendados.

Este repositorio contiene el **Release 01 (MVP)**: solo el front end, con datos simulados en el navegador.

**Demo en línea:** https://luisma4.github.io/Project-Rumi/ (ver [Publicación](#publicación-en-github-pages))

## Qué incluye el Release 01

| Historia | Pantalla |
|---|---|
| HU-01 Registro de usuario | `/registro`: nombre, nombre de usuario único, correo y contraseña (con confirmación) |
| HU-02 Inicio de sesión | `/login` con usuario o correo (incluye "Entrar con cuenta demo") |
| HU-03 Página principal | `/`: fila de amigos (tocas uno y se abre el chat), publicaciones con filtros y rango de precio para alquileres |
| HU-04 Configuración de perfil | `/perfil`: foto de perfil y portada, destino, fechas e intereses; `/verificar`: DNI, celular y universidad |
| HU-05 Chat entre usuarios | `/mensajes` y `/mensajes/:id`, con mensajes sin leer |
| HU-06 Publicaciones | `/publicar`: tipos guiados, hashtags, fotos, enlace del anuncio y ubicación en el mapa |
| HU-07 Búsqueda personalizada | `/buscar` por nombre de usuario, con solicitudes de amistad (y la campana en `/solicitudes`) |

La app se ve como una aplicación en el celular (barra de navegación inferior) y como una web en la laptop (menú lateral).

## Cómo correrlo

Requisitos: [Node.js](https://nodejs.org) 24.15 o superior (o 22.22+), que es lo que piden Vitest y jsdom.

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente http://localhost:5173).

Para probarlo en tu celular, conectado a la misma red Wi-Fi, corre `npm run dev -- --host` y abre la dirección `Network` que aparece (por ejemplo, `http://192.168.1.20:5173`).

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre las pruebas (Vitest + React Testing Library) |
| `npm run lint` | Revisa el código con oxlint |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión de producción localmente |

## Cuenta demo

| Usuario | Correo | Contraseña |
|---|---|---|
| `alex.romero` | `demo@rumi.app` | `rumidemo123` |

También puedes usar el botón **Entrar con cuenta demo** en la pantalla de inicio de sesión. Entras como Alex Romero, estudiante peruano que se va a Madrid. Tiene 3 amigos, 2 solicitudes de amistad pendientes y la universidad sin verificar, para mostrar ese paso.

Los usuarios de ejemplo aceptan solos, a los pocos segundos, las solicitudes de amistad que les envíes, igual que responden solos en el chat.

> Es una demo: los datos se guardan solo en tu navegador (`localStorage`). Las contraseñas se guardan como hash (SHA-256), no en texto plano, pero **no uses contraseñas reales**.

Para volver a los datos de ejemplo, entra a **Perfil → Restablecer datos de demo**.

Otras cosas de la demo:

- **Verificación:** no se envían SMS ni correos reales; el código aparece en pantalla. Del documento solo se guardan los últimos 3 caracteres y la foto nunca se guarda.
- **Fotos:** se recortan y comprimen en el navegador. Entre todas (perfil, portadas y publicaciones) pueden ocupar hasta 3 MB; si se pasa, la app avisa y no guarda la foto.
- **Mapa:** usa OpenStreetMap y necesita internet. Sin conexión se ve el aviso y el enlace "Abrir en Google Maps".

## Estructura

```
src/
  App.tsx            Rutas de la app
  types.ts           Tipos de datos (usuario, publicación, conversación, mensaje)
  styles/            tokens.css (colores y fuentes) y global.css
  services/          Capa de datos: auth, usuarios (y verificación), amigos, publicaciones, chat, datos de demo
  context/           Sesión del usuario (AuthProvider y useAuth)
  components/        Piezas reutilizables (PostCard, FriendsRow, HashtagEditor, map/…)
  pages/             Una página por pantalla
  hooks/             useStartChat, useIncomingRequests, useFocusFirstInvalid
  utils/             Formatos, hashtags, compresión de imágenes, máscaras, búsqueda sin tildes
docs/superpowers/    Diseño (spec) y plan de implementación
Documentos/          Información general del proyecto y paleta de colores
```

## Cómo pasar a un backend real

Las pantallas **nunca** leen `localStorage` directamente: solo llaman a las funciones de `src/services/` (`authService`, `usersService`, `friendsService`, `postsService`, `chatService`), que ya son asíncronas.

Para el siguiente release basta con reescribir el interior de esos archivos (por ejemplo, con Firebase, Supabase o una API propia) manteniendo las mismas funciones. Las pantallas no cambian. `src/services/db.ts` y `src/services/storage.ts` son las piezas que quedan obsoletas.

## Identidad visual

- Naranja `#C86734` (Pantone 16-1448 TCX Burnt Orange) para acciones.
- Celeste `#9AD4E8` (Pantone 14-4514 TCX Atomizer) como color de apoyo.
- Blanco como base. Títulos en Bricolage Grotesque y texto en DM Sans.

Todos los colores viven en `src/styles/tokens.css`.

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy.yml` corre las pruebas, genera el build y lo publica en cada push a `main`.

Para activarlo una sola vez: en GitHub, entra a **Settings → Pages** y en **Source** elige **GitHub Actions**.

## Equipo

- **Ariana Vizcarra**: definición del producto, control de usuarios y coordinación interna.
- **Luis Marcelo Espinoza**: coordinación interna, diseño y desarrollo del sistema y su arquitectura.
