## Context

Estado actual:
- **Backend**: Laravel 13 con Sanctum en modo SPA (cookie de sesión). Solo existe el modelo `User` (UUID). Las rutas protegidas van en el grupo `auth:sanctum` de `routes/api.php`. Pruebas con PHPUnit y SQLite en memoria.
- **Frontend**: React con React Router. Las pantallas cuelgan de `<RutaProtegida>` y `<Marco>`. Hay un cliente de API (`src/api/cliente.js`, función `peticion()`) que gestiona CSRF, tiempos de espera y sesión caducada, y lanza `ErrorApi` con el JSON de la respuesta. Componentes base: Botón, Tarjeta, Aviso, CampoTexto, CampoContrasena, Casilla, CabeceraPantalla, EstadoVacio, MenuInferior. Pruebas con Vitest y Testing Library.
- La pantalla Rebaño es un estado vacío y la acción "Alta" del menú ➕ está marcada como "Próximamente".

Restricciones del documento de diseño:
- Cientos de animales, no miles. Dos usuarios con los mismos permisos.
- Uso desde el móvil, a pleno sol: botones grandes, pocos toques, teclado numérico para buscar por crotal.
- Todos los registros usan UUID generados en el cliente (fase 2: altas sin conexión).
- Cada registro guarda quién lo creó y quién lo modificó por última vez.
- Los carneros usan la misma ficha que las ovejas, marcados como reproductores.

## Goals / Non-Goals

**Goals:**
- Un modelo de datos del animal que sirva ya para las fases siguientes (lotes, bajas, reproducción) sin tener que rehacerlo.
- Validaciones en el servidor como fuente de verdad, repetidas en el frontend solo donde ahorran un viaje (campos obligatorios, formato del crotal).
- Encontrar un animal en pocos toques escribiendo los últimos dígitos del crotal.
- Un formulario único para alta y edición.
- Dejar listos los patrones (enumeraciones, auditoría, Form Requests, Resources, módulo de API del frontend) que copiarán las siguientes funcionalidades.

**Non-Goals:**
- Fotos, lotes, bajas, altas históricas, carga desde Excel, contenido de Reproducción, Sanidad e Historial, borrado y funcionamiento sin conexión (ver la propuesta).
- Control de ediciones simultáneas: con dos usuarios, gana el último que guarda.

## Decisions

### 1. Un modelo `Animal` y una tabla `animales`

Ovejas y carneros comparten ficha, así que van en la misma tabla. Se llama `Animal`/`animales` (y no `Oveja`) porque también contiene machos y evita frases raras como "la oveja es macho". En la interfaz se sigue hablando de "Rebaño" y de "ficha".

- Laravel pluralizaría `Animal` como `animals` (en inglés), así que el modelo indica `protected $table = 'animales'`.
- Usa `HasUuids`, pero **sin generar el UUID en el servidor al crear desde la API**: el `id` llega en la petición (decisión 5). `HasUuids` solo lo genera si viene vacío, lo que sirve para la factoría y el seeder.

Columnas:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID, clave primaria | Lo genera el cliente |
| `codigo_oficial` | string(14), único | Normalizado: `ES` + 12 dígitos |
| `tipo_electronico` | string | `bolo` \| `crotal_electronico` \| `ninguno` |
| `nombre_o_numero` | string(40), nulo | Identificador interno opcional |
| `sexo` | string | `hembra` \| `macho` |
| `reproductor` | boolean, por defecto `false` | Solo puede ser `true` en machos |
| `raza` | string(50), nulo | Texto libre |
| `fecha_nacimiento` | date, nulo | Nula si la precisión es desconocida |
| `precision_nacimiento` | string | `exacta` \| `mes` \| `anio` \| `desconocida` |
| `origen` | string | `nacida` \| `comprada` |
| `madre_id` | UUID, nulo, FK a `animales` | `nullOnDelete` |
| `padre_id` | UUID, nulo, FK a `animales` | `nullOnDelete` |
| `estado` | string, por defecto `activa`, índice | `activa` \| `baja` |
| `notas` | text, nulo | Máximo 2000 caracteres |
| `creado_por` | UUID, nulo, FK a `users` | `nullOnDelete` |
| `modificado_por` | UUID, nulo, FK a `users` | `nullOnDelete` |
| `created_at`, `updated_at` | timestamps | |

- Los valores cerrados se guardan como `string` (no `enum` de MariaDB) y se representan en PHP con **enumeraciones respaldadas** (`app/Enums`: `Sexo`, `TipoElectronico`, `PrecisionFecha`, `Origen`, `EstadoAnimal`), con su `cast` en el modelo. Añadir un valor nuevo (por ejemplo, un estado más) no exige cambiar la columna, y SQLite de las pruebas no tiene `enum`.
- Relaciones en el modelo: `madre()` y `padre()` (`belongsTo` a `Animal`), `creador()` y `modificador()` (`belongsTo` a `User`).
- Las claves foráneas usan `nullOnDelete` por si algún día se borra algo a mano en la base de datos; la app no borra animales.

