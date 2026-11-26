## ADDED Requirements

### Requirement: Inicio de sesión con usuario y contraseña
La API SHALL permitir iniciar sesión con `POST /api/login`, enviando el nombre de usuario, la contraseña y si se quiere mantener la sesión. La autenticación MUST usar la sesión de Laravel con cookie (Sanctum en modo SPA) y protección CSRF. El nombre de usuario MUST compararse sin distinguir mayúsculas ni espacios al principio o al final. Al iniciar sesión, el identificador de sesión MUST regenerarse.

#### Scenario: Credenciales correctas
- **WHEN** se envía un usuario existente con su contraseña correcta
- **THEN** la API responde 200 con el `id`, el `nombre` y el `usuario`, y las siguientes peticiones quedan autenticadas

#### Scenario: Usuario escrito en mayúsculas
- **WHEN** se envía el usuario con letras en mayúsculas o con espacios alrededor y la contraseña correcta
- **THEN** se inicia sesión igual que si se hubiera escrito en minúsculas

#### Scenario: Respuesta sin datos sensibles
- **WHEN** el inicio de sesión es correcto
- **THEN** la respuesta MUST NOT incluir la contraseña, su hash ni el token de "recordarme"

#### Scenario: Campos vacíos
- **WHEN** se envía la petición sin usuario o sin contraseña
- **THEN** la API responde 422 y no se inicia sesión

#### Scenario: Petición desde otro sitio sin token CSRF
- **WHEN** se envía la petición de login desde otro sitio, sin el token CSRF
- **THEN** la API la rechaza con 419 y no se inicia sesión

### Requirement: Mensaje de error genérico
Cuando las credenciales no sean válidas, la API SHALL responder 422 con el mensaje "Usuario o contraseña incorrectos.". La respuesta MUST ser la misma tanto si el usuario no existe como si la contraseña es incorrecta.

#### Scenario: Contraseña incorrecta
- **WHEN** se envía un usuario existente con una contraseña incorrecta
- **THEN** la API responde 422 con el mensaje genérico y no se inicia sesión

#### Scenario: Usuario inexistente
- **WHEN** se envía un usuario que no existe
- **THEN** la API responde exactamente igual que con una contraseña incorrecta

### Requirement: Límite de intentos fallidos
La API SHALL limitar los intentos fallidos de inicio de sesión a 5 por minuto para cada combinación de usuario y dirección IP. Superado el límite, MUST responder 429 con un mensaje que indique cuántos segundos esperar, sin comprobar las credenciales. Un inicio de sesión correcto MUST reiniciar el contador.

#### Scenario: Se supera el límite
- **WHEN** se hacen 5 intentos fallidos seguidos con el mismo usuario desde la misma IP y se hace un sexto intento
- **THEN** la API responde 429 con el tiempo de espera, aunque la contraseña del sexto intento sea correcta

#### Scenario: Pasado el tiempo de espera
- **WHEN** se ha superado el límite y ha pasado el tiempo de espera
- **THEN** se puede volver a intentar el inicio de sesión

#### Scenario: Un acierto reinicia el contador
- **WHEN** se hacen varios intentos fallidos sin llegar al límite y después un inicio de sesión correcto
- **THEN** el contador de intentos fallidos de ese usuario y esa IP vuelve a cero

#### Scenario: No se bloquea a otro usuario
- **WHEN** se supera el límite con un usuario
- **THEN** otro usuario puede seguir iniciando sesión con normalidad

### Requirement: Sesión de larga duración
Si al iniciar sesión se marca "Mantener la sesión", la API SHALL crear además una cookie de "recordarme" que mantiene al usuario identificado aunque caduque la sesión normal. Su duración MUST ser configurable con una variable de entorno, con un valor por defecto de 365 días. Si no se marca, la sesión MUST caducar tras el tiempo de inactividad normal de la sesión.

