# Rumi — Amigos, publicar y verificación (diseño)

- **Fecha:** 2026-10-21
- **Parte de:** Release 01 (MVP, solo front end). Modifica lo descrito en `2026-10-18-rumi-mvp-design.md`; lo que no se menciona aquí sigue igual.
- **Maquetas aprobadas:** `.superpowers/brainstorm/44-1792641836/content/` (`inicio-amigos.html` opción B, `publicar-modal.html`, `publicacion-expandida.html`, `perfil-verificacion.html`). Estas maquetas no se versionan; este documento contiene todo lo necesario.

Convención: **(equipo)** marca lo que pidió el equipo. **(decisión de Claude)** marca lo que decidió quien diseñó; se puede cambiar sin volver a preguntar.

## 1. Intención

Después de usar el MVP, el equipo quiere que Rumi se sienta más como una red social de estudiantes y menos como un formulario:

- **Registro rápido.** El registro pide lo mínimo. Destino, fechas y universidad se completan después, desde el perfil.
- **Identidad y confianza.** Cada persona tiene un **nombre de usuario único** para encontrarla. La cuenta se puede **verificar** (DNI, celular y universidad) para que otros sepan que es real antes de compartir piso.
- **Relaciones.** Hay **amigos** por solicitud aceptada, visibles en el inicio como historias de Instagram, con acceso directo al chat.
- **Publicaciones más ricas y guiadas.** Cada tipo tiene su propia descripción y sus campos. Hay hashtags automáticos y escritos a mano, fotos visibles en la tarjeta, enlace del anuncio y ubicación en un mapa. Precio y "hasta" son opcionales.
- **Un chat cómodo.** La caja para escribir queda fija abajo, como en WhatsApp.

### Metas

1. Crear cuenta con nombre completo, usuario, correo, contraseña y confirmación, e iniciar sesión con usuario o correo.
2. Buscar personas solo por nombre de usuario, enviar solicitudes de amistad y aceptarlas o rechazarlas desde la campana.
3. Ver a los amigos en una fila en el inicio y abrir el chat con un toque.
4. Publicar desde una página propia (`/publicar`) con campos según el tipo, hashtags, opciones avanzadas (enlace, fotos, ubicación) y validaciones claras.
5. Ver fotos en la tarjeta y expandir cada publicación para ver el texto completo, el enlace y el mapa.
6. Filtrar alquileres por rango de precio.
7. Subir foto de perfil y de portada, editar destino, fechas y demás datos, y verificar la cuenta en 3 pasos que se pueden omitir.
8. Que `npm test`, `npm run lint` y `npm run build` pasen, con pruebas nuevas para cada comportamiento.

### No metas (no se hacen ahora)

- Enviar SMS o correos reales, o validar un DNI contra un registro oficial.
- Buscar direcciones en texto (geocodificación). El pin se pone tocando el mapa.
- Chat en tiempo real entre personas distintas, notificaciones push, bloquear o denunciar usuarios.
- Cambiar el nombre de usuario, eliminar amigos, editar o borrar publicaciones.
- Un backend. Todo sigue en `localStorage` detrás de `src/services/`.

### Anti-metas (si pasa esto, salió mal aunque "funcione")

- Guardar en el navegador el **número completo del documento** o la **foto del DNI**.
- Que el precio o la fecha "hasta" sean **obligatorios**.
- Que **Lugar recomendado** pida fechas.
- Que la app quede en blanco o pierda datos sin avisar cuando el navegador se queda sin espacio por las fotos.
- Que la caja del chat se desplace con los mensajes.

## 2. Restricciones

- Todo lo del spec original sigue vigente: TypeScript strict, React + Vite, CSS Modules, colores solo de `src/styles/tokens.css`, textos en español, `HashRouter`, `base: './'`, servicios asíncronos y la UI sin tocar `localStorage`.
- **Dependencias nuevas permitidas:** `leaflet`, `react-leaflet` y `@types/leaflet`. Ninguna otra.
- **Mapa:** teselas de OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) con la atribución obligatoria "© OpenStreetMap". Sin claves ni servicios de pago.
- **Espacio:** `localStorage` da unos 5 MB por sitio, así que las fotos se comprimen en el navegador (ver §6). Hay que quedar dentro de ese límite y avisar si se llena.
- **Datos de demo:** `SEED_VERSION` sube a `'3'`. Los navegadores con datos viejos se reinician solos, como ya ocurre.

