## Context

Estado actual:
- **Backend**: Laravel con Sanctum instalado pero sin usar. La tabla `users` es la de Laravel por defecto (clave numérica, `name`, `email`). Existe la migración de `personal_access_tokens` (tokens de Sanctum) y una ruta de ejemplo `GET /api/user`. La única ruta real es `GET /api/estado`, pública.
- **Frontend**: React con React Router. Todas las pantallas cuelgan de `<Marco>` (barra inferior). En desarrollo, Vite redirige `/api/*` a Laravel, así que el navegador ve un **único origen** (`http://localhost:5173`).
- **Pruebas**: el backend tiene PHPUnit con SQLite en memoria; el frontend no tiene pruebas.

Restricciones del documento de diseño:
- Dos usuarios con los mismos permisos, sin registro público.
- Uso desde el móvil. En la fase 2 la app trabajará sin conexión y solo verá el servidor al volver a casa, por lo que la sesión debe durar semanas o meses.
- El servidor solo es accesible desde la red de casa y, en la instalación de uso, Caddy sirve la app y la API desde el mismo dominio con HTTPS.
- Todos los registros usan UUID.

## Goals / Non-Goals

**Goals:**
- Login seguro con usuario y contraseña usando lo que Laravel y Sanctum ya traen, sin reinventar nada.
- Sesión que sobrevive semanas sin volver a pedir la contraseña si se marca "Mantener la sesión".
- Un único punto en el frontend que sabe si hay sesión y que protege todas las rutas.
- Un cliente de API reutilizable que gestione CSRF y la sesión caducada, para que las siguientes funcionalidades solo tengan que llamar a la API.
- Pruebas automáticas en los dos lados.

**Non-Goals:**
- Cambio y recuperación de contraseña, roles, gestión de sesiones abiertas.
- Funcionamiento sin conexión (guardar el usuario en IndexedDB, entrar sin servidor): fase 2.
- Auditoría de quién crea o modifica registros: llegará con la primera funcionalidad de datos.

## Decisions

### 1. Sanctum en modo SPA (cookie de sesión), no tokens

Sanctum ofrece dos formas de autenticar:
- **Tokens**: al hacer login, la API devuelve un token que el frontend guarda (normalmente en `localStorage`) y envía en cada petición con la cabecera `Authorization: Bearer …`.
- **SPA con cookies**: al hacer login, Laravel crea una sesión normal y el navegador guarda una cookie `HttpOnly`; el navegador la envía sola en cada petición.

Se elige **SPA con cookies** porque:
- **Mismo origen**: el frontend y la API van por el mismo dominio (proxy de Vite en desarrollo, Caddy en la instalación de uso). Es justo el caso para el que Sanctum diseñó este modo, y no hace falta CORS.
- **Más seguro frente a XSS**: una cookie `HttpOnly` no la puede leer ningún JavaScript. Un token en `localStorage` sí: si algún día se colara código malicioso en la página, podría robarlo y usarlo desde fuera.
- **Cerrar sesión de verdad**: la sesión vive en el servidor; al cerrarla se invalida allí. Con tokens habría que gestionar su borrado y su caducidad a mano.
- **Sesión larga incluida**: el "recordarme" de Laravel (`remember me`) ya resuelve la sesión de larga duración (decisión 4).
- **Menos código**: no hay que guardar, renovar ni adjuntar tokens en el frontend.

Inconvenientes asumidos:
- **Hace falta protección CSRF**, porque el navegador envía la cookie automáticamente. En Laravel 13 (`PreventRequestForgery`) una petición que modifica datos se acepta si el navegador indica `Sec-Fetch-Site: same-origin` (cabecera que pone el propio navegador y que una página no puede falsificar) **o** si el token CSRF coincide. El frontend envía siempre el token (cookie `XSRF-TOKEN` copiada en la cabecera `X-XSRF-TOKEN`, decisión 7) como respaldo para navegadores que no envíen `Sec-Fetch-Site`. Una petición desde otro sitio no cumple ninguna de las dos condiciones y se rechaza con 419.
- Los tokens serían mejores para apps nativas o para una API en otro dominio, casos que Ovidex no tiene.

