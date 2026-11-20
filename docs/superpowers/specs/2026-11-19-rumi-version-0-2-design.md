# Rumi — Versión 0.2 (diseño)

- **Fecha:** 2026-11-19
- **Fuentes del equipo:** `docs/Versión 0.2.pdf` (cambios) y `docs/rumi.pdf` (marca y paleta "6 p. m.").
- **Parte de:** modifica lo descrito en `2026-10-18-rumi-mvp-design.md` y `2026-10-21-rumi-amigos-publicar-verificacion-design.md`; lo que no se menciona aquí sigue igual.

Convención: **(equipo)** es lo que pidió el equipo. **(decisión de Claude)** es lo que decidió quien diseñó; se puede cambiar sin volver a preguntar.

## 1. Intención

La marca de Rumi ya tiene concepto: *"Somewhere new, someone familiar"*, nostalgia, postales, pasaportes y la luz de las 6 p. m. La 0.2 hace que la app se vea y se sienta así, y suma la primera pieza "real" fuera del navegador: **un asistente de IA que funciona de verdad** (equipo) para buscar cuartos, roomies y recomendaciones.

### Metas

1. **Paleta 6 p. m.** en toda la app (equipo).
2. **Bienvenida tipo postales** después de crear la cuenta, con opción de omitir (equipo).
3. **Inicio renovado:** sin el título "Inicio", arrancando en "Lugar recomendado", con **reacciones propias de cada tipo** y la lista de quién reaccionó (equipo).
4. **Asistente IA** flotante abajo a la derecha, con tutorial la primera vez y atajos "Crear publicación / Buscar cuarto / Encontrar roomie" (equipo). Responde con **Gemini de verdad** (equipo).
5. **Buscar** con dos modos, Personas y Lugares, y **mapa** de lugares tipo Airbnb; se le puede pedir a la IA los mejores (equipo).
6. **Perfil tipo pasaporte**, con pronombres, bandera del país de origen e idiomas, manteniendo todo lo que tiene hoy (equipo).
7. `npm test`, `npm run lint` y `npm run build` pasan, con pruebas nuevas para cada comportamiento.

### No metas (no se hacen en la 0.2)

- **Sellos del pasaporte** (equipo: "para el futuro").
- Todo lo de "Para futuro" del PDF: estrellas, reportar y bloquear, grupos de alquiler en vivo, llaves personalizables.
- Logo de llave con tinta estampada (`rumi.pdf` pág. 5). Se mantiene el logo actual, con los colores nuevos.
- Base de datos compartida o backend de datos. Todo sigue en `localStorage` detrás de `src/services/`.
- Historial de conversaciones con la IA entre sesiones (decisión de Claude: la conversación vive mientras el panel está abierto o hasta recargar).

### Anti-metas (si pasa esto, salió mal aunque "funcione")

- **La clave de Gemini aparece en el repo, en `dist/`, en un JSON o en cualquier archivo que llegue al navegador.** Solo vive como *secret* del Worker de Cloudflare.
- El Worker acepta llamadas de cualquier sitio, o sin límite de tamaño, y se convierte en un proxy gratis de Gemini para terceros.
- La IA "inventa" publicaciones: muestra tarjetas de cuartos o personas que no existen en los datos.
- Texto o botones que no llegan a contraste AA (4.5:1 texto normal, 3:1 texto grande, bordes de campos y foco) por usar la paleta pastel tal cual.
- Animaciones que se mueven aunque el sistema pida `prefers-reduced-motion`.
- Que la bienvenida o el tutorial vuelvan a aparecer cada vez que alguien entra.

## 2. Enfoques considerados (IA)

| Enfoque | Qué implica | Resultado |
|---|---|---|
| **A. Worker de Cloudflare como intermediario; la app manda el contexto** | El Worker guarda la clave y reenvía a Gemini. La app envía la pregunta junto con las publicaciones que ese navegador puede ver. | **Elegido por el equipo.** Cabe en la 0.2 y no toca la capa de datos. Límite: la IA solo "ve" los datos de ese navegador, igual que el resto de la demo. |
| B. Base de datos real en la nube (Supabase o similar) | Usuarios, publicaciones y mensajes en un servidor compartido. | Descartado por ahora: reescribe toda la capa de datos. Queda como el siguiente gran paso. |
| C. Clave en un JSON en GitHub Pages | — | Descartado: cualquiera la lee con F12, y Google la puede anular al detectarla en un repo público. |
| D. Cada presentador pega la clave en la app | Funciona sin servidor. | Descartado: la IA no funcionaría para cualquier visitante. |