- **Alternativa**: tablas separadas para ovejas y carneros. Duplicaría código y complicaría la genealogía y los conteos.

### 2. Código oficial: normalizar al guardar, agrupar al mostrar

- **Normalización** (`ES 0000 0000 0001`, `es000000000001` → `ES000000000001`): mayúsculas y sin ningún espacio. Se hace en dos sitios del backend:
  - En `prepareForValidation()` de los Form Requests, para que la validación de formato y de unicidad trabaje ya con el valor normalizado.
  - En un mutador del modelo (como el de `usuario` en `User`), para que cualquier otra vía (seeder, factoría, futura carga desde Excel) guarde igual.
- **Validación**: `regex:/^ES\d{12}$/`, sin excepciones (vale para todos los animales, también los comprados y los antiguos), y `unique:animales,codigo_oficial` (ignorando el propio animal al editar). Mensajes en castellano: "El código oficial debe ser ES seguido de 12 dígitos" y "Ya existe un animal con ese código oficial".
- **Presentación**: la API devuelve el código normalizado y el frontend lo agrupa con una utilidad `formatearCrotal()` → `ES 0000 0000 0001` (ES + tres grupos de 4 dígitos). Si recibe algo que no encaja, lo devuelve tal cual.
- **En el formulario**, el campo muestra el prefijo `ES` fijo y pide solo los 12 dígitos con teclado numérico (`inputmode="numeric"`). Al escribir o pegar, se quitan los espacios y un `ES` inicial si lo hubiera; mientras se escribe se muestran agrupados de 4 en 4. Se envía a la API como `ES` + dígitos. Así se teclea menos y es más difícil equivocarse.

### 3. Fecha de nacimiento con precisión

Cuatro precisiones (enumeración `PrecisionFecha`), obligatoria:

| Precisión | Qué se conoce | Se guarda en `fecha_nacimiento` | Se muestra |
|---|---|---|---|
| `exacta` | Día, mes y año | La fecha tal cual | `14/03/2021` |
| `mes` | Mes y año | El día 1 de ese mes (`2021-03-01`) | `03/2021 (aprox.)` |
| `anio` | Solo el año | El 1 de enero (`2021-01-01`) | `2021 (aprox.)` |
| `desconocida` | Nada | Nula | `Desconocida` |

- Se guarda siempre una fecha completa (y no columnas separadas de año y mes) para que en el futuro se pueda ordenar y filtrar por edad con una sola columna. La precisión dice qué parte de esa fecha es fiable.
- **Normalización en el backend**: en `prepareForValidation()`, con precisión `mes` la fecha se lleva al día 1 de su mes y con `anio` al 1 de enero. Así da igual qué día envíe el cliente, y una fecha guardada siempre es coherente con su precisión.
- **Validación**: con `exacta`, `mes` o `anio`, la fecha es obligatoria; con `desconocida`, prohibida (si llega, 422). La fecha (ya normalizada) no puede ser futura (`before_or_equal:today`): por ejemplo, con precisión `mes` se acepta el mes actual pero no el siguiente.
- **Edad** (etiqueta de la ficha y de la lista), calculada en el frontend con `calcularEdad()`: "N años" desde 1 año, "N meses" por debajo (y "Menos de 1 mes"). Con precisión `mes` o `anio` lleva delante "≈" (`≈ 5 años`, `≈ 8 meses`). Con precisión `desconocida` no se muestra la etiqueta de edad.
- **En el formulario**, la precisión es un Grupo de opciones (Fecha exacta · Mes y año · Solo el año · Desconocida) y debajo aparecen los campos que corresponden:
  - Exacta: campo de fecha (`type="date"`).
  - Mes y año: un selector de mes (enero…diciembre) y un campo de año (4 dígitos, teclado numérico).
  - Solo el año: el campo de año.
  - Desconocida: ningún campo.
  Se envía siempre como `AAAA-MM-DD` (`AAAA-MM-01` o `AAAA-01-01` en las aproximadas). No se usa `type="month"` porque algunos navegadores de escritorio lo muestran como texto libre.
- Al cambiar de precisión se conserva lo que sirva (el año, y el mes si se pasa de exacta a mes y año) para no obligar a reescribir.

- **Alternativa**: columnas separadas `anio_nacimiento`, `mes_nacimiento` y `dia_nacimiento`. Refleja mejor lo que se sabe, pero complica cualquier cálculo de edad u orden. La columna de precisión consigue lo mismo con una sola fecha.

### 4. Reglas de madre, padre y reproductor