Sobre la fase 2 (sin conexión): **ninguna de las dos opciones** permite hablar con el servidor sin conexión. Lo que hará falta es que la app recuerde localmente quién ha entrado y que, al volver a casa, la sesión siga siendo válida en el servidor. Eso lo da la cookie "recordarme" de larga duración igual que lo daría un token sin caducidad, pero sin exponerlo a JavaScript.

### 2. Rutas de autenticación bajo `/api`

Vite solo redirige `/api/*`. Por eso todas las rutas de autenticación van bajo ese prefijo:

| Ruta | Sesión | Qué hace |
|---|---|---|
| `GET /api/sanctum/csrf-cookie` | No | Entrega la cookie `XSRF-TOKEN` (ruta de Sanctum) |
| `POST /api/login` | No | Inicia sesión. Cuerpo: `usuario`, `password`, `recordar` |
| `POST /api/logout` | Sí | Cierra la sesión. Responde 204 |
| `GET /api/usuario` | Sí | Devuelve el usuario actual: `id`, `nombre`, `usuario` |
| `GET /api/estado` | No | Ya existía |

- La ruta de Sanctum se mueve cambiando `prefix` a `api/sanctum` en `config/sanctum.php`.
- `GET /api/usuario` sustituye a la ruta de ejemplo `GET /api/user`.
- Se activa `$middleware->statefulApi()` en `bootstrap/app.php`, que añade a las rutas de la API lo necesario para usar sesión y cookies cuando la petición viene del frontend.
- Las rutas protegidas se agrupan con `Route::middleware('auth:sanctum')`. Así, cualquier ruta que se añada dentro del grupo queda protegida por defecto.
- `POST /api/login` lleva además el middleware `SoloDesdeFrontend`. Sanctum solo activa la sesión y la protección CSRF para las peticiones del frontend (según `Origin`/`Referer`); una petición desde otro sitio llegaría al login sin sesión y fallaría con un 500. El middleware la rechaza antes con 419, como un fallo de CSRF. Las rutas protegidas no lo necesitan: desde otro sitio no hay sesión y responden 401.
- Las respuestas de usuario se devuelven con un `JsonResource` (`UsuarioResource`) que solo expone `id`, `nombre` y `usuario`.

Toda la lógica de login y logout va en un controlador `SesionController` con los métodos `iniciar`, `cerrar` y `actual`, y la validación del login en un Form Request `IniciarSesionRequest` (incluye el límite de intentos, decisión 5).

### 3. Proxy de Vite sin cambiar el origen

Hoy el proxy usa `changeOrigin: true`, que cambia la cabecera `Host` a la dirección de Laravel (`127.0.0.1:8000`). Con sesiones eso es un problema: el navegador está en `localhost:5173`, pero Laravel creería que está en otro sitio, y las direcciones que genera Laravel apuntarían a otro sitio. (Comprobado al implementar: ni Sanctum, que mira `Origin`/`Referer`, ni la protección CSRF de Laravel 13, que mira `Sec-Fetch-Site`, dependen de `Host`; aun así se mantiene `false` para que desarrollo se parezca a producción.)

Se pasa a `changeOrigin: false`: Laravel ve el mismo host que el navegador, como pasará con Caddy en la instalación de uso. Además se añade `SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173` al `.env.example` para que Sanctum reconozca el frontend de desarrollo.

- **Alternativa**: mantener `changeOrigin: true` y ajustar dominios a mano. Funciona, pero se aleja de cómo será en producción y es más fácil equivocarse.

### 4. Sesión de larga duración con el "recordarme" de Laravel