## 3. Paleta 6 p. m.

Colores de origen, medidos en `docs/rumi.pdf` pág. 2 (equipo):

| Nombre | Hex | Papel |
|---|---|---|
| Azul | `#8299C2` | Superficies secundarias, etiquetas, mapa, "Buscar" |
| Naranja | `#E99A59` | Acento: botón Publicar, botón de la IA, chips activos (como fondo) |
| Crema | `#F3EBDD` | **Fondo general de la app** (reemplaza al blanco/celeste suave) |
| Lavanda | `#B5A9D0` | Etiquetas de tipo, avatares, detalles del pasaporte |

Decisiones de Claude:

- Las tarjetas y campos siguen en **blanco** sobre el fondo crema, para que el contenido se lea limpio.
- De cada color se derivan un tono **oscuro** (para texto sobre blanco o crema, y para botones con texto blanco) y uno **suave** (fondos de chips y etiquetas). El oscuro de cada uno debe pasar 4.5:1 con blanco y con crema; el builder elige el hex exacto con esa regla y lo deja en `tokens.css`.
- El botón primario usa el **naranja oscuro** con texto blanco. El naranja de origen se usa en fondos y en el botón flotante de la IA con un ícono oscuro, no con texto blanco.
- `--tinta` (texto principal) pasa a un azul noche que combina con la paleta, también con 4.5:1 sobre crema y blanco.
- Se mantiene la regla de `tokens.css`: ningún componente usa un hex fuera de ese archivo. Los nombres viejos (`--celeste…`) se renombran a los nuevos (`--azul…`, `--lavanda…`, `--crema…`) y se actualizan todos los usos.
- `tokens.test.ts` se amplía para comprobar los contrastes de arriba.
- El mapa de color de los tipos de publicación (chips y etiquetas) se reasigna: Busco roomie → lavanda, Ofrezco cuarto → naranja, Lugar recomendado → azul, Viaje → crema con borde/tinta azul. (decisión de Claude)

## 4. Bienvenida tipo postales

**Cuándo** (equipo + decisión de Claude): justo después de crear la cuenta, una sola vez por usuario. También se puede volver a ver desde el perfil propio ("Ver bienvenida"). La cuenta demo **no** la ve al entrar (para que la presentación arranque directo), pero puede abrirla desde el perfil.

**Qué es:** pantalla completa con 5 postales que van pasando solas (unos 4 s cada una) y también con deslizar/flechas y puntos de avance. Botón "Omitir" siempre visible; al final, "Empezar". Inspirada en el boceto del PDF: fondo dividido naranja/celeste, la marca al centro.

Contenido (decisión de Claude, el texto se puede ajustar):

1. "Bienvenido a Rumi" — *Somewhere new, someone familiar.*
2. "Encuentra roomie" — personas que van a tu misma ciudad, antes de llegar.
3. "Cuartos y lugares" — cuartos que se ofrecen y sitios que recomiendan quienes ya están ahí.
4. "Haz amigos antes de llegar" — amigos, chat y publicaciones.
5. "Tu asistente" — pregúntale a la IA lo que buscas.

**Postales ilustradas, no fotos** (decisión de Claude): las imágenes del moodboard son de internet y no se pueden publicar en la app. Cada postal es una ilustración simple en SVG con la paleta (borde de postal con sello y matasellos dibujados, un motivo por postal: llave, maleta, mapa, chat, estrella). Si el equipo trae fotos propias, se cambian después sin tocar el flujo.

**Animación:** la postal entra con una ligera rotación y desplazamiento, como si se dejara sobre la mesa. Con `prefers-reduced-motion`, cambio por fundido sin movimiento y sin avance automático.

Tras terminar u omitir, va al inicio y se activa el tutorial del asistente (sección 6).

## 5. Inicio

- Se quitan el `<h1>Inicio</h1>` y el saludo (equipo). Para accesibilidad queda un título solo para lectores de pantalla ("Inicio"). (decisión de Claude)
- Se mantienen la fila de amigos y los filtros. **El filtro inicial es "Lugar recomendado"** (equipo); "Todo" sigue disponible.
- El ítem "Inicio" de la barra de navegación se mantiene (el boceto tacha solo el encabezado de la página).

