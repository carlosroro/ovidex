## Why

La app es de uso privado y guardará datos de la explotación, así que nadie debe poder verlos ni modificarlos sin identificarse. Además, el resto de funcionalidades necesitan saber quién hace cada cambio (cada registro guardará quién lo creó y quién lo modificó). El login es la primera pieza de la fase base y debe estar antes que cualquier funcionalidad de datos.

## What Changes

- **Pantalla de login** (`/login`) con usuario y contraseña, botón para mostrar u ocultar la contraseña y la casilla "Mantener la sesión en este móvil", marcada por defecto. Reproduce el aspecto del mockup con los componentes de la base visual.
- **Entrada con nombre de usuario**, no con email. Se elimina el email de la tabla de usuarios.
- **Sin registro público**: las cuentas se crean con un comando de Artisan que pide nombre, usuario y contraseña (esta, sin mostrarse al escribirla). En desarrollo, un seeder crea dos usuarios de prueba inventados, con la contraseña tomada de una variable de entorno (vacía en `.env.example`); si falta, el seeder avisa claramente.
- **Cerrar todas las sesiones de un usuario** con un comando de Artisan (`usuarios:cerrar-sesiones <usuario>`), que invalida sus sesiones y su "recordarme" en todos los móviles. Pensado para el caso de un móvil perdido.
- **Autenticación de Sanctum para SPA** con cookie de sesión y protección CSRF, aprovechando que frontend y API se sirven desde el mismo origen (proxy de Vite en desarrollo).
- **Sesión de larga duración** (365 días) cuando se marca "Mantener la sesión", pensada para que en la fase 2 la app pueda trabajar sin conexión durante semanas sin pedir de nuevo el login.
- **La sesión solo se da por caducada si el servidor lo dice** (respuesta 401 o 419). Un fallo de red o un tiempo de espera agotado nunca saca al usuario de la app, para que en la fase 2 no se pierda la sesión por estar sin conexión.
- **Protección contra fuerza bruta**: límite de intentos fallidos y mensaje de error genérico que no indica si falla el usuario o la contraseña.
- **Todo protegido**: todas las pantallas de la app requieren sesión iniciada (sin sesión, se redirige al login y, tras entrar, se vuelve a la pantalla que se quería abrir). En la API, todas las rutas requieren sesión excepto `/api/estado` y las necesarias para iniciar sesión.
- **Cerrar sesión** desde la sección Más, que además muestra con qué usuario se ha entrado.
- **Usuarios con UUID** como clave primaria, como el resto de registros de la aplicación. **BREAKING**: cambian las migraciones de usuarios y sesiones; la base de datos de desarrollo se recrea (no contiene datos reales).
- Se elimina la tabla de tokens personales de Sanctum, que no se usa con la autenticación por cookie.
- **Pruebas**: se añaden Vitest y Testing Library al frontend, con pruebas del formulario de login, de la redirección y de cuándo el cliente de API da la sesión por caducada. En el backend, pruebas de todo el flujo: login correcto, credenciales incorrectas, límite de intentos, rutas protegidas, cierre de sesión y los comandos de creación de usuarios y de cierre de sesiones.

## Capabilities

### New Capabilities
- `autenticacion`: inicio y cierre de sesión con usuario y contraseña, sesión de larga duración, límite de intentos, protección de las rutas de la API y de las pantallas del frontend, cuándo se da la sesión por caducada y pantalla de login.
- `cuentas-usuario`: modelo de usuario (UUID, nombre y nombre de usuario), comandos de Artisan para crear cuentas y para cerrar todas las sesiones de un usuario, y usuarios de prueba para desarrollo.

### Modified Capabilities
- `navegacion`: la barra inferior no se muestra en la pantalla de login; la sección Más añade la opción "Cerrar sesión" y el nombre del usuario actual; las rutas de la app pasan a requerir sesión.
- `interfaz-base`: se añaden los componentes Casilla (checkbox con etiqueta) y Campo de contraseña (con botón para mostrarla u ocultarla).
- `entorno-desarrollo`: el frontend tiene pruebas automáticas con Vitest; las migraciones iniciales ya no incluyen la tabla de tokens; el arranque desde cero incluye crear los usuarios de prueba.

## Impact

- **Backend**: migración de usuarios y sesiones, modelo `User`, `config/auth.php`, `config/sanctum.php`, `bootstrap/app.php` (API con estado), nuevas rutas en `routes/api.php`, nuevo controlador de sesión, dos comandos de Artisan, `DatabaseSeeder`, factoría de usuarios, `.env.example` y pruebas.
- **API**: nuevas rutas `GET /api/sanctum/csrf-cookie`, `POST /api/login`, `POST /api/logout` y `GET /api/usuario` (sustituye a la `GET /api/user` de ejemplo).
- **Frontend**: cliente de la API con CSRF, contexto de sesión, protección de rutas, pantalla de login, componentes nuevos, cambios en `App.jsx` y en la pantalla Más, configuración de Vitest.
- **Dependencias nuevas (frontend, solo desarrollo)**: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.
- **Documentación**: README con la creación de usuarios, el cierre de sesiones en caso de móvil perdido y el arranque de las pruebas.

## Fuera de este cambio

- Cambiar la contraseña desde la app.
- Recuperar la contraseña olvidada.
- Roles o permisos distintos entre usuarios.
- Funcionamiento sin conexión (copia local, sesión sin servidor): llega en la fase 2.
- Cualquier funcionalidad de datos (ovejas, lotes, conteos…), incluido guardar quién creó o modificó cada registro.
- Ver las sesiones abiertas o cerrarlas desde la propia app (solo se podrá con el comando de Artisan).