- **Sin marcar "Mantener la sesión"**: sesión normal. Caduca tras `SESSION_LIFETIME` minutos sin uso (120 por defecto).
- **Marcándola** (por defecto): se llama a `Auth::attempt($credenciales, recordar: true)`. Laravel crea además una cookie `remember_web_…` que, cuando la sesión normal caduca, vuelve a identificar al usuario sin pedir la contraseña. Para ello guarda un `remember_token` en la tabla de usuarios.
- La duración de esa cookie se configura en `config/auth.php` (`guards.web.remember`, en minutos) con la variable `AUTH_REMEMBER_MINUTOS`. Valor por defecto: **525600 minutos (365 días)**. Los navegadores limitan las cookies a unos 400 días, así que no tiene sentido más.
- Al iniciar sesión se regenera el identificador de sesión (evita la fijación de sesión). Al cerrarla se invalida la sesión, se regenera el token CSRF y Laravel borra la cookie "recordarme" y cambia el `remember_token`.

- **Alternativa**: subir `SESSION_LIFETIME` a meses. Afectaría también a quien no marca la casilla y obligaría a guardar sesiones enormes en la tabla `sessions`.

### 5. Límite de intentos y mensaje genérico

- Se usa el `RateLimiter` de Laravel con la clave `usuario|IP` (usuario en minúsculas): **5 intentos fallidos por minuto**. Al sexto se responde **429** con el mensaje "Demasiados intentos. Vuelve a intentarlo en N segundos." sin comprobar las credenciales.
- Un login correcto borra el contador.
- Si las credenciales no son válidas se responde **422** con el mensaje "Usuario o contraseña incorrectos.", tanto si el usuario no existe como si la contraseña está mal.
- La clave incluye el usuario y la IP para que alguien probando contraseñas no bloquee a la otra persona desde otro móvil.

- **Alternativa**: el middleware `throttle:5,1` en la ruta. Cuenta también los intentos correctos y no permite un mensaje propio tan fácilmente.

### 6. Modelo de usuario

- Se mantiene el modelo `User` y la tabla `users` con su nombre de Laravel: son piezas del framework (autenticación, sesiones, Sanctum las esperan así). Los campos propios sí van en castellano.
- Columnas: `id` (UUID, clave primaria), `nombre`, `usuario` (único), `password`, `remember_token`, `created_at`, `updated_at`. Se eliminan `email`, `email_verified_at` y la tabla `password_reset_tokens`. `password` y `remember_token` conservan el nombre que Laravel espera.
- El modelo usa el trait `HasUuids`: al crear un usuario se genera su UUID (en este caso en el servidor, porque las cuentas se crean con Artisan, no desde el móvil).
- La columna `user_id` de la tabla `sessions` pasa a ser UUID (`foreignUuid`).
- **Usuario en minúsculas**: se guarda siempre en minúsculas y sin espacios, y al iniciar sesión se normaliza igual. Así no depende de si la base de datos distingue mayúsculas (MariaDB no lo hace por defecto, SQLite de las pruebas sí).
- Formato de usuario: de 3 a 30 caracteres, solo letras minúsculas sin tildes, números, punto, guion y guion bajo.
- Contraseña: mínimo 8 caracteres. Se guarda con hash (cast `hashed` del modelo).
- Se quita el trait `HasApiTokens` y se borra la migración de `personal_access_tokens`, que no se usan con cookies. Si algún día hicieran falta tokens, se vuelven a añadir.

- **Alternativa**: crear un modelo `Usuario` propio. Obligaría a cambiar la configuración de autenticación y no aporta nada.

### 7. Cliente de API en el frontend