## 3. Cuentas (equipo)

### Registro (`/registro`)
- **Campos:** Nombre completo, Nombre de usuario, Correo, Contraseña y Confirmar contraseña.
- **Se quitan del registro:** universidad, país de origen, ciudad y país destino, y fechas. Ver la decisión de Claude más abajo.

### Nombre de usuario
- Es único y se escribe con o sin `@`; se guarda sin `@` y en minúsculas.
- **Formato (decisión de Claude):** de 3 a 20 caracteres, solo `a-z`, `0-9`, `.` y `_`. No puede empezar ni terminar en `.`.
- **Errores:**
  - "Ese nombre de usuario ya está en uso"
  - "Usa de 3 a 20 letras minúsculas, números, punto o guion bajo"

### Contraseña
- Confirmar contraseña. Si no coinciden: "Las contraseñas no coinciden".

### Inicio de sesión (`/login`)
- El campo se llama **"Usuario o correo"**. Si el texto tiene `@` en medio, se busca como correo; si no, como usuario (se ignora un `@` inicial).
- El mensaje de error sigue siendo uno solo para todo: "Correo o contraseña incorrectos" pasa a decir "Usuario, correo o contraseña incorrectos".

### Decisiones de Claude
- **País de origen y fechas del intercambio** también salen del registro y pasan a "Editar perfil", porque van con el destino.
- Todos los datos del destino quedan opcionales en el modelo, y la UI no muestra lo que falta:
  - la tarjeta muestra `@usuario` si no hay universidad ni destino;
  - el perfil propio sin destino muestra "Agrega tu destino" con un enlace a editar.

## 4. Amigos y búsqueda

### Solicitudes (equipo)
- Dos personas son amigas cuando una envía una solicitud y la otra la **acepta**.
- Las solicitudes recibidas se ven en la **campana** con un contador, como en la opción B de la maqueta.

### Campana (decisión de Claude)
- La campana está en la barra superior del celular y, en laptop, en el menú lateral junto al logo.
- Lleva a la página **`/solicitudes`**, con la lista de solicitudes recibidas pendientes. Cada una muestra avatar, nombre, `@usuario` y los botones **Aceptar** y **Rechazar**.
- El contador muestra solo las pendientes y se oculta en 0.

### Fila de amigos en el inicio (equipo)
- Va arriba del feed, con círculos estilo historias de Instagram: foto o iniciales y el primer nombre debajo.
- Al tocar un amigo se abre (o se crea) la conversación y se navega a `/mensajes/:id`.
- **Detalles (decisión de Claude):**
  - El primer círculo es **"Agregar"** (borde punteado y +) y lleva a `/buscar`.
  - Los amigos se ordenan por la conversación más reciente; los que no tienen conversación van al final, por nombre.
  - Un **anillo naranja-celeste** marca a un amigo con mensajes sin leer.
  - Sin amigos, se ve solo "Agregar" y el texto "Agrega amigos para escribirles más rápido".

### Botón de amistad (decisión de Claude)
- Aparece en el perfil de otra persona y en cada resultado de búsqueda, con estos estados:

  | Estado | Texto del botón | Qué hace |
  |---|---|---|
  | `ninguna` | Agregar amigo | Envía la solicitud |
  | `enviada` | Solicitud enviada | Deshabilitado |
  | `recibida` | Aceptar solicitud | Acepta |
  | `amigos` | Amigos ✓ | Solo informativo |

- **Aceptación automática (solo demo):** cuando **cualquier cuenta** envía una solicitud a uno de los **usuarios de ejemplo** de la demo, ese usuario la acepta solo entre 2 y 4 segundos después, igual que la respuesta automática del chat. Así el flujo se ve completo aunque en la presentación se cree una cuenta nueva.
  - Las solicitudes a cuentas creadas en el navegador **no** se aceptan solas: se quedan pendientes hasta que esa cuenta entre y responda.
- **Solicitud rechazada (decisión de Claude):**
  - Quien la envió sigue viendo "Solicitud enviada" y no puede reenviarla. Así no se entera del rechazo ni puede insistir; es lo habitual en redes sociales.
  - Quien la rechazó ve "Agregar amigo" y puede enviar una solicitud nueva más adelante, que se trata como una solicitud normal.
  - `relation(a, b)` devuelve `'enviada'` a quien envió una solicitud rechazada y `'ninguna'` a quien la rechazó.

