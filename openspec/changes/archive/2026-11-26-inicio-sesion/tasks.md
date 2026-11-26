## 1. Usuarios en la base de datos

- [x] 1.1 Modificar la migración de `users`: `id` UUID, `nombre`, `usuario` único, sin `email` ni `email_verified_at`; quitar la tabla `password_reset_tokens`; `user_id` de `sessions` como `foreignUuid`
- [x] 1.2 Borrar la migración de `personal_access_tokens`
- [x] 1.3 Adaptar el modelo `User`: `HasUuids`, campos `nombre` y `usuario` en `Fillable`, quitar `HasApiTokens` y el cast de `email_verified_at`, y normalizar `usuario` a minúsculas y sin espacios al guardarlo
- [x] 1.4 Adaptar `UserFactory` a las columnas nuevas con datos inventados
- [x] 1.5 Recrear la base de desarrollo con `php artisan migrate:fresh` y comprobar en Adminer la tabla `users`

## 2. Creación de cuentas

- [x] 2.1 Crear el comando `usuarios:crear` (`CrearUsuario`) que pide nombre, usuario y contraseña dos veces con Laravel Prompts, valida (formato y unicidad del usuario, longitud y coincidencia de la contraseña) y vuelve a preguntar si algo no es válido
- [x] 2.2 Crear `UsuariosPruebaSeeder` con los dos usuarios inventados y la contraseña desde `SEEDER_PASSWORD`; si está vacía o no existe, detenerse sin crear nada con un mensaje que diga qué variable falta y que se define en `backend/.env`
- [x] 2.3 Llamar a `UsuariosPruebaSeeder` desde `DatabaseSeeder` solo en `local` y `testing`, y quitar el usuario de ejemplo actual
- [x] 2.4 Pruebas `CrearUsuarioTest`: cuenta válida (hash y minúsculas), usuario repetido, formato no válido, contraseña corta y contraseñas distintas
- [x] 2.5 Pruebas `UsuariosPruebaSeederTest`: con `SEEDER_PASSWORD` crea los dos usuarios; sin ella se detiene con el mensaje y no crea ninguno
- [x] 2.6 Crear el comando `usuarios:cerrar-sesiones {usuario}` (`CerrarSesionesUsuario`): borra las filas de `sessions` del usuario, cambia su `remember_token`, muestra cuántas sesiones ha cerrado, da error con código de fallo si el usuario no existe y avisa si el driver de sesión no es `database`
- [x] 2.7 Pruebas `CerrarSesionesUsuarioTest` (con driver de sesión `database`): borra las sesiones y cambia el `remember_token`, una cookie "recordarme" anterior deja de autenticar, otro usuario no se ve afectado, el usuario puede volver a entrar y un usuario inexistente da error sin cambiar nada

## 3. Configuración de Sanctum y sesión

- [x] 3.1 Activar `statefulApi()` en `bootstrap/app.php`
- [x] 3.2 Cambiar el `prefix` de Sanctum a `api/sanctum` en `config/sanctum.php`
- [x] 3.3 Añadir `remember` al guard `web` en `config/auth.php`, leído de `AUTH_REMEMBER_MINUTOS` (por defecto 525600)
- [x] 3.4 Actualizar `backend/.env.example` con `SANCTUM_STATEFUL_DOMAINS`, `AUTH_REMEMBER_MINUTOS=525600` (365 días) y `SEEDER_PASSWORD=` (vacía), con comentarios
- [x] 3.5 Cambiar el proxy de Vite a `changeOrigin: false` y explicar el motivo en un comentario

## 4. Rutas de sesión en la API

- [x] 4.1 Crear `UsuarioResource` que devuelve solo `id`, `nombre` y `usuario`
- [x] 4.2 Crear `IniciarSesionRequest` con la validación de `usuario`, `password` y `recordar`, el límite de 5 intentos fallidos por minuto con clave `usuario|IP` y el mensaje genérico
- [x] 4.3 Crear `SesionController` con `iniciar` (login, regenerar sesión, recordar), `cerrar` (logout, invalidar sesión y regenerar token) y `actual`
- [x] 4.4 Definir en `routes/api.php` `POST /login` pública y el grupo `auth:sanctum` con `POST /logout` y `GET /usuario`; quitar `GET /user`
- [x] 4.5 Pruebas `SesionTest`: login correcto, usuario en mayúsculas, contraseña incorrecta y usuario inexistente con la misma respuesta, campos vacíos, cookie "recordarme" con y sin `recordar`
- [x] 4.6 Pruebas `SesionTest`: límite de intentos (429 en el sexto, aunque la contraseña sea correcta), reinicio del contador tras un acierto, otro usuario no se bloquea
- [x] 4.7 Pruebas `SesionTest`: `GET /api/usuario` con y sin sesión, logout (204 y después 401), logout sin sesión (401) y `/api/estado` público
- [x] 4.8 Prueba `SesionTest` de CSRF (activando la protección en esa prueba): login desde otro sitio sin token da 419 y no inicia sesión; con token correcto sí entra
- [x] 4.9 Ejecutar `php artisan test` y comprobar que pasan todas las pruebas, también las de estado
- [x] 4.10 Comprobar con `curl` a través del proxy de Vite: login desde otro sitio sin token (419), login con token (200), `GET /api/usuario` con la cookie (200), logout (204) y después 401