Un módulo `src/api/cliente.js` con una función `peticion(ruta, opciones)` basada en `fetch` (sin librerías nuevas):
- Añade `Accept: application/json` y, si hay cuerpo, lo envía como JSON.
- En peticiones que modifican (`POST`, `PUT`, `PATCH`, `DELETE`): si no existe la cookie `XSRF-TOKEN`, primero llama a `/api/sanctum/csrf-cookie`; después copia su valor en la cabecera `X-XSRF-TOKEN`.
- Cada petición tiene un **tiempo máximo de espera** (15 segundos, con `AbortSignal.timeout`).
- Si la respuesta es **419** (token CSRF caducado), pide uno nuevo y repite la petición **una vez**. Esto pasa, por ejemplo, cuando la sesión normal ha caducado y la cookie "recordarme" ha creado una nueva: el usuario sigue identificado, solo hacía falta un token nuevo.
- **La sesión solo se da por caducada si el servidor lo dice**: una respuesta **401**, o un **419** que se repite tras el reintento, en una ruta que no es el login. En ese caso avisa al contexto de sesión (función registrada con `alPerderSesion`) para que la app vuelva al login.
- **Un fallo de red, un tiempo de espera agotado o un error del servidor (5xx) nunca dan la sesión por caducada.** Se lanza un `ErrorApi` de tipo `red` (o con el código 5xx) y la pantalla muestra el aviso que corresponda, pero el usuario sigue dentro. Es imprescindible para la fase 2: sin conexión todas las peticiones fallan por red, y si eso cerrara la sesión, la app sería inutilizable en la explotación.
- Si la respuesta no es correcta, lanza un `ErrorApi` con el tipo (`red` o `http`), el código de estado y el JSON recibido, para que cada pantalla decida qué mensaje mostrar.

- **Alternativa**: axios, que copia `XSRF-TOKEN` automáticamente. Es una dependencia más para algo que son pocas líneas, y así se ve cómo funciona.

La pantalla de estado de la conexión sigue usando `fetch` directamente: es pública y no necesita nada de esto.

### 8. Estado de la sesión en el frontend

Un contexto de React en `src/sesion/` (`SesionProvider` y hook `useSesion()`) que guarda:
- `estado`: `comprobando`, `iniciada`, `sin-sesion` o `error` (servidor inaccesible).
- `usuario`: `{ id, nombre, usuario }` o `null`.
- `iniciarSesion({ usuario, password, recordar })` y `cerrarSesion()`.

Al arrancar la app se llama a `GET /api/usuario`: 200 → `iniciada`; 401 → `sin-sesion`; error de red → `error`, con una pantalla que dice que no se puede conectar con el servidor y un botón para reintentar. Mientras se comprueba, se muestra una pantalla de carga sencilla en lugar del login (para que no "parpadee" el login a quien ya tiene sesión).

### 9. Protección de rutas

```
/login                 → Login (sin Marco ni barra inferior)
<RutaProtegida>        → si no hay sesión, <Navigate to="/login">
  <Marco>              → igual que ahora
    /, /rebano, /almacen, /mas, /mas/ajustes, /mas/estado, *
```

- `RutaProtegida` guarda en el estado de la navegación la dirección que se quería abrir; tras entrar, el login lleva allí (o a Inicio si no había ninguna). Se usa `replace` para que el botón atrás no vuelva al login.
- Si alguien con sesión abre `/login`, se le lleva a Inicio.
- La ruta "no encontrada" queda dentro de la parte protegida: sin sesión, cualquier dirección lleva al login.
- Las pantallas sin barra inferior (login, comprobando la sesión, servidor no disponible) usan un componente `PantallaSimple`, que hace el papel de `Marco` sin la barra: `<main id="contenido">` a toda la altura con las zonas seguras del móvil.

### 10. Pantalla de login y componentes nuevos

Pantalla `src/pantallas/Login.jsx`, con la estructura del mockup y los estilos de la base visual (variables de color, radios y tipografía; funciona en modo claro y oscuro):
- Cabecera centrada con el logotipo (icono de lucide sobre un cuadrado del color principal), el título "Ovidex" (`h1`) y una frase descriptiva genérica.
- Formulario con `CampoTexto` para el usuario (`autocomplete="username"`, sin mayúscula automática ni corrector), `CampoContrasena` (`autocomplete="current-password"`), `Casilla` "Mantener la sesión en este móvil" marcada por defecto y `Boton` principal "Entrar" a todo el ancho.
- Al pulsar "Entrar" con algún campo vacío se marca el error en el propio campo sin llamar a la API.
- Mientras se envía, el botón se desactiva y dice "Entrando…".
- Los errores del servidor (credenciales, demasiados intentos, sin conexión) se muestran en un `Aviso` de error encima del botón. Tras un error se vacía la contraseña y se pone el foco en ella.
- Al pie, una nota informativa breve sobre el acceso privado. No se copia el texto del mockup que habla de funcionar sin cobertura, porque eso llega en la fase 2.