### Mensajes sin amistad (decisión de Claude)
- Se puede escribir a cualquiera desde una publicación o un perfil sin ser su amigo; por ejemplo, para preguntar por un cuarto. La amistad es un acceso rápido, no un requisito.

### Buscar (`/buscar`, equipo)
- Busca **solo personas**, solo por **nombre de usuario**.
- Se quitan las pestañas, el filtro de alquileres y los filtros de ciudad, universidad y fechas.
- **Detalles (decisión de Claude):**
  - Un solo campo, "Nombre de usuario", con placeholder `@valeria`.
  - Coincide si el usuario **contiene** lo escrito (sin `@`, ignorando mayúsculas y tildes).
  - No incluye a quien busca.
  - Con el campo vacío se muestra "Escribe un nombre de usuario para buscar" en vez de todos los usuarios.
  - Cada resultado muestra avatar, nombre, `@usuario`, destino si lo tiene, "Ver perfil" y el botón de amistad.

## 5. Publicaciones

### 5.1 Página para publicar `/publicar` (equipo)
- Es una página aparte, no un modal: tiene mucha información.
- El botón + de la navegación lleva aquí; ya no hay cuadro para publicar en el inicio.
- Al publicar se vuelve a `/`, con el filtro en "Todo" y la publicación nueva arriba.
- "Cancelar" vuelve atrás sin guardar.

**Selector de tipo:** cuatro botones en una cuadrícula de 2×2. Debajo, una caja celeste con la **descripción del tipo elegido** (equipo). El placeholder del texto también cambia según el tipo. Textos (decisión de Claude, ajustables):

| Tipo | Descripción | Placeholder del texto |
|---|---|---|
| Busco roomie | Cuenta a quién buscas para compartir piso: cuándo llegas, por qué zona y cómo eres como roomie. | Llego a Madrid en febrero y busco con quién compartir piso cerca de la universidad… |
| Ofrezco cuarto | Publica un cuarto o piso disponible: cómo es, cuánto cuesta y desde cuándo está libre. | Habitación exterior en piso compartido, a 10 minutos de la universidad… |
| Lugar recomendado | Recomienda un sitio que valga la pena: un restaurante, una zona bonita para pasear, un café para estudiar… | Buenísimo para comer barato y conocer gente los fines de semana… |
| Viaje | Propón un viaje o una escapada y encuentra con quién ir. | Escapada a Sintra el fin de semana; busco 2 o 3 personas para compartir gastos… |

**Campos por tipo.** "Req." significa obligatorio; "Opc.", opcional. Todo lo que no está marcado "Req." es opcional (equipo: el precio y "hasta" no son obligatorios).

| Campo | Busco roomie | Ofrezco cuarto | Lugar recomendado | Viaje |
|---|---|---|---|---|
| Texto (1–500) | Req. "Descripción" | Req. "Descripción" | Req. "¿Por qué lo recomiendas?" | Req. "Descripción" |
| ¿Qué tipo de lugar? (chips) | — | — | Req. | — |
| Nombre del lugar | — | — | Req. | — |
| Ciudad | Req. | Req. | Req. | Req. "Destino" |
| Zona o barrio | Opc. | Opc. | Opc. "Barrio" | — |
| ¿A cuántas personas buscas? (1–6, equipo) | Req., por defecto 1 | — | — | — |
| Precio al mes: desde / hasta | Opc. "Presupuesto al mes" | Opc. | — | — |
| Moneda (EUR, USD, PEN, ARS, MXN, CLP, COP, CAD) | Si hay precio | Si hay precio | — | — |
| Fechas: desde / hasta | Opc. "Llego" / Opc. "Hasta" | Opc. "Disponible desde" / Opc. "Hasta" | — (equipo) | Opc. "Ida" / Opc. "Vuelta" |
| Hashtags | Sí | Sí | Sí | Sí |
| Avanzado: enlace | Opc. | Opc. "Enlace del anuncio (Airbnb, Idealista, Booking…)" | Opc. "Web o Google Maps" | Opc. |
| Avanzado: fotos (hasta 4) | Opc. | Opc. | Opc. | Opc. |
| Avanzado: ubicación en el mapa | — | Opc. | Opc. | — |

**Categorías de lugar (decisión de Claude):**

| Valor | Etiqueta | Hashtag |
|---|---|---|
| `restaurante` | Restaurante | `#Restaurante` |
| `cafe` | Café | `#Café` |
| `zona` | Zona bonita | `#ZonaBonita` |
| `bar` | Bar | `#Bar` |
| `museo` | Museo | `#Museo` |
| `tienda` | Tienda | `#Tienda` |
| `otro` | Otro | sin hashtag |

