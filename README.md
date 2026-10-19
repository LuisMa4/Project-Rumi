# Rumi

Rumi es una red para estudiantes universitarios que se van de intercambio: encuentra con quién compartir piso en tu ciudad destino, mira alquileres, conversa con otros estudiantes y descubre lugares recomendados.

Este repositorio contiene el **Release 01 (MVP)**: solo el front end, con datos simulados en el navegador.

**Demo en línea:** https://luisma4.github.io/Project-Rumi/ (ver [Publicación](#publicación-en-github-pages))

## Qué incluye el Release 01

| Historia | Pantalla |
|---|---|
| HU-01 Registro de usuario | `/registro` |
| HU-02 Inicio de sesión | `/login` (incluye "Entrar con cuenta demo") |
| HU-03 Página principal | `/` publicaciones de otros estudiantes con filtros por tipo |
| HU-04 Configuración de perfil | `/perfil` (editable) y `/perfil/:id` |
| HU-05 Chat entre usuarios | `/mensajes` y `/mensajes/:id` |
| HU-06 Publicaciones | Cuadro para publicar en el inicio |
| HU-07 Búsqueda personalizada | `/buscar` (personas y alquileres) |

La app se ve como una aplicación en el celular (barra de navegación inferior) y como una web en la laptop (menú lateral).

## Cómo correrlo

Requisitos: [Node.js](https://nodejs.org) 22 o superior (o 20.19+).

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente http://localhost:5173).

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre las pruebas (Vitest + React Testing Library) |
| `npm run lint` | Revisa el código con oxlint |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run preview` | Sirve la versión de producción localmente |

## Cuenta demo

| Correo | Contraseña |
|---|---|
| `demo@rumi.app` | `rumidemo123` |

También puedes usar el botón **Entrar con cuenta demo** en la pantalla de inicio de sesión. Entras como Alex Romero, estudiante de la Universidad de Lima que se va a Madrid.

> Es una demo: los datos se guardan solo en tu navegador (`localStorage`). Las contraseñas se guardan cifradas, pero **no uses contraseñas reales**.

Para volver a los datos de ejemplo, entra a **Perfil → Restablecer datos de demo**.

## Estructura

```
src/
  App.tsx            Rutas de la app
  types.ts           Tipos de datos (usuario, publicación, conversación, mensaje)
  styles/            tokens.css (colores y fuentes) y global.css
  services/          Capa de datos: auth, usuarios, publicaciones, chat, datos de demo
  context/           Sesión del usuario (AuthProvider y useAuth)
  components/        Piezas reutilizables (PostCard, Avatar, AppNav, Field…)
  pages/             Una página por pantalla
  hooks/             useStartChat
  utils/             Formatos de fecha y precio, búsqueda sin tildes
docs/superpowers/    Diseño (spec) y plan de implementación
Documentos/          Información general del proyecto y paleta de colores
```

## Cómo pasar a un backend real

Las pantallas **nunca** leen `localStorage` directamente: solo llaman a las funciones de `src/services/` (`authService`, `usersService`, `postsService`, `chatService`), que ya son asíncronas.

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