Componentes nuevos en `src/componentes/`:
- **`CampoContrasena`**: usa `CampoTexto` y añade dentro del campo un botón con icono de ojo (`Eye`/`EyeOff`) que alterna entre `type="password"` y `type="text"`. El botón tiene `aria-label` ("Mostrar contraseña"/"Ocultar contraseña") y `aria-pressed`, y mide al menos 44 px. Para permitirlo, `CampoTexto` acepta una prop opcional `accion` que se pinta dentro del recuadro del campo.
- **`Casilla`**: checkbox nativo con la etiqueta envolviéndolo, de 24 px, con `accent-color` del color principal y zona táctil de al menos 48 px de alto.

Sección Más:
- Muestra arriba "Sesión iniciada como **nombre** (usuario)".
- Al final, un `Boton` secundario "Cerrar sesión" con el icono `LogOut` (es una acción, no un enlace, por eso no es una `Tarjeta`). Al pulsarlo se llama a `POST /api/logout` y se va al login. Si falla, se muestra un aviso de error y la sesión sigue abierta.
- La pantalla Más no redirige por su cuenta: al cerrarse la sesión, `RutaProtegida` lleva al login. Para que el login no recuerde "Más" (y al volver a entrar se vaya a Inicio), la sesión guarda `cerradaPorUsuario: true` cuando se cierra con el botón, y `RutaProtegida` no guarda entonces la dirección. (Una redirección propia desde Más competía con la de `RutaProtegida` y ganaba esta última.)

### 11. Cuentas: comando de Artisan y seeder

- Comando `php artisan usuarios:crear` (clase `CrearUsuario`). Pide, con Laravel Prompts, el nombre, el usuario y la contraseña dos veces (con `password()`, que no muestra lo que se escribe). Valida con las reglas de la decisión 6 y que el usuario no exista. Si algo no es válido, vuelve a preguntar ese dato. Al terminar, muestra que la cuenta se ha creado sin repetir la contraseña.
- Comando `php artisan usuarios:cerrar-sesiones <usuario>` (clase `CerrarSesionesUsuario`), para el caso de un móvil perdido:
  - Borra de la tabla `sessions` todas las filas con el `user_id` de ese usuario. Como las sesiones se guardan en la base de datos (`SESSION_DRIVER=database`), borrar la fila invalida la sesión: la cookie del móvil deja de corresponder a nada.
  - Cambia su `remember_token` por uno nuevo aleatorio. La cookie "recordarme" guarda una copia de ese valor; al no coincidir, Laravel la rechaza.
  - Muestra cuántas sesiones se han cerrado. Si el usuario no existe, muestra un error y termina con código de fallo sin tocar nada.
  - Solo afecta a ese usuario: las sesiones de los demás siguen abiertas.
  - Si el driver de sesión no es `database`, el comando avisa de que no puede borrar las sesiones (aunque sí cambia el `remember_token`) y termina con código de fallo.
  - No cambia la contraseña: si se sospecha que alguien la conoce, hay que cambiarla aparte (fuera de este cambio).
  - **Alternativa**: el middleware `AuthenticateSession` de Laravel, que invalida las sesiones al cambiar la contraseña. Obligaría a cambiar la contraseña para echar a un móvil, y aquí se quiere poder hacerlo sin ella.