**Validaciones** (en el servicio, con mensajes en `MSG`):
- **Precio:** si se pone uno, debe ser mayor que 0; si van los dos, "desde" no puede ser mayor que "hasta" ("El precio 'desde' no puede ser mayor que 'hasta'").
- **Personas:** entero de 1 a 6.
- **Fechas:** "hasta" no puede ser anterior a "desde" (`MSG.fechasPost`, ya existe).
- **Enlace:** debe empezar con `http://` o `https://` y ser una URL válida ("Ingresa un enlace que empiece con https://").
- **Nombre del lugar:** de 1 a 80 caracteres.
- Los campos que no corresponden al tipo se descartan al guardar, como ya ocurre con precio y zona.

**Opciones avanzadas (equipo):** una sección plegable, "Opciones avanzadas", con enlace, fotos y ubicación según el tipo.
- **Fotos:** botón "Agregar fotos" (`accept="image/*"`, varias a la vez), hasta 4. Cada una se ve en miniatura con su ✕ para quitarla.
- **Ubicación:**
  - Un mapa de unos 240 px de alto. Al tocarlo se pone o mueve el pin, y hay un botón "Quitar ubicación".
  - El mapa se centra en la ciudad escrita si está en la tabla de coordenadas de la demo (§9); si no, en Madrid. Zoom 13.

### 5.2 Hashtags (equipo)
- **Automáticos:** se agregan solos al elegir opciones. Su texto se arma quitando espacios y poniendo mayúscula a cada palabra; las tildes se conservan.
  - Tipo: `#BuscoRoomie`, `#OfrezcoCuarto`, `#LugarRecomendado`, `#Viaje`.
  - Ciudad (`Ciudad de México` → `#CiudadDeMéxico`) y zona o barrio.
  - Categoría de lugar.
- **Botones de sugerencia por tipo** (decisión de Claude). Tocarlos agrega o quita el hashtag:

  | Tipo | Sugerencias |
  |---|---|
  | Busco roomie | `#NoFumador`, `#Ordenado`, `#Mascotas`, `#Estudiante`, `#Tranquilo` |
  | Ofrezco cuarto | `#Amoblado`, `#GastosIncluidos`, `#Mascotas`, `#CercaDelMetro`, `#BañoPrivado` |
  | Lugar recomendado | `#Barato`, `#ParaEstudiar`, `#Vegano`, `#FinDeSemana`, `#Vistas` |
  | Viaje | `#Mochilero`, `#FinDeSemana`, `#CompartirGastos`, `#Naturaleza` |

- **Escritos a mano:** un campo "Agregar hashtag" donde escribes y confirmas con Enter, coma o espacio. Se acepta con o sin `#`.
- **Reglas:**
  - Cada hashtag tiene de 2 a 30 caracteres, solo letras (con tildes y ñ), números y `_`.
  - No hay duplicados; se comparan sin importar mayúsculas ni tildes.
  - Máximo 10 por publicación. Al llegar a 10, el campo muestra "Máximo 10 hashtags".
- Todos se ven como chips con ✕, y se puede quitar cualquiera, incluidos los automáticos.
  - **Decisión de Claude:** si quitas uno automático, no vuelve a aparecer solo hasta que cambies el campo que lo generó.
- Se guardan **sin `#`** en `post.hashtags` y se muestran con `#` en color naranja oscuro.

### 5.3 Tarjeta de publicación (feed y perfil)
- **Plegada:**
  - Autor (avatar o foto, nombre, y "universidad → ciudad destino" o `@usuario` si faltan datos), tiempo y etiqueta del tipo.
  - El texto, recortado a 4 líneas.
  - Según el tipo:
    - **Busco roomie:** "Busca N roomie(s)".
    - **Lugar recomendado:** el nombre del lugar y su categoría.
    - El rango de precio ("450–500 € al mes"; si solo hay uno, "desde 450 €" o "hasta 500 €").
  - Las **fotos en una franja de miniaturas** (equipo: visibles sin expandir). Al tocar una se abre en grande, en un visor simple con ✕ y flechas si hay varias.
  - Los hashtags, el botón **"Ver más"** y las acciones de siempre.