## 5. Pruebas en el frontend

- [x] 5.1 Instalar como dependencias de desarrollo `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event` y `@testing-library/jest-dom`
- [x] 5.2 Añadir el bloque `test` a `vite.config.js` (jsdom y archivo de preparación) y saltar la comprobación de `VITE_API_PROXY_TARGET` al ejecutar las pruebas
- [x] 5.3 Crear el archivo de preparación que carga `@testing-library/jest-dom` y limpia el DOM tras cada prueba
- [x] 5.4 Añadir los scripts `test` y `test:vigilar` a `package.json` (lanzados con `scripts/vitest.mjs`, que corrige la letra de unidad en Windows) y comprobar que `npm test` arranca, con una primera prueba de `CampoTexto`

## 6. Cliente de API y sesión en el frontend

- [x] 6.1 Crear `src/api/cliente.js` con `peticion()`, `ErrorApi` (tipos `red` y `http`), tiempo máximo de espera de 15 s y la gestión de la cookie `XSRF-TOKEN`
- [x] 6.2 Añadir al cliente el reintento único ante 419 y el aviso de sesión perdida (`alPerderSesion`) solo ante 401 o un 419 repetido, nunca ante fallo de red, tiempo agotado ni 5xx
- [x] 6.3 Pruebas `cliente.test.js` con `fetch` simulado: cabecera `X-XSRF-TOKEN`, 401 avisa, 419 reintenta una vez y solo avisa si se repite, fallo de red, tiempo agotado y 500 lanzan error sin avisar
- [x] 6.4 Crear `src/sesion/` con el contexto exportado, `SesionProvider` (comprobación inicial con `GET /api/usuario`, `iniciarSesion`, `cerrarSesion`) y el hook `useSesion()`
- [x] 6.5 Crear `RutaProtegida`: pantalla de carga mientras se comprueba, pantalla de error con "Reintentar" si no hay servidor, redirección al login guardando la dirección pedida
- [x] 6.6 Reorganizar las rutas en `App.jsx` (`/login` fuera de `Marco`, el resto dentro de `RutaProtegida`) y envolver la app con `SesionProvider` en `main.jsx`

## 7. Componentes y pantalla de login

- [x] 7.1 Añadir a `CampoTexto` la prop opcional `accion` que se pinta dentro del recuadro del campo
- [x] 7.2 Crear `CampoContrasena` con el botón de ojo, `aria-label` y `aria-pressed`
- [x] 7.3 Crear `Casilla` (checkbox con etiqueta, color principal y zona táctil de 48 px)
- [x] 7.4 Crear `Login.jsx` y `Login.css` con la cabecera (logotipo, título y frase), el formulario y la nota de acceso privado, con el aspecto del mockup en modo claro y oscuro
- [x] 7.5 Añadir a `Login` la validación de campos vacíos, el estado "Entrando…", los avisos de error (422, 429, sin conexión), el vaciado y foco de la contraseña tras un error, la redirección tras entrar y la redirección a Inicio si ya hay sesión
- [x] 7.6 Pruebas `Login.test.jsx`: campos y casilla marcada, mostrar y ocultar contraseña, campos vacíos, envío con `recordar` true y false, redirección tras entrar, mensajes de 422 y 429, botón desactivado mientras se envía
- [x] 7.7 Pruebas `RutaProtegida.test.jsx`: redirige al login sin sesión y muestra la pantalla con sesión

## 8. Cerrar sesión en Más

- [x] 8.1 Mostrar en Más el nombre y el usuario de la sesión actual
- [x] 8.2 Añadir el botón "Cerrar sesión" con icono `LogOut`, que cierra la sesión y lleva al login, y muestra un aviso si falla

## 9. Documentación y comprobación final

- [x] 9.1 Actualizar el README: recrear la base de datos con `migrate:fresh --seed`, variables nuevas, comandos `usuarios:crear` y `usuarios:cerrar-sesiones` (qué hacer si se pierde un móvil) y cómo ejecutar las pruebas de backend y frontend
- [x] 9.2 Ejecutar `npm test`, `npm run lint` y `npm run format:check` en el frontend y `php artisan test` en el backend
- [x] 9.3 Probar a mano en el navegador: login correcto e incorrecto, límite de intentos, mostrar contraseña, redirección a la pantalla pedida, recarga con sesión, cerrar sesión y modo oscuro
- [x] 9.4 Probar a mano que con "Mantener la sesión" la sesión sobrevive al borrar la cookie de sesión normal (simula que ha caducado) y sin ella no
- [x] 9.5 Probar a mano que al parar `php artisan serve` con la app abierta se muestra un error pero no se vuelve al login, y que tras `usuarios:cerrar-sesiones` la app pide el login en la siguiente petición
- [x] 9.6 Revisar que no hay datos reales ni contraseñas en ningún archivo del cambio