#### Scenario: Mantener la sesión marcado
- **WHEN** se inicia sesión con `recordar` activado
- **THEN** la respuesta incluye la cookie de "recordarme" con la duración configurada

#### Scenario: Mantener la sesión desmarcado
- **WHEN** se inicia sesión con `recordar` desactivado
- **THEN** la respuesta no incluye la cookie de "recordarme"

#### Scenario: Caduca la sesión normal
- **WHEN** la sesión normal ha caducado pero la cookie de "recordarme" sigue siendo válida
- **THEN** la siguiente petición a la API sigue autenticada sin volver a pedir la contraseña

### Requirement: Cierre de sesión
La API SHALL permitir cerrar la sesión con `POST /api/logout`. Al cerrarla, MUST invalidar la sesión, regenerar el token CSRF y anular la cookie de "recordarme".

#### Scenario: Cerrar sesión
- **WHEN** un usuario con sesión iniciada llama a `POST /api/logout`
- **THEN** la API responde 204 y las siguientes peticiones a rutas protegidas responden 401

#### Scenario: Cerrar sesión sin haberla iniciado
- **WHEN** se llama a `POST /api/logout` sin sesión
- **THEN** la API responde 401

### Requirement: Rutas de la API protegidas
Todas las rutas de la API SHALL requerir sesión iniciada, excepto `GET /api/estado`, `GET /api/sanctum/csrf-cookie` y `POST /api/login`. Las rutas nuevas MUST quedar protegidas por defecto. Sin sesión, la API MUST responder 401 en JSON.

#### Scenario: Usuario actual con sesión
- **WHEN** un usuario con sesión iniciada llama a `GET /api/usuario`
- **THEN** la API responde 200 con su `id`, `nombre` y `usuario`

#### Scenario: Ruta protegida sin sesión
- **WHEN** se llama a `GET /api/usuario` sin sesión
- **THEN** la API responde 401 en JSON

#### Scenario: Estado de la conexión sin sesión
- **WHEN** se llama a `GET /api/estado` sin sesión
- **THEN** la API responde con el estado de la conexión como hasta ahora

### Requirement: Pantalla de login
El frontend SHALL ofrecer una pantalla de login en `/login`, sin barra de navegación inferior, con el logotipo y el nombre de la app, un campo de usuario, un campo de contraseña con botón para mostrarla u ocultarla, la casilla "Mantener la sesión en este móvil" marcada por defecto y el botón "Entrar". MUST usar los componentes de la base visual y verse correctamente en modo claro y oscuro. MUST NOT ofrecer registro ni recuperación de contraseña.

#### Scenario: Abrir el login
- **WHEN** el usuario abre la pantalla de login
- **THEN** ve los campos de usuario y contraseña vacíos, la casilla "Mantener la sesión en este móvil" marcada y el botón "Entrar"

#### Scenario: Mostrar y ocultar la contraseña
- **WHEN** el usuario pulsa el botón del ojo junto a la contraseña
- **THEN** la contraseña se muestra como texto y el botón pasa a llamarse "Ocultar contraseña"; al pulsarlo de nuevo, vuelve a ocultarse

#### Scenario: Campos vacíos
- **WHEN** el usuario pulsa "Entrar" con el usuario o la contraseña vacíos
- **THEN** se muestra un error en cada campo vacío y no se envía nada al servidor

#### Scenario: Enviando
- **WHEN** el usuario pulsa "Entrar" con los dos campos rellenos
- **THEN** el botón se desactiva y muestra "Entrando…" hasta que responde el servidor

#### Scenario: Entrar correctamente
- **WHEN** el servidor acepta las credenciales
- **THEN** la app muestra la pantalla que el usuario quería abrir o, si no había ninguna, Inicio

#### Scenario: Credenciales incorrectas
- **WHEN** el servidor rechaza las credenciales
- **THEN** se muestra un aviso de error con el mensaje genérico, se vacía la contraseña y el foco pasa a ese campo