- **Expandida ("Ver más" / "Ver menos"):**
  - El texto completo y las fechas.
  - Un botón con el enlace ("Ver anuncio en airbnb.com", con el dominio del enlace; abre en otra pestaña con `rel="noopener noreferrer"`).
  - Si hay ubicación, un **mapa** con el pin (no editable, unos 200 px de alto) y "Abrir en Google Maps" (`https://www.google.com/maps?q=LAT,LNG`).
- **Decisión de Claude:** "Ver más" solo aparece si hay algo más que mostrar: texto recortado, fechas, enlace o mapa.

### 5.4 Filtro de precio de alquileres (equipo)
- Al elegir el chip **"Ofrezco cuarto"** en el inicio aparece "Precio al mes" con **dos controles: desde y hasta**.
- **Detalles (decisión de Claude):**
  - Es un slider de dos extremos, de 0 al precio más alto publicado, redondeado a la centena siguiente, con pasos de 25.
  - Muestra los valores ("Desde 400 € · Hasta 550 €").
  - Las monedas no se convierten; el filtro compara números.
  - Mientras el rango sea el completo, se ven todas. Si se mueve, una publicación se ve cuando su rango se cruza con el elegido. Las que no tienen precio se ocultan mientras el filtro esté movido.
  - Ver §6 para la función de servicio.

## 6. Perfil y verificación

### Perfil (`/perfil`, `/perfil/:id`)
- **Portada:** si no hay foto, se usa la banda celeste actual. Tu perfil tiene un botón de cámara para cambiarla (equipo).
- **Foto de perfil:** circular, con un botón de cámara en tu perfil (equipo). Si no hay foto, se ven las iniciales.
- Debajo del nombre se ve `@usuario`.
- Se **quita el presupuesto** (equipo), del modelo, la vista y el formulario.
- **Insignias de verificación:** "✓ DNI", "✓ Celular" y "✓ Universidad" en verde las verificadas, y "Sin verificar" en gris las que faltan. Solo se muestran las verificadas en el perfil de otros; en el tuyo se ven las tres.
- **En tu perfil:** "Verificar cuenta (N de 3)", "Editar perfil", "Cerrar sesión" y "Restablecer datos de demo". Si ya completaste los tres pasos, se ve "Cuenta verificada" en vez del primer botón.
- **En el de otros:** el botón de amistad (§4) y "Enviar mensaje".

### Editar perfil
- **Campos:** nombre completo, país de origen, ciudad destino, país destino, fechas de llegada y salida (las dos o ninguna), biografía, intereses e Instagram.
- **No se editan aquí:** el usuario (no cambia) ni la universidad (solo la pone la verificación).
- Las fotos se cambian con los botones de cámara, fuera del formulario.

### Fotos (decisión de Claude)
- Se elige el archivo con `<input type="file" accept="image/*">`. Se procesa en el navegador con un `<canvas>` y se guarda como data URL JPEG:
  - **Foto de perfil:** recorte cuadrado centrado, 256×256, calidad 0.8.
  - **Portada:** se escala para cubrir 1200×400 y se recorta al centro, calidad 0.75.
  - **Fotos de publicaciones:** se escalan para que el lado mayor mida 900 px, calidad 0.65 (ver el presupuesto de espacio, más abajo).
- Si un archivo no es una imagen o no se puede leer: "No pudimos leer esa imagen. Prueba con otra (JPG o PNG)".
- **Presupuesto de espacio para fotos (decisión de Claude):**
  - El objetivo es que las fotos nunca dejen a la app sin espacio para lo demás: chat, solicitudes y perfil.
  - Las fotos (avatar, portada y fotos de publicaciones) tienen en total un **presupuesto de 3 MB**, medido como la suma de la longitud de sus data URLs. Quedan unos 2 MB para todo lo demás.
  - Antes de guardar una foto nueva, el servicio comprueba el presupuesto. Si se pasaría, no guarda nada y lanza `StorageFullError`, y la UI muestra "Ya no hay espacio en este navegador para más fotos. Usa menos fotos o imágenes más livianas".
  - Al cambiar el avatar o la portada, la foto anterior deja de contar.
  - Para que alcance, las fotos de publicaciones bajan a **900 px de lado mayor y calidad 0.65** (unos 60–120 KB cada una). Con eso caben unas 25 publicaciones con 4 fotos.