Se validan en los Form Requests:
- `madre_id`: opcional, UUID, debe existir en `animales` y ser **hembra**. Mensaje: "La madre tiene que ser una hembra".
- `padre_id`: opcional, UUID, debe existir y ser **macho**. Mensaje: "El padre tiene que ser un macho". No se exige que esté marcado como reproductor (puede ser un macho comprado o vendido sin esa marca).
- Al editar, `madre_id` y `padre_id` no pueden ser el propio animal: "Un animal no puede ser su propia madre" / "…su propio padre". (Al crear es imposible en la práctica, pero se valida igual comparando con el `id` recibido.)
- Madre y padre pueden estar de baja: una oveja muerta sigue siendo la madre.
- **Cambio de sexo con descendencia**: al editar, si el animal ya figura como madre de algún otro, no puede pasar a macho (y al revés con el padre). Mensaje: "No se puede cambiar el sexo: figura como madre de otros animales". Sin esta regla, la genealogía quedaría incoherente.
- `reproductor`: solo puede ser `true` si el sexo es macho. Mensaje: "Solo los machos pueden marcarse como reproductores". El formulario solo muestra la casilla cuando se elige macho y envía `false` si es hembra.
- No se comprueban ciclos más largos (que una oveja sea abuela de sí misma) ni que la madre haya nacido antes que la cría: con fechas aproximadas (de mes o de año) o desconocidas daría falsos errores. Se puede añadir en la fase de reproducción.

### 5. UUID generado en el cliente

- El frontend genera el `id` al abrir el formulario de alta y lo envía en `POST /api/animales`.
- La API lo valida como `required|uuid|unique:animales,id`. Si ya existe, responde 422 y no se crea nada (un envío repetido no duplica el animal).
- Generación en el frontend con una utilidad `nuevoUuid()`: usa `crypto.randomUUID()` si existe y, si no, construye un UUID v4 con `crypto.getRandomValues()`. **Motivo**: `crypto.randomUUID()` solo existe en contextos seguros (HTTPS o `localhost`). Al probar desde el móvil en desarrollo, la app se abre por `http://<IP del PC>:5173`, donde no está disponible; `getRandomValues()` sí lo está.
- El `id` no se puede cambiar al editar (`PUT` no lo acepta).

- **Alternativa**: que el servidor genere el UUID. Más simple hoy, pero habría que cambiar la API y el formulario en la fase 2.
- **Nota para la fase 2**: con la cola de pendientes puede interesar que un `POST` repetido con el mismo `id` y los mismos datos responda como correcto en lugar de 422. Se decidirá entonces.

### 6. API REST

Dentro del grupo `auth:sanctum` (sin sesión, 401):

| Ruta | Qué hace |
|---|---|
| `GET /api/animales` | El censo completo (todos los animales, activos y de baja), sin paginar |
| `GET /api/animales/{id}` | Un animal, con su madre, su padre y los usuarios de auditoría |
| `POST /api/animales` | Crea. Responde 201 con el animal |
| `PUT /api/animales/{id}` | Edita. Responde 200 con el animal |

- Se registran con `Route::apiResource('animales', AnimalController::class)->only([...])` y `->parameters(['animales' => 'animal'])`, para que el parámetro sea `{animal}` y funcione el *route model binding*. No hay ruta de borrado: un `DELETE` responde 405.
- Un `id` que no existe da 404; uno que no es UUID también da 404 (`whereUuid`).
- **Form Requests** `GuardarAnimalRequest` (alta) y `ActualizarAnimalRequest` (edición), que comparten las reglas en un trait o clase base; la edición añade las reglas que dependen del animal existente (unicidad ignorando el propio, sin autorreferencia, cambio de sexo con descendencia).
- **Campos que la API no acepta del cliente**: `estado` (todas se crean `activa`; las bajas son otro cambio), `creado_por`, `modificado_por` y las fechas. Solo se toman los campos validados (`$request->validated()`), así que lo demás se ignora.
- **Auditoría**: en el controlador, al crear se asignan `creado_por` y `modificado_por` con el usuario actual; al editar, `modificado_por`. Se hace explícito en el controlador y no con eventos del modelo, para que se vea dónde ocurre y para que el seeder pueda crear animales sin usuario.
- **`AnimalResource`** devuelve:
  ```
  id, codigo_oficial, tipo_electronico, nombre_o_numero, sexo, reproductor,
  raza, fecha_nacimiento (AAAA-MM-DD o null), precision_nacimiento, origen,
  estado, notas, madre_id, padre_id,
  madre: { id, codigo_oficial, nombre_o_numero } | null   (solo si se ha cargado)
  padre: { id, codigo_oficial, nombre_o_numero } | null   (solo si se ha cargado)
  creado_por: { id, nombre } | null                        (solo si se ha cargado)
  modificado_por: { id, nombre } | null                    (solo si se ha cargado)
  created_at, updated_at (ISO 8601)
  ```
  Los nombres de campo coinciden con los que acepta la API al crear y editar, para que el formulario pueda reutilizar los datos tal cual.
- **Errores de validación**: el 422 estándar de Laravel (`{ message, errors: { campo: [mensajes] } }`), con mensajes en castellano definidos en los Form Requests.

### 7. El censo completo se carga una vez y se busca en el navegador

`GET /api/animales` devuelve **todos** los animales (activos y de baja), ordenados por `codigo_oficial`, sin paginar ni filtrar: `{ data: [ … ] }` con `AnimalResource`, sin madre, padre ni usuarios cargados (bastan `madre_id` y `padre_id`). La búsqueda y los filtros se hacen en el navegador sobre esa lista.