- Seeder `UsuariosPruebaSeeder`, llamado desde `DatabaseSeeder` **solo** en entorno `local` o `testing`. Crea dos usuarios claramente inventados (`prueba1` y `prueba2`, con nombres del tipo "Usuario de Prueba Uno"). Su contraseña sale de la variable `SEEDER_PASSWORD` del `.env` (vacía en `.env.example`). Si está vacía o no existe, el seeder se detiene sin crear nada y muestra un mensaje claro que dice qué variable falta y dónde definirla. Así no hay ninguna contraseña escrita en el código.
- La factoría `UserFactory` se adapta a las columnas nuevas (nombre y usuario inventados por Faker, contraseña de prueba) para las pruebas.

### 12. Pruebas

**Backend (PHPUnit, SQLite en memoria)**, en `tests/Feature/`:
- `SesionTest`: login correcto (200, devuelve el usuario y queda autenticado); usuario en mayúsculas también entra; contraseña incorrecta y usuario inexistente dan el mismo 422 y el mismo mensaje; campos vacíos dan 422; el sexto intento fallido da 429 aunque la contraseña sea correcta; un login correcto reinicia el contador; con `recordar` se crea la cookie `remember_web_…` y sin él no; `GET /api/usuario` con y sin sesión (200/401); logout cierra la sesión (204 y después 401); logout sin sesión da 401; `/api/estado` sigue siendo público.
- `CrearUsuarioTest`: crea un usuario válido con la contraseña con hash y el usuario en minúsculas; rechaza un usuario repetido, un formato no válido, una contraseña corta y contraseñas que no coinciden.
- `CerrarSesionesUsuarioTest`: borra las sesiones guardadas del usuario y cambia su `remember_token`; una cookie "recordarme" anterior deja de autenticar; las sesiones de otro usuario siguen intactas; un usuario inexistente da error sin cambiar nada. Estas pruebas usan el driver de sesión `database` (las demás usan `array`).
- `UsuariosPruebaSeederTest`: con `SEEDER_PASSWORD` crea los dos usuarios; sin ella se detiene con el mensaje y no crea ninguno.
- Las peticiones de prueba simulan venir del frontend (cabecera `Referer`/`Origin` del dominio de desarrollo) para que se use la sesión como en la realidad.