- **Si aun así se llena el almacenamiento** (cualquier escritura):
  - `storage.ts` distingue el error de cuota (`QuotaExceededError` o nombres equivalentes) de los demás y lanza `StorageFullError` **sin pasar a memoria**.
  - La UI muestra un error general: "No hay espacio en este navegador. Restablece los datos de demo desde tu perfil".
  - Los otros errores de almacenamiento siguen pasando a memoria, como hasta ahora.
  - La respuesta automática del chat y la aceptación automática de solicitudes ignoran en silencio un `StorageFullError`: no se guardan, pero no rompen la pantalla.

### Verificación (`/verificar`, equipo: 3 pasos que se pueden omitir)
- Es una página con un indicador de pasos (DNI, Celular, Universidad).
- Cada paso tiene **"Verificar"** y **"Omitir este paso"**; los ya verificados se ven completos y se saltan.
- Al terminar o al omitir el último, una pantalla final muestra qué quedó verificado, con el botón "Volver a mi perfil".
- El texto de arriba: "Así otros estudiantes saben que eres una persona real antes de compartir piso contigo."

1. **DNI**
   - **Campos:**
     - "Número de DNI o pasaporte": de 6 a 12 letras o números (decisión de Claude: también hay estudiantes extranjeros).
     - "Foto del documento (frente)": obligatoria para verificar; se ve en miniatura.
   - **Privacidad (anti-meta):**
     - La foto **no se guarda**: se descarta al terminar el paso.
     - Del número solo se guardan los **últimos 3 caracteres**, y el perfil propio muestra "DNI •••123".
   - En la demo, la verificación es inmediata.
2. **Celular**
   - **Campos:** código de país (+51, +56, +52, +54, +57, +34, +351, +1) y número de 6 a 12 dígitos.
   - "Enviar código" genera un código aleatorio de 6 dígitos y lo **muestra en pantalla**: "Demo: no se envían SMS reales. Tu código es 482913."
   - Ingresas el código y tocas "Verificar". Si es incorrecto: "El código no es correcto".
   - Se guarda el número enmascarado ("+51 ••• ••• 321").
3. **Universidad**
   - **Campos:** "Universidad" (texto) y "Correo institucional".
   - Se rechazan los dominios públicos (gmail.com, hotmail.com, outlook.com, yahoo.com, live.com, icloud.com) con "Usa el correo de tu universidad, no uno personal".
   - El código simulado funciona igual que en el celular ("Demo: no se envían correos reales…").
   - Al verificar, se guardan `user.universidad`, la universidad verificada y el correo enmascarado ("a•••@ulima.edu.pe").
- **Los códigos viven solo en el estado del componente**, nunca en el almacenamiento.

## 7. Chat: la caja queda fija (equipo)
- `/mensajes/:id` ocupa exactamente el alto visible, sin scroll de página:
  - **En el celular:** `100dvh` menos la barra superior y la barra inferior.
  - **En laptop:** `100dvh` menos los márgenes del contenido.
- El encabezado queda arriba, **solo la lista de mensajes tiene scroll** y la caja para escribir queda abajo, siempre en el mismo lugar.
- Al abrir la conversación y cada vez que llega un mensaje, la lista baja al final (se mueve la lista, no la página).
- Al abrir la conversación, sus mensajes quedan como **leídos** para quien la abre (para el anillo de §4).

## 8. Cambios en el modelo de datos

```ts
type LugarCategoria = 'restaurante' | 'cafe' | 'zona' | 'bar' | 'museo' | 'tienda' | 'otro'

interface User {
  id: string
  nombre: string
  usuario: string            // NUEVO: único, minúsculas, sin '@'
  email: string
  passwordHash: string
  universidad?: string       // ahora opcional; solo la pone la verificación
  paisOrigen?: string        // ahora opcionales…
  ciudadDestino?: string
  paisDestino?: string
  fechaLlegada?: string      // …las dos fechas o ninguna; salida > llegada
  fechaSalida?: string
  bio: string
  intereses: string[]
  instagram?: string
  avatarUrl?: string         // NUEVO: data URL o ruta relativa
  portadaUrl?: string        // NUEVO
  verificacion: {            // NUEVO
    dni?: { ultimos: string; verificadoEn: string }
    celular?: { enmascarado: string; verificadoEn: string }
    universidad?: { nombre: string; correoEnmascarado: string; verificadoEn: string }
  }
  creadoEn: string
  // SE QUITAN: presupuesto, moneda
}

interface Post {
  id: string
  autorId: string
  tipo: PostType
  texto: string
  ciudad: string
  zona?: string
  fechaDesde?: string
  fechaHasta?: string
  precioMin?: number         // REEMPLAZA a `precio`
  precioMax?: number
  moneda?: string
  personas?: number          // NUEVO: solo busco-roomie (1–6)
  categoria?: LugarCategoria // NUEVO: solo lugar
  nombreLugar?: string       // NUEVO: solo lugar
  hashtags: string[]         // NUEVO: sin '#', máx. 10
  enlace?: string            // NUEVO
  fotos: string[]            // NUEVO: data URLs o rutas relativas, máx. 4
  ubicacion?: { lat: number; lng: number } // NUEVO: solo ofrezco-cuarto y lugar
  creadoEn: string
}

interface FriendRequest {    // NUEVO, colección 'friendRequests'
  id: string
  de: string
  para: string
  estado: 'pendiente' | 'aceptada' | 'rechazada'
  creadoEn: string
  respondidoEn?: string
}

interface Conversation {
  id: string
  participantes: [string, string]
  actualizadoEn: string
  leidoHasta: Record<string, string> // NUEVO: userId → ISO del último mensaje leído
}
```