**Por qué así y no paginando en el servidor:**
- **Tamaño**: con unos cientos de animales (y algún millar el día que se carguen las bajas históricas), la respuesta ocupa del orden de 100–300 KB sin comprimir y bastante menos comprimida. Se descarga en una fracción de segundo por la wifi de casa.
- **Búsqueda instantánea**: filtrar unos cientos de elementos en memoria cuesta menos de un milisegundo. Se busca a cada tecla, sin esperas, sin una petición por búsqueda y sin el problema de que una respuesta lenta pise a otra más nueva.
- **Fase 2**: el móvil tendrá una copia completa del censo en IndexedDB y buscará en ella. Si la pantalla Rebaño ya trabaja sobre una lista completa en memoria, en la fase 2 solo cambia **de dónde sale la lista** (de Dexie en lugar de la API), no la pantalla ni la lógica de búsqueda. Con paginación en el servidor habría que rehacer las dos.
- **Reutilización**: el buscador de madre y padre usa la misma lista, sin peticiones propias.
- **Backend más simple**: desaparecen los parámetros de búsqueda, su Form Request y su validación.

**Inconvenientes asumidos:**
- La primera carga de Rebaño trae todo el censo, aunque solo se mire un animal. Con estos tamaños no se nota.
- Si el censo creciera a muchos miles, habría que revisar la decisión. No es el caso de esta explotación (ver el documento de diseño), y en la fase 2 la copia local será completa igualmente.

**Organización en el frontend:**
- **`src/censo/`**: un contexto `CensoProvider` (dentro de las rutas protegidas) con el hook `useCenso()`, que guarda `animales`, `estado` (`cargando`, `listo`, `error`) y las funciones `recargar()` y `guardarEnCenso(animal)`.
  - La lista se pide la primera vez que una pantalla la necesita y se conserva en memoria al cambiar de pantalla. Al volver a entrar en Rebaño se muestra al momento y se vuelve a pedir en segundo plano para recoger los cambios de la otra persona.
  - Después de crear o editar un animal, el formulario llama a `guardarEnCenso(animal)` con la respuesta de la API, que lo añade o sustituye en la lista sin volver a descargarla.
  - **Este contexto es el único punto que sabe de dónde salen los datos.** En la fase 2 se cambiará su interior para leer de Dexie.
- **`src/censo/filtrarAnimales.js`**: función pura `filtrarAnimales(animales, { buscar, sexo, estado, excluir })`, sin React ni red, con estas reglas:
  - `buscar` con solo dígitos (se ignoran espacios): animales cuyo `codigo_oficial` **termina** en esos dígitos **o** cuyo `nombre_o_numero` los contiene. Así, "47" encuentra el crotal `…0047` y la oveja "Nº 47".
  - `buscar` con letras: animales cuyo `nombre_o_numero` contiene el texto (sin distinguir mayúsculas ni tildes), o cuyo código oficial contiene el texto normalizado (permite pegar un crotal entero `ES 0000…`).
  - `sexo`: `hembra`, `macho` o `todos`; `estado`: `activa`, `baja` o `todos`; `excluir`: id de un animal que no debe aparecer.
  - Conserva el orden por código oficial.
  Al ser una función pura, se prueba a fondo con pruebas unitarias sencillas, y en la fase 2 se seguirá usando tal cual.

- **Alternativa descartada**: paginar y filtrar en el servidor (la primera versión de esta propuesta). Escala a cualquier tamaño, pero obliga a esperar a la red en cada búsqueda y a rehacer la pantalla en la fase 2.

### 8. Rutas y estructura del frontend

```
/rebano                 → Rebano (lista)
/rebano/nuevo           → FormularioAnimal (alta)
/rebano/:id             → FichaAnimal
/rebano/:id/editar      → FormularioAnimal (edición)
```

- `/rebano/nuevo` se declara como ruta propia, así que React Router no la confunde con `:id`.
- "Rebaño" queda destacado en la barra en todas ellas: `NavLink` sin `end` marca también las subrutas.
- Archivos nuevos:
  - `src/api/animales.js`: `listarAnimales()`, `obtenerAnimal(id)`, `crearAnimal(datos)`, `actualizarAnimal(id, datos)`, todos sobre `peticion()`.
  - `src/utilidades/crotal.js` (`normalizarCrotal`, `formatearCrotal`, `ultimosDigitos`), `src/utilidades/fechas.js` (`formatearFecha`, `formatearNacimiento`, `calcularEdad`), `src/utilidades/uuid.js` (`nuevoUuid`) y `src/utilidades/textosAnimal.js` (textos visibles de cada valor: "Hembra", "Bolo ruminal", "Nacida en la explotación"…).
  - `src/censo/CensoProvider.jsx`, `src/censo/contexto.js` y `src/censo/filtrarAnimales.js` (decisión 7).
  - Pantallas `src/pantallas/Rebano.jsx`, `FichaAnimal.jsx`, `FormularioAnimal.jsx`, y el componente `src/componentes/BuscadorAnimal.jsx`.