#### Scenario: Demasiados intentos
- **WHEN** el servidor responde que se han superado los intentos
- **THEN** se muestra un aviso de error con el tiempo que hay que esperar

#### Scenario: Servidor no disponible
- **WHEN** no se puede conectar con el servidor al pulsar "Entrar"
- **THEN** se muestra un aviso de error indicando que no se puede conectar con el servidor

#### Scenario: Teclado del móvil
- **WHEN** el usuario escribe en el campo de usuario
- **THEN** el móvil no pone mayúscula inicial ni corrige el texto, y el navegador puede autocompletar el usuario y la contraseña guardados

### Requirement: Pantallas protegidas en el frontend
Todas las pantallas de la app, salvo el login, SHALL requerir sesión iniciada. Al abrir la app, el frontend MUST comprobar con el servidor si hay sesión antes de mostrar ninguna pantalla protegida.

#### Scenario: Abrir la app sin sesión
- **WHEN** el usuario sin sesión abre cualquier dirección de la app
- **THEN** se le lleva al login y, tras entrar, se le muestra la dirección que había abierto

#### Scenario: Abrir la app con sesión
- **WHEN** el usuario con sesión abre la app
- **THEN** ve directamente la pantalla pedida, sin que aparezca el login

#### Scenario: Comprobando la sesión
- **WHEN** la app está comprobando si hay sesión
- **THEN** se muestra una pantalla de carga y no el login

#### Scenario: Abrir el login con sesión
- **WHEN** el usuario con sesión abre `/login`
- **THEN** se le lleva a Inicio

#### Scenario: Servidor no disponible al abrir la app
- **WHEN** al abrir la app no se puede conectar con el servidor
- **THEN** se muestra un mensaje indicando que no se puede conectar con el servidor y un botón para reintentar

#### Scenario: La sesión caduca mientras se usa la app
- **WHEN** una petición a la API responde 401 estando dentro de la app
- **THEN** la app lleva al usuario al login

#### Scenario: Botón atrás tras entrar
- **WHEN** el usuario entra desde el login y pulsa el botón atrás
- **THEN** no vuelve a la pantalla de login

### Requirement: Sesión caducada solo por respuesta del servidor
El cliente de API del frontend SHALL dar la sesión por caducada, y llevar al usuario al login, únicamente cuando el servidor responda 401, o 419 tras haber renovado el token CSRF y repetido la petición una vez. Un fallo de red, un tiempo de espera agotado o un error del servidor (5xx) MUST NOT dar la sesión por caducada ni sacar al usuario de la pantalla en la que está; en esos casos la petición MUST fallar con un error que la pantalla pueda mostrar.

#### Scenario: El servidor responde 401
- **WHEN** una petición a una ruta protegida recibe un 401
- **THEN** la app da la sesión por caducada y muestra el login

#### Scenario: Token CSRF caducado
- **WHEN** una petición que modifica datos recibe un 419
- **THEN** el cliente pide un token CSRF nuevo y repite la petición una vez, sin sacar al usuario de la app

#### Scenario: El 419 se repite
- **WHEN** la petición repetida tras renovar el token CSRF vuelve a recibir un 419
- **THEN** la app da la sesión por caducada y muestra el login

#### Scenario: Fallo de red
- **WHEN** una petición falla porque no hay conexión con el servidor
- **THEN** la petición termina con un error de red, el usuario sigue en la misma pantalla y la sesión no se da por caducada

#### Scenario: Tiempo de espera agotado
- **WHEN** el servidor no responde dentro del tiempo máximo de espera
- **THEN** la petición termina con un error de red, el usuario sigue en la misma pantalla y la sesión no se da por caducada

#### Scenario: Error del servidor
- **WHEN** una petición recibe un error 500
- **THEN** la petición termina con un error, el usuario sigue en la misma pantalla y la sesión no se da por caducada