`RegisterInput`, `ProfileChanges`, `NewPostInput` y `UserSearchFilters` se ajustan en consecuencia. `UserSearchFilters` queda solo con `usuario`.

## 9. Servicios (`src/services/`)

Se mantiene la regla: la UI solo usa servicios asíncronos y nunca recibe `passwordHash`.

**`authService`**
- `register({ nombre, usuario, email, password, confirmPassword })`
- `login(identificador, password)`

**`usersService`**
- `searchByUsername(texto, currentUserId)` reemplaza a `search`.
- `update(id, cambios)`: sin presupuesto; las fechas van juntas.
- `setAvatar(id, dataUrl)` y `setPortada(id, dataUrl)`.
- `verifyDni(id, { numero })`: guarda solo los últimos 3.
- `verifyCelular(id, { codigoPais, numero })`.
- `verifyUniversidad(id, { universidad, correo })`: valida el dominio.
- Los pasos con código validan el código en la UI. El servicio recibe solo los datos ya confirmados y guarda la versión enmascarada.

**`friendsService` (nuevo)**
- `sendRequest(de, para)`: no se permite a uno mismo, ni duplicar una pendiente, ni pedírselo a quien ya es amigo. Si la otra persona ya te había enviado una, se acepta directamente.
- `accept(requestId, userId)` y `reject(requestId, userId)`: solo quien la recibe.
- `listIncoming(userId)` (pendientes, con datos del remitente), `listFriends(userId)` y `relation(a, b)` (`'ninguna' | 'enviada' | 'recibida' | 'amigos'`).
- `subscribe(userId, cb)`, para que la campana y la fila se actualicen.
- Auto-aceptación de la demo según §4.

**`postsService`**
- `create` con los campos nuevos y sus validaciones.
- `searchRentals({ ciudad?, precioDesde?, precioHasta? })` con cruce de rangos.
- `buildAutoHashtags(input)` como función pura exportada, para poder probarla.

**`chatService`**
- `markRead(conversacionId, userId)`.
- `listConversations` incluye `noLeidos: boolean`, y existe `unreadFrom(userId)` para la fila de amigos.

**`storage`**
- `StorageFullError` según §6.

**`utils/image.ts` (nuevo)**
- `compressImage(file, { modo: 'avatar' | 'portada' | 'post' }): Promise<string>`.
- En jsdom (pruebas) se simula: canvas no está disponible.

**Datos de demo (`seed.ts`, versión 3)**
- **Usuarios:** cada uno recibe su usuario (`alex.romero`, `valeria.rios`, `mateo.fernandez`, …, sin tildes). Se quitan presupuesto y moneda.
- **Verificaciones y universidad (decisión de Claude):** la universidad solo aparece si está verificada.
  - Todos los usuarios de ejemplo **menos Alex y Joaquín** tienen la universidad verificada, con su universidad actual. Así las tarjetas siguen mostrando "universidad → ciudad".
  - Alex tiene DNI y celular verificados pero **no la universidad**, para mostrar el paso 3 en la presentación. Joaquín no tiene universidad.
  - El resto de verificaciones (DNI y celular) es variado: Valeria tiene las tres.