- Sin librerías nuevas (ni de formularios ni de peticiones): `useState`/`useEffect` y el cliente existente bastan, y así se ve cómo funciona.

### 9. Pantalla Rebaño

- `CabeceraPantalla` con título "Rebaño", subtítulo con el total ("24 animales") y como acción un `Boton` enlace "Alta" (icono `Plus`) a `/rebano/nuevo`.
- **Campo de búsqueda** (componente nuevo `CampoBusqueda`, con el aspecto del buscador del mockup de Inicio): icono de lupa, etiqueta accesible "Buscar por crotal o nombre", `inputmode="numeric"` por defecto y un botón dentro del campo para cambiar a teclado de letras y volver ("ABC" / "123", con `aria-label` "Usar teclado de letras" / "Usar teclado numérico"). Un botón para borrar el texto cuando hay algo escrito.
- La lista sale de `useCenso()` y se filtra con `filtrarAnimales()` **a cada tecla**, sin pausa ni petición (decisión 7).
- **Filtros** con el componente `GrupoOpciones` en forma de botones segmentados: Sexo (Todos · Hembras · Machos) y Estado (Activas · Bajas · Todas). Por defecto, Todos y Activas.
- El texto buscado y los filtros se guardan en la dirección (`/rebano?buscar=47&sexo=hembra`) con `useSearchParams`, con `replace` para no llenar el historial. Así, al volver de una ficha con el botón atrás, la lista sigue como estaba.
- **`<BrowserRouter useTransitions={false}>`** (en `main.jsx`), decidido durante la implementación: por defecto React Router aplica cada cambio de dirección como transición de React, que puede quedar para después. Como la búsqueda y los filtros viven en la dirección, dos toques muy seguidos (borrar la búsqueda y elegir un filtro) hacían que el segundo partiera de la dirección antigua y deshiciera el primero; escribiendo rápido podrían perderse letras. Lo detectó la prueba en el navegador real (en las pruebas automáticas no aparece, porque cada paso espera a que la pantalla se actualice). Con las transiciones desactivadas, cada cambio se aplica al momento. Se pierde la posibilidad de mantener la pantalla anterior mientras carga una parte con `Suspense`, que la app no usa.
- **Cada animal** es una `Tarjeta` enlace a su ficha con: nombre o número (o "Sin nombre" atenuado), el código oficial agrupado con los **últimos 4 dígitos resaltados** en negrita, y etiquetas pequeñas de sexo (con "Reproductor" si lo es), edad y, si está de baja, "Baja".
- **Pintado por tramos**: de los resultados filtrados se pintan los primeros 100 y, si hay más, un botón "Ver más" pinta otros 100. No es paginación del servidor (los datos ya están todos): solo evita crear cientos de tarjetas de golpe en móviles modestos. Al cambiar la búsqueda o los filtros se vuelve a los primeros 100.
- **Estados**: cargando la primera vez (texto "Cargando…" con `aria-live`), lista vacía sin búsqueda ("Todavía no hay animales" con botón "Dar de alta"), sin resultados ("Ningún animal coincide con la búsqueda"), error (Aviso de error con botón "Reintentar").

### 10. Ficha del animal

Sigue la estructura del mockup de la ficha con los componentes y variables de la base visual (modo claro y oscuro):
- Arriba, enlace "Rebaño" para volver (`CabeceraPantalla` con `volverA`) y `Boton` secundario "Editar" (icono `Pencil`) que lleva a `/rebano/:id/editar`. El enlace vuelve a la lista con los filtros que tenía si se llegó desde ella (se pasa la búsqueda en el estado de la navegación); si se abrió la ficha directamente, a `/rebano`.
- **Tarjeta DNI**:
  - Dos huecos de foto (Cara y Costado) con icono de cámara y el texto "Sin foto", sin acción (las fotos son otro cambio).
  - Línea pequeña con el tipo ("Oveja", "Carnero reproductor", "Macho") y el título `h1`: el nombre o número; si no tiene, los últimos 4 dígitos del crotal ("…0001").
  - Etiqueta de estado a la derecha: "Activa" (fondo suave principal) o "Baja" (neutra).
  - Bloque "Código oficial" con el código agrupado en tipografía Archivo grande.
  - Etiquetas (componente `Etiqueta`): sexo, edad (si se conoce), tipo de identificador electrónico ("Bolo ruminal", "Crotal electrónico", "Sin identificador electrónico") y "Reproductor" si lo es.