### Reacciones (equipo)

Cada tipo de publicación tiene sus propias reacciones, cada una con su ícono (lucide-react; decisión de Claude):

| Tipo | Reacciones |
|---|---|
| Busco roomie | Recomendar (`ThumbsUp`) |
| Ofrezco cuarto | Buen lugar (`Home`), Lo conozco (`MapPinCheck`), Recomendado (`ThumbsUp`) |
| Lugar recomendado | Like (`Heart`), Me encanta (`Sparkles`), Recomendar (`ThumbsUp`) |
| Viaje | Me interesa (`Star`), Recomendado (`ThumbsUp`) |

- Una persona puede marcar **varias reacciones distintas** en la misma publicación, pero cada una una sola vez; tocarla de nuevo la quita. (decisión de Claude)
- Se pueden marcar en publicaciones propias. (decisión de Claude: es lo que hacen casi todas las redes y evita un caso especial.)
- Debajo de la tarjeta, una fila de botones con ícono, nombre y contador. Botón con `aria-pressed`.
- **"Ver quién reaccionó"** (equipo: "se puede ver perfiles que dieron like"): un enlace con el total abre un panel con pestañas por reacción y la lista de personas (avatar, nombre, @usuario, enlace al perfil).
- Datos: nueva colección `reactions` en `localStorage` (`{ id, postId, userId, tipo, creadoEn }`) con su servicio `reactionsService.ts` y pruebas. Los datos de demo incluyen reacciones de varios usuarios sembrados. Subir la versión de la semilla para que las demos existentes se regeneren, siguiendo cómo lo hace hoy `seed.ts`.

## 6. Asistente IA

### En pantalla

- **Botón flotante** circular abajo a la derecha (equipo), por encima de la barra inferior en el celular, en todas las páginas con `AppLayout` salvo el chat individual, donde taparía la caja de escribir. (decisión de Claude) Etiqueta accesible "Asistente Rumi".
- Al tocarlo abre un **panel** (hoja inferior en celular, panel lateral en escritorio) tipo chat: mensajes de la persona y del asistente, caja de texto, botón enviar, estado "Pensando…", y error amable si falla la red o el servicio.
- Al abrirse por primera vez en una conversación vacía, el asistente dice "¿En qué te ayudo?" con tres atajos (equipo):
  - **Crear publicación** → lleva a `/publicar` y cierra el panel. (decisión de Claude: no se publica desde el chat en la 0.2.)
  - **Buscar cuarto** → envía "Busco cuarto" y el asistente pregunta lo que falte (ciudad, presupuesto, fechas).
  - **Encontrar roomie** → envía "Busco roomie" con el mismo comportamiento.
- Las respuestas pueden traer **publicaciones sugeridas**: se muestran debajo del mensaje como tarjetas compactas (tipo, título/texto corto, ciudad, precio) que llevan a la publicación.
  - Ir a una publicación: no existe hoy una página por publicación. El builder decide entre crear `/publicacion/:id` o abrir la tarjeta expandida; lo importante es que el toque lleve a ver esa publicación completa.
- También puede responder preguntas generales (equipo: "pedir recomendaciones de lugares, precios, etc."): barrios, precios típicos, consejos. Debe aclarar cuando habla de conocimiento general y no de publicaciones de Rumi.

### Tutorial de la primera vez (equipo)

- Se muestra **una sola vez por usuario**, la primera vez que llega al inicio (después de la bienvenida, si la hubo). La cuenta demo también lo ve la primera vez tras restablecer la demo; se puede repetir desde el perfil ("Ver tutorial"). (decisión de Claude)
- Fondo oscuro con un "foco" sobre cada sección y una burbuja del asistente que la explica, con "Siguiente" y "Saltar": filtros del inicio, Buscar, Publicar, Mensajes, Perfil y por último el botón del asistente.
- Al terminar, abre el panel del asistente con el "¿En qué te ayudo?".
- Accesible: el foco se mueve a la burbuja, Esc lo cierra, y con `prefers-reduced-motion` no hay transiciones.

### Cómo funciona por dentro