**Frontend (Vitest + Testing Library + jsdom)**:
- Configuración en `vite.config.js` (bloque `test`), con `jsdom` y un archivo de preparación que carga `@testing-library/jest-dom`. La comprobación de `VITE_API_PROXY_TARGET` se salta al ejecutar las pruebas.
- Scripts: `npm test` (una pasada) y `npm run test:vigilar` (modo vigilancia). Los dos arrancan Vitest con `scripts/vitest.mjs`: en Windows, si la terminal abre la carpeta como `c:\` (unidad en minúscula), Vitest carga algunos módulos dos veces y todas las pruebas fallan con "failed to find the current suite". El script lanza Vitest desde la misma carpeta con la unidad en mayúscula. Cambiar la carpeta o el `root` dentro de `vite.config.js` no basta, porque Vitest ya se ha cargado.
- Versiones: las más recientes con al menos dos semanas publicadas. `@testing-library/dom` se declara explícitamente, aunque lo pidan como dependencia otros paquetes, porque `vitest` se instala con `--legacy-peer-deps` para esquivar un fallo de npm 11.0.0 (`Cannot read properties of null (reading 'edgesOut')`). Con el `package-lock.json` ya generado, `npm install` normal funciona.
- `Login.test.jsx`: muestra los campos y la casilla marcada; el botón del ojo muestra y oculta la contraseña y cambia su etiqueta; con campos vacíos muestra errores y no llama a `iniciarSesion`; envía usuario, contraseña y `recordar`; desmarcar la casilla envía `recordar: false`; tras entrar navega a la pantalla pedida; muestra el mensaje genérico ante un 422 y el de espera ante un 429; el botón se desactiva mientras se envía.
- `RutaProtegida.test.jsx`: sin sesión redirige al login; con sesión muestra la pantalla.
- `cliente.test.js` (con `fetch` simulado): envía la cabecera `X-XSRF-TOKEN`; un 401 avisa de sesión perdida; un 419 pide un token nuevo y repite una vez, y solo si se repite avisa de sesión perdida; un fallo de red, un tiempo de espera agotado y un 500 lanzan error **sin** avisar de sesión perdida.
- Las pruebas envuelven los componentes con un valor de sesión falso (el contexto se exporta para ello) y `MemoryRouter`, sin llamar a la API real.

## Risks / Trade-offs

- [La protección CSRF de Laravel 13 cambia respecto a versiones anteriores] → Resuelto: acepta las peticiones con `Sec-Fetch-Site: same-origin` o con el token CSRF correcto, y no depende del `Host`, así que funciona igual con el proxy de Vite. El frontend envía siempre el token como respaldo. Las peticiones desde otro sitio sin token se rechazan con 419; se comprueba con una prueba automática (que activa la protección CSRF, desactivada por defecto en las pruebas) y a mano con `curl`.
- [En las pruebas automáticas Laravel desactiva la protección CSRF] → La prueba de CSRF la activa explícitamente; el resto de pruebas no dependen de ella.
- [Se modifican migraciones ya ejecutadas en lugar de crear migraciones nuevas] → No hay datos reales en ninguna base de datos todavía; el historial queda más limpio. Hay que recrear la base de desarrollo con `php artisan migrate:fresh --seed`, y se indica en el README.
- [Una cookie "recordarme" de un año en un móvil perdido da acceso a la app] → El servidor solo es accesible desde la red de casa, y el comando `usuarios:cerrar-sesiones` invalida todas las sesiones y el "recordarme" de ese usuario. El usuario tendrá que volver a entrar en sus otros móviles.
- [En la fase 2, si un móvil está sin conexión y se cierran sus sesiones, no se enterará hasta volver a conectar] → Es lo esperado: al conectar, el servidor responderá 401 y la app pedirá el login. Cómo tratar entonces los cambios pendientes de ese móvil se decidirá en la fase 2.
- [La comprobación de credenciales con un usuario inexistente es algo más rápida que con uno existente, lo que en teoría permitiría adivinar usuarios por el tiempo de respuesta] → Riesgo muy bajo en una red privada con dos usuarios y límite de intentos. Se acepta.
- [Si el servidor está apagado, la app no puede comprobar la sesión y no deja entrar] → Es lo esperado en la fase base. La pantalla de error lo explica y permite reintentar. La fase 2 resolverá el uso sin servidor.
- **[Tarea para la fase 2] Arrancar sin conexión con el servidor** → Hoy, si al abrir la app `GET /api/usuario` falla por red, el estado es `error` y se muestra la pantalla "No se puede conectar con el servidor". En la fase 2 eso no puede pasar: la app MUST abrirse con los datos guardados en el móvil y con la sesión que se tenía. Para ello habrá que guardar en el móvil (IndexedDB) el usuario de la última sesión correcta y, si la comprobación falla por red (no por 401), entrar en la app con ese usuario en un estado del tipo "sesión guardada, sin conexión", y volver a comprobar con el servidor cuando haya conexión. Solo un 401 o un 419 del servidor deben llevar al login (como ya hace el cliente de API). La pantalla de error quedará solo para el caso de no tener ninguna sesión guardada (primer uso en ese móvil).
- [El `remember_token` se guarda en texto plano en la tabla `users`] → Es el comportamiento estándar de Laravel; la base de datos solo está en el PC de casa.

## Migration Plan

1. Recrear la base de datos de desarrollo: `php artisan migrate:fresh --seed` (con `SEEDER_PASSWORD` definido en `backend/.env`).
2. Añadir `SANCTUM_STATEFUL_DOMAINS`, `AUTH_REMEMBER_MINUTOS` y `SEEDER_PASSWORD` al `backend/.env` local a partir de `.env.example`.
3. Reiniciar `php artisan serve` y `npm run dev`.

Vuelta atrás: volver a la rama anterior y ejecutar de nuevo `php artisan migrate:fresh`.

## Open Questions

Ninguna. Duración del "recordarme" decidida: 365 días (configurable con `AUTH_REMEMBER_MINUTOS`).