- **Pestañas** (componente `Pestanas`): Datos · Reproducción · Sanidad · Historial. Patrón accesible de pestañas (`role="tablist"`, `tab`, `tabpanel`, flechas izquierda/derecha para moverse). Datos se abre por defecto; las otras muestran un `EstadoVacio` "Próximamente". En pantallas estrechas el texto "Reproducción" se abrevia visualmente a "Reproduc." pero conserva el nombre completo para el lector de pantalla.
- **Pestaña Datos**: lista de definición con Raza, Nacimiento, Origen, Madre y Padre ("—" si no hay dato). Madre y padre son enlaces a su ficha, con el texto "nombre · …últimos 4 dígitos" (o solo el crotal agrupado si no tiene nombre). Debajo, tarjeta "Notas" si las hay.
- **Pie**: "Modificada por {nombre} · dd/mm/aaaa" con la fecha de `updated_at`. Si el usuario ya no existe, "Modificada el dd/mm/aaaa".
- Al navegar de una ficha a la de la madre, la pantalla se recarga con el nuevo `id` (el efecto depende de `id`) y vuelve a la pestaña Datos.
- **Estados**: cargando, no encontrado (404: "Este animal no existe" con enlace a Rebaño) y error de conexión (Aviso con "Reintentar").

### 11. Formulario de alta y edición

Una sola pantalla `FormularioAnimal` que sabe si es alta o edición por la ruta. Título "Alta de animal" o "Editar animal" y enlace para volver (a Rebaño en el alta y a la ficha en la edición).

Campos, en este orden (los obligatorios lo indican en su etiqueta):
1. **Código oficial** (obligatorio): prefijo `ES` fijo y 12 dígitos (decisión 2).
2. **Identificador electrónico** (obligatorio): Grupo de opciones Bolo ruminal · Crotal electrónico · Ninguno. Sin valor por defecto, para que se elija a conciencia.
3. **Nombre o número** (opcional).
4. **Sexo** (obligatorio): Hembra · Macho.
5. **Reproductor**: `Casilla` "Carnero reproductor", solo visible si el sexo es Macho.
6. **Raza** (opcional): texto libre.
7. **Fecha de nacimiento**: Grupo de opciones Fecha exacta · Mes y año · Solo el año · Desconocida (por defecto Fecha exacta) y los campos que correspondan a la precisión elegida (decisión 3).
8. **Origen** (obligatorio): Nacida en la explotación · Comprada. Por defecto, nacida.
9. **Madre** y **Padre** (opcionales): `BuscadorAnimal`.
10. **Notas** (opcional): `AreaTexto`.

Comportamiento:
- En la edición se cargan los datos actuales con `obtenerAnimal()`; el código oficial se puede corregir.
- Al pulsar "Guardar": comprobación local de obligatorios y formato del crotal (marca el error en el campo y pone el foco en el primero con error, sin llamar a la API). Si pasa, se envía; el botón se desactiva y dice "Guardando…".
- Si la API responde 422, cada mensaje de `errors` se muestra en su campo y el foco va al primero. Un error que no corresponde a ningún campo visible se muestra en un `Aviso` de error encima del botón.
- Un error de red o de servidor se muestra en un `Aviso` y se conservan los datos escritos para reintentar.
- Al guardar bien, se actualiza la lista en memoria con `guardarEnCenso(animal)` y se va a la ficha del animal con `replace` (el botón atrás no vuelve al formulario).
- "Cancelar" es un enlace a la pantalla de la que viene (ficha o Rebaño).

**Buscador de madre y padre (`BuscadorAnimal`)**:
- Sin elección: un botón "Elegir madre" / "Elegir padre".
- Con elección: muestra el animal elegido (nombre y crotal agrupado) con botones "Cambiar" y "Quitar".
- "Elegir" abre un `MenuInferior` (ya gestiona foco, Escape y fondo bloqueado) con un `CampoBusqueda` numérico y los resultados de `filtrarAnimales(animales, { buscar, sexo, estado: 'todos', excluir })` sobre la lista de `useCenso()`, sin peticiones propias. `sexo` es `hembra` para la madre y `macho` para el padre, y `excluir` es el animal que se está editando. Tocar un resultado lo elige y cierra el menú. Los animales de baja muestran la etiqueta "Baja".
- Al abrirlo sin texto muestra todos los candidatos (pintados por tramos como en Rebaño), para poder elegir sin escribir si hay pocos machos.

### 12. Menú ➕: acción "Alta"

- `MenuRegistrar` admite que una acción tenga destino (`ruta: '/rebano/nuevo'`). Esas acciones se pintan como enlaces reales (`Link`), sin "Próximamente" y sin `aria-disabled`; al pulsarlas se cierra el menú y se navega.
- El foco no vuelve al botón "Registrar" cuando se cierra por haber navegado (la pantalla nueva recibe el foco como en cualquier cambio de pantalla).
- El resto de acciones sigue igual.

### 13. Componentes nuevos de la base visual

En `src/componentes/`, con las variables de la paleta y tamaños táctiles de al menos 48 px:
- **`GrupoOpciones`**: `fieldset` con `legend` visible y botones de opción nativos (`input type="radio"`) estilizados como botones segmentados o como lista vertical (prop `variante`). Admite error con `aria-describedby` como `CampoTexto`. Al ser radios nativos, las flechas del teclado y los lectores de pantalla funcionan sin código extra.
- **`AreaTexto`**: como `CampoTexto` pero con `<textarea>`, con etiqueta, ayuda y error.
- **`Pestanas`**: lista de pestañas y panel, según el patrón accesible de WAI-ARIA, con el aspecto del mockup (fondo gris y pestaña activa blanca).
- **`Etiqueta`**: píldora pequeña con borde (variantes `neutra`, `principal` y `aviso`).
- **`CampoBusqueda`**: campo con lupa, botón de borrar y botón opcional para cambiar el teclado entre numérico y de letras. Se apoya en `CampoTexto` (prop `accion`) para mantener etiqueta y foco coherentes; la etiqueta puede ocultarse visualmente pero sigue existiendo para el lector de pantalla.