```
App (GitHub Pages) ──POST /chat──▶ Worker (Cloudflare) ──▶ Gemini API
   pregunta + historial +           guarda GEMINI_API_KEY        gemini-2.5-flash
   publicaciones visibles           valida origen y tamaño
                                    arma el prompt
         ◀── { texto, postIds[] } ──
```

**Worker** (carpeta `worker/` en el repo, TypeScript, Wrangler):

- Una ruta `POST /chat`. Recibe `{ mensajes: [{rol, texto}], publicaciones: [...], usuario: { ciudadDestino?, paisDestino? } }`.
- **CORS solo** para `https://luisma4.github.io` y `http://localhost:5173` (más los puertos de `vite preview`). Cualquier otro origen → 403.
- **Límites:** cuerpo máximo ~100 KB, máximo 20 mensajes de historial y 200 publicaciones, textos recortados. Si se pasa → 413.
- **Límite de uso por IP** (decisión de Claude, tras la revisión): el bloqueo de origen solo frena a otras páginas web; un script puede falsificar el encabezado. Se usa el *rate limiting* nativo de Workers (binding `ratelimits` en `wrangler.toml`, sin pasos manuales extra): ~10 consultas por minuto por IP. Si se pasa → 429 y la app muestra "Vas muy rápido, espera un minuto". Además se recomienda al equipo un tope de gasto en Google AI Studio si la clave tiene facturación.
- Llama a **Gemini 2.5 Flash** con un prompt de sistema en español que explica qué es Rumi, que responda breve y cálido, que **solo** recomiende publicaciones cuyo `id` esté en la lista recibida, y que pregunte lo que falte. Pide salida JSON estructurada (`responseMimeType: application/json` con esquema `{ texto: string, postIds: string[] }`).
- El Worker **filtra `postIds`** y quita cualquier id que no venía en la lista (anti-meta de inventar).
- Errores de Gemini (cuota agotada, clave inválida, caída) → respuesta `{ error: 'no-disponible' }` con 502/503; la app muestra "El asistente no está disponible ahora, intenta en un rato".
- La clave es el *secret* `GEMINI_API_KEY`, que **el equipo carga a mano** con `npx wrangler secret put GEMINI_API_KEY`. No hay `.dev.vars` con la clave en el repo; `.dev.vars` va al `.gitignore`.
- Pruebas del Worker con Vitest (sin llamar a Gemini: se simula `fetch`): CORS, límites, filtrado de ids, manejo de errores.

**App:**

- `src/services/aiService.ts`: arma las publicaciones a enviar (las que devuelve hoy `postsService.list` para ese usuario, resumidas: id, tipo, texto recortado, ciudad, zona, precios, fechas, personas, categoría, nombre del lugar, hashtags, si tiene ubicación) y llama al Worker.
- **Datos mínimos a Gemini** (decisión de Claude, tras la revisión): **no se envían nombres ni usuarios de los autores**, ni el nombre de quien pregunta; solo la ciudad y país de destino de quien pregunta. Las tarjetas sugeridas se arman en la app con los ids, así que no hace falta. Con la clave en el plan gratuito, Google puede usar los mensajes para mejorar sus productos, por eso el panel muestra una nota corta: "Tus preguntas se envían a Google Gemini. No compartas datos personales."
- La URL del Worker viene de `import.meta.env.VITE_AI_URL` (es pública, no es secreta). Se define en `.env` (versionado) con la URL de producción del Worker. Si falta, el botón del asistente muestra el estado "no configurado" en vez de romperse.
- Las pruebas de la app simulan `aiService`; ninguna prueba llama a la red.

**Publicación del Worker** (pasos con el equipo; el equipo ya creó la cuenta de Cloudflare):

1. Claude ejecuta `npx wrangler login`; el equipo autoriza en el navegador.
2. Claude ejecuta `npx wrangler deploy` y anota la URL en `.env`.
3. El equipo ejecuta `npx wrangler secret put GEMINI_API_KEY` y pega la clave.
4. README: sección corta de cómo publicar el Worker y cambiar la clave.

## 7. Buscar

Dos pestañas arriba (equipo: "búsqueda de lugares o de personas"):