- **Amistades:** Alex es amigo de Valeria, Mateo y Diego, y tiene **2 solicitudes pendientes** recibidas, de Sofía y Andrés.
- **Publicaciones:**
  - Precio pasa a rango: Moncloa 450–500 EUR, Chamberí 600 EUR, Gràcia 520–560 EUR.
  - Busco roomie lleva `personas` (Valeria 1, Sofía 2, Joaquín 1).
  - Lugar recomendado lleva `categoria` y `nombreLugar`.
  - Todas llevan `hashtags` automáticos y algunas sugeridas.
  - Llevan **ubicación**: Moncloa 40.4350, -3.7190; Chamberí 40.4340, -3.7030; Gràcia 41.4036, 2.1567; Mercado de San Fernando 40.4086, -3.7006; LX Factory 38.7034, -9.1786; Taquería en San Rafael (CDMX) 19.4380, -99.1590.
- **Coordenadas de ciudades** para centrar el mapa al publicar: Madrid, Barcelona, Lisboa, Buenos Aires, Ciudad de México, Santiago, Montreal y Lima.
- **Fotos de demo:** se usan las que el equipo ponga en `public/demo/` (ver la pregunta abierta). Si no hay, las publicaciones de ejemplo van sin fotos.

## 10. Pruebas

Con el mismo estilo de siempre: TDD, Vitest y RTL, una prueba por comportamiento.

- **Registro:**
  - usuario duplicado (sin importar mayúsculas);
  - formato de usuario inválido;
  - contraseñas que no coinciden;
  - el registro sin campos de destino funciona.
- **Login:** entra con usuario, con `@usuario` y con correo; mensaje único de error.
- **Amigos:**
  - enviar, duplicado, a uno mismo, aceptar y rechazar (solo quien la recibe);
  - solicitud cruzada que se acepta sola;
  - `relation` en cada estado, incluida una rechazada (quien envió ve `'enviada'` y no puede reenviar; quien rechazó ve `'ninguna'`);
  - auto-aceptación con temporizadores falsos, solo cuando quien recibe es un usuario de ejemplo; ignora `StorageFullError`;
  - la campana con su contador y la página `/solicitudes`.
- **Fila de amigos:** orden; tocar abre el chat; anillo de no leídos (y que desaparece al abrir el chat); estado sin amigos.
- **Buscar:** por usuario parcial, sin `@` y sin tildes; campo vacío; botón de amistad en sus 4 estados.
- **Publicar:**
  - campos por tipo (Lugar recomendado sin fechas; personas solo en Busco roomie);
  - hashtags automáticos, sugeridos y escritos;
  - límite de 10, duplicados y quitar uno;
  - validaciones de precio, enlace y fechas;
  - descarte de campos que no corresponden;
  - fotos (con la compresión simulada) con máximo 4;
  - ubicación (con el componente de mapa simulado);
  - vuelve al inicio con la publicación arriba.
- **Tarjeta:** fotos visibles plegada; "Ver más" con texto completo, enlace y mapa; "Ver más" oculto si no hay nada más.
- **Filtro de precio:** cruce de rangos y publicaciones sin precio.
- **Perfil:** subir avatar y portada (simulado); la foto anterior deja de contar en el presupuesto; superar los 3 MB de fotos muestra el mensaje y no guarda; un `StorageFullError` general muestra el error de "Restablece los datos de demo"; sin presupuesto mensual; insignias.
- **Verificación:** cada paso verificado y omitido; código incorrecto; dominio público rechazado; DNI guarda solo 3 caracteres y **nunca la foto**; los códigos no tocan el almacenamiento.
- **Chat:** que la lista sea la que tiene scroll se revisa a mano en el navegador; `markRead` y `noLeidos` se prueban en el servicio.
- **Verificación manual:** a 375×812 y 1280×800, recorriendo cada pantalla nueva.

## 11. Lo que queda al criterio de quien construye

- Estilos exactos: espaciados, tamaños, animación del "Ver más" y apariencia del slider de dos extremos (puede ser propio o dos `input type="range"` superpuestos).
- Cómo partir los componentes nuevos (página de publicar, tarjeta, visor de fotos, mapa, campana, fila de amigos, pasos de verificación), respetando un archivo y un `.module.css` por componente.
- Cargar Leaflet de forma diferida (lazy) para no inflar el inicio.
- Mensajes de error que este documento no fija, en el mismo tono de `MSG`.

## 12. Pregunta abierta

- **Fotos de la demo:** ¿el equipo pondrá fotos propias (de cuartos, lugares y perfiles) en `public/demo/` para las publicaciones de ejemplo, o van sin fotos?