### 14. Seeder de animales de prueba

- `CensoPruebaSeeder`, llamado desde `DatabaseSeeder` solo en `local` o `testing`, después de `UsuariosPruebaSeeder`.
- Crea unos 30 animales inventados con crotales consecutivos `ES000000000001`, `ES000000000002`…:
  - 3 machos reproductores, 1 macho no reproductor y el resto hembras.
  - Nombres o números inventados genéricos en algunos (por ejemplo, "Prueba 7") y vacíos en otros.
  - Las cuatro precisiones de fecha de nacimiento, los tres tipos de identificador y los dos orígenes.
  - Varias hembras con madre y padre de entre los propios animales de prueba (madres creadas antes que las crías).
  - Todas activas (las bajas son otro cambio).
- Asigna `creado_por` y `modificado_por` al primer usuario de prueba si existe; si no, los deja vacíos.
- **No duplica**: si ya existe un animal con alguno de esos crotales, no lo vuelve a crear (`firstOrCreate` por `codigo_oficial`).
- `AnimalFactory` para las pruebas: crotales `ES` + 12 dígitos aleatorios que empiezan por `0000` (claramente de prueba), hembra activa por defecto y estados `macho()`, `reproductor()`, `deBaja()`, `fechaDesconocida()`.

### 15. Pruebas

**Backend (PHPUnit, SQLite en memoria)**, en `tests/Feature/` y `tests/Unit/`:
- `AnimalCrearTest`: crea con el UUID recibido, 201, auditoría con el usuario actual y `estado` activa aunque se envíe otro; normaliza el crotal (`es 0000 0000 0001` → `ES000000000001`); rechaza formato incorrecto, crotal repetido (también escrito con espacios o minúsculas), UUID repetido o no válido, campos obligatorios vacíos, madre macho, padre hembra, madre o padre inexistentes, reproductor en una hembra, fecha futura, fecha con precisión desconocida y fecha ausente con precisión exacta, de mes o de año; normaliza la fecha con precisión `mes` al día 1 y con `anio` al 1 de enero; acepta el mes actual con precisión `mes` y rechaza el siguiente.
- `AnimalEditarTest`: edita y actualiza `modificado_por` sin cambiar `creado_por`; permite conservar su propio crotal; rechaza el crotal de otro animal; rechaza que sea su propia madre o padre; rechaza cambiar de sexo si tiene descendencia; ignora `id` y `estado` en el cuerpo.
- `AnimalListarTest`: devuelve todos los animales (activos y de baja) ordenados por código oficial, sin paginar y sin madre, padre ni usuarios.
- `AnimalVerTest`: devuelve madre, padre y usuarios de auditoría; 404 con un id inexistente o que no es UUID.
- `AnimalRutasTest`: todas las rutas dan 401 sin sesión; `DELETE` da 405.
- `CensoPruebaSeederTest`: crea los animales con relaciones correctas y no duplica al ejecutarse dos veces.
- Prueba unitaria del mutador del código oficial.

**Frontend (Vitest + Testing Library)**:
- `crotal.test.js`, `fechas.test.js`, `uuid.test.js`: agrupado y normalización del crotal; formato de nacimiento y edad con las cuatro precisiones; `nuevoUuid()` devuelve un UUID v4 válido con y sin `crypto.randomUUID`.
- `filtrarAnimales.test.js`: activas por defecto; sexo y estado; últimos dígitos (y no dígitos del medio); dígitos dentro del nombre; nombre sin distinguir mayúsculas ni tildes; crotal completo con espacios; `excluir`; conserva el orden.
- `CensoProvider.test.jsx`: carga la lista una vez, la conserva entre pantallas, la vuelve a pedir en segundo plano, `guardarEnCenso` añade y sustituye, y un error de red deja el estado `error` sin cerrar la sesión.
- `Rebano.test.jsx`: muestra activas por defecto; el buscador usa teclado numérico y puede cambiar a letras; filtra al escribir sin llamar a la API; los filtros cambian la lista y la dirección; muestra las tarjetas con el crotal agrupado; "Ver más"; estados vacío, sin resultados y error con reintento.
- `FichaAnimal.test.jsx`: muestra el código agrupado, etiquetas de sexo, edad e identificador, enlaces a la madre y al padre, "Modificada por… · fecha", pestañas con "Próximamente" y navegación con flechas; estado 404.
- `FormularioAnimal.test.jsx`: errores locales sin llamar a la API; la casilla de reproductor solo aparece con Macho; los campos de fecha cambian según la precisión y se envía `AAAA-MM-01` o `AAAA-01-01` en las aproximadas; el alta envía un UUID y el crotal normalizado; muestra en cada campo los errores 422; la edición carga los datos y llama a `actualizarAnimal`; al guardar navega a la ficha.
- `BuscadorAnimal.test.jsx`: filtra por el sexo que toca y excluye el propio animal; elegir, cambiar y quitar.
- `MenuRegistrar`: la acción "Alta" lleva al formulario y cierra el menú; las demás siguen en "Próximamente".
- Las pruebas simulan el módulo `api/animales.js` con `vi.mock`, o envuelven las pantallas con un valor de censo falso (el contexto se exporta para ello), sin llamar a la API real.