- **Personas:** la búsqueda actual por @usuario, sin cambios.
- **Lugares:**
  - Campo "¿Dónde?" con la ciudad (con sugerencias de las ciudades conocidas en `cities.ts`; también acepta texto libre). Por defecto, la ciudad de destino del usuario si la tiene. (decisión de Claude)
  - **Mapa** grande con un pin por cada publicación de esa ciudad que tenga `ubicacion` (Ofrezco cuarto y Lugar recomendado). El pin muestra el precio (cuartos) o un ícono (lugares), como Airbnb. Tocar un pin resalta su tarjeta en la lista. Si la ciudad no tiene coordenadas conocidas, el mapa se centra en los pines, o se oculta si no hay ninguno.
  - Debajo, la **lista de publicaciones** de esa ciudad (todas las de tipo Ofrezco cuarto y Lugar recomendado, con o sin ubicación).
  - Botón **"Pídele a la IA los mejores"**: abre el asistente con la pregunta ya enviada ("¿Cuáles son los mejores lugares y cuartos en {ciudad}?"), y las sugeridas aparecen como tarjetas (equipo: "te dará las opciones en publicaciones").
- Hace falta un mapa con **varios pines**; hoy `MapView` muestra uno. Se extiende o se crea un `MapMulti` reutilizando `LeafletMap`, con la misma carga diferida y el mismo manejo de errores de teselas.
- Las semillas deben tener suficientes publicaciones con ubicación en Madrid (al menos 5–6) para que el mapa luzca en la demo.

## 8. Perfil tipo pasaporte

Mismo contenido de hoy (equipo: "mantener todas las cosas"): foto, portada, nombre, @usuario, origen → destino, fechas, bio, intereses, Instagram, verificaciones, botones (amistad, mensaje, editar, verificar, cerrar sesión, restablecer demo) y "Tus publicaciones".

Diseño (según el boceto del PDF y decisión de Claude):

- La parte de arriba se ve como la **página de datos de un pasaporte**: papel crema con borde y esquinas, encabezado con "RUMI · PASAPORTE" y el logo, foto a la izquierda con borde fino, y a la derecha los datos en pares etiqueta/valor en mayúsculas pequeñas (Nombre, Usuario, Pronombres, Nacionalidad + bandera, Idiomas, Destino, Fechas).
- Abajo de la página, una franja tipo **zona de lectura mecánica** (dos líneas monoespaciadas tipo `P<RUMI<ROMERO<<ALEX<<<<…`) como detalle decorativo, oculta para lectores de pantalla.
- Descripción, intereses y verificación debajo, dentro de la misma "libreta". La portada actual pasa a ser la "tapa" del pasaporte en la parte superior.
- Publicaciones como hoy, debajo.
- En escritorio, la página del pasaporte puede ir más ancha; en celular, todo en una columna sin scroll horizontal.

Datos nuevos (equipo), editables en `ProfileForm` y opcionales:

- **Pronombres:** texto libre corto (máx. 30), con sugerencias "él", "ella", "elle", "él/elle", "ella/elle". (decisión de Claude)
- **Idiomas:** lista de chips (máx. 8), con sugerencias de idiomas comunes y texto libre.
- **Bandera del país de origen:** sale de `paisOrigen`. Hoy `paisOrigen` es texto libre; se cambia a un selector de países (nombre en español → código ISO) que acepta los valores existentes. Si el valor guardado no coincide con un país conocido, se muestra el texto sin bandera.
  - **Banderas como imágenes SVG, no emojis** (decisión de Claude): Windows no dibuja los emojis de bandera (muestra "PE"). Usar un paquete npm con banderas SVG empaquetadas (p. ej. `country-flag-icons`), sin cargarlas de un CDN.
- Los nuevos campos se agregan a `User`, `ProfileChanges`, validación y semillas (Alex Romero y los demás usuarios demo con pronombres, idiomas y país).

## 9. Lo que queda al builder

- Los hex exactos de los tonos oscuros y suaves, con las reglas de contraste de la sección 3.
- Las ilustraciones SVG de las postales y del pasaporte.
- Si "ir a una publicación" es una página nueva o la tarjeta expandida.
- La estructura interna de componentes, el orden de las tareas y los textos finos.
- Mantener las convenciones del proyecto: español en código y UI, CSS Modules, servicios en `src/services/` con pruebas, `HashRouter`, accesibilidad (foco visible, `aria-*`, navegación con teclado).