## Risks / Trade-offs

- [`crypto.randomUUID()` no existe por HTTP fuera de `localhost`] → `nuevoUuid()` usa `crypto.getRandomValues()` como alternativa, disponible en cualquier contexto. Se prueba con y sin `randomUUID`.
- [Dos personas editan la misma ficha a la vez y una pisa los cambios de la otra] → Con dos usuarios es poco probable; el documento de diseño acepta "gana el último cambio". Se puede añadir control de versión más adelante si hiciera falta.
- [La unicidad del crotal depende del índice único de la base de datos y de la validación; dos altas simultáneas con el mismo crotal podrían pasar la validación] → El índice único de la tabla rechaza la segunda. Laravel respondería 500 en ese caso extremo; se acepta por la improbabilidad (dos usuarios).
- [La lista completa crece con el tiempo, sobre todo al cargar bajas históricas] → Con algún millar de animales sigue siendo una descarga pequeña y un filtrado instantáneo. Si algún día dejara de serlo, el cambio queda localizado en `CensoProvider` y en la ruta de listado.
- [La lista en memoria puede quedar desfasada si la otra persona da de alta o edita mientras tanto] → Se vuelve a pedir en segundo plano cada vez que se entra en Rebaño, y la ficha y la edición siempre piden el animal actualizado al servidor.
- **[Tarea para la fase 2] Abrir la ficha y la edición sin conexión** → En este cambio, `FichaAnimal` y `FormularioAnimal` (en la edición) piden el animal al servidor con `obtenerAnimal(id)`. Sin conexión, esa petición falla y no podrían abrirse. En la fase 2 tendrán que leer el animal de la copia local a través de `CensoProvider` (o del equivalente que lo sustituya). Para ello:
  - La copia local tendrá que guardar también lo que hoy solo da `GET /api/animales/{id}`: los datos de la madre y del padre (se pueden sacar de la propia lista con `madre_id` y `padre_id`) y el nombre de quien creó y modificó la ficha (habrá que guardar los usuarios en local o incluir su nombre en el listado).
  - La ficha se abrirá con los datos locales al momento. Si hay conexión, podrá pedir la versión del servidor en segundo plano y actualizarse.
  - En la edición, guardar sin conexión dejará el cambio como pendiente en la cola de sincronización, en lugar de llamar a `actualizarAnimal()` directamente.
  - Lo mismo valdrá para el alta.
  Para que este paso sea pequeño, en este cambio las pantallas usan funciones con nombre propio (`obtenerAnimal`, `crearAnimal`, `actualizarAnimal`) y no llaman a `peticion()` directamente.
- [Las reglas que se validan solo al guardar (sexo de la madre, por ejemplo) podrían romperse si en el futuro se edita directamente en la base de datos o por otras vías] → La futura carga desde Excel deberá usar las mismas reglas (se pueden reutilizar las del Form Request).
- [Una fecha aproximada se guarda como fecha completa y podría tomarse por exacta en algún cálculo futuro] → La columna `precision_nacimiento` acompaña siempre a la fecha y los cálculos deben tenerla en cuenta; la ficha la muestra con "(aprox.)" y la edad con "≈".
- [El seeder usa crotales que podrían coincidir con los que se creen a mano en desarrollo] → Todos empiezan por `ES00000000`, claramente de prueba, y el seeder no duplica.

## Migration Plan

1. `php artisan migrate` para crear la tabla `animales` (o `php artisan migrate:fresh --seed` para recrear todo con datos de prueba; la base de desarrollo no tiene datos reales).
2. `php artisan db:seed --class=CensoPruebaSeeder` si solo se quieren añadir los animales de prueba.
3. Reiniciar `npm run dev` no es necesario; basta con recargar.

Vuelta atrás: `php artisan migrate:rollback` elimina la tabla `animales`.

## Open Questions

Ninguna. Decisiones revisadas con el usuario:
- Modelo `Animal`/`animales`.
- Cuatro precisiones de nacimiento (exacta, mes, año y desconocida), con "(aprox.)" en la fecha y "≈" en la edad de las aproximadas.
- Origen "Nacida en la explotación" marcado por defecto; identificador electrónico sin marcar.
- Formato `ES` + 12 dígitos para todos los animales.
- Censo completo cargado en el navegador, con búsqueda y filtros locales (decisión 7).
