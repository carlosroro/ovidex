## Context

El repositorio está vacío de código. El desarrollo se hace en Windows: PHP, Composer y Node se ejecutan directamente en el PC, y Docker se usa solo para la base de datos. En el mismo PC hay otros proyectos de Docker que no deben verse afectados. El repositorio es público, así que ningún archivo puede contener contraseñas, rutas personales ni datos reales.

Este cambio crea el esqueleto sobre el que se construirán las fases siguientes (login, censo, PWA…), y una comprobación de punta a punta: navegador → React → Laravel → MariaDB.

## Goals / Non-Goals

**Goals:**
- Tener `backend/` (Laravel solo API + Sanctum) y `frontend/` (React + Vite en JavaScript) recién creados y funcionando.
- Levantar MariaDB y Adminer con un único comando, aislados en el proyecto `ovidex-dev`.
- Comprobar desde el navegador que el frontend llega a la API y la API llega a la base de datos.
- Que cualquier persona pueda arrancar el entorno siguiendo solo el `README.md` y los `.env.example`.

**Non-Goals:**
- Login, usuarios, PWA, funcionamiento sin conexión, tablas del dominio.
- Estilos definitivos o librerías de componentes.
- Docker para Laravel o React, Caddy y HTTPS (instalación de uso).

## Decisions

### 1. Laravel creado con el instalador de Composer y `install:api`
Se crea con `composer create-project laravel/laravel backend` (última versión estable compatible con PHP 8.3) y después `php artisan install:api`, que instala Sanctum, crea `routes/api.php` y publica su migración.
- *Alternativa*: instalar Sanctum a mano. Descartado: `install:api` es el camino oficial y deja todo enlazado.
- Las vistas Blade de bienvenida se dejan tal cual (vienen de serie y no estorban); la app solo usará rutas bajo `/api`.

### 2. React con la plantilla `react` de Vite (JavaScript)
`npm create vite@latest frontend -- --template react`. Se elimina el contenido de demostración.
- La plantilla actual trae **Oxlint** (en lugar de ESLint) para detectar errores; se mantiene.
- El estilo sin punto y coma lo aplica **Prettier** (`semi: false`), porque los linters actuales ya no se encargan del formato. Scripts `format` y `format:check`.
- *Alternativa*: Create React App. Descartado: está abandonado; Vite es el estándar actual.

### 3. El frontend llama a la API a través del proxy de Vite
En desarrollo, Vite redirige las peticiones a `/api/*` hacia Laravel (`php artisan serve`). El destino se lee de una variable de entorno del frontend (`VITE_API_PROXY_TARGET`).
- *Por qué*: el navegador ve un solo origen, así que no hace falta configurar CORS. Además imita la instalación de uso futura, donde Caddy servirá React y pasará `/api` a Laravel desde el mismo dominio. Esto también simplificará Sanctum con cookies más adelante.
- *Alternativa*: llamar directamente a `http://127.0.0.1:8000` y configurar CORS en Laravel. Descartado por las razones anteriores.

### 4. Ruta `GET /api/estado` con comprobación real de la base de datos
Un controlador pequeño (`EstadoController`) devuelve JSON:
- Todo bien → `200` con `{ "api": "ok", "base_datos": "ok" }`.
- Sin base de datos → `503` con `{ "api": "ok", "base_datos": "error" }`.

La comprobación hace una consulta mínima (`SELECT 1`) capturando la excepción. No devuelve el mensaje de error real (podría revelar host o usuario); el detalle queda en el log de Laravel.
- *Alternativa*: la ruta `/up` que trae Laravel. Descartado: no comprueba la base de datos ni está bajo `/api`.

### 5. Página de estado en React
`App.jsx` llama a `/api/estado` al cargar y muestra tres casos: *comprobando…*, *conexión correcta* (API y base de datos ok) o el fallo concreto (no llega a la API, o la API no llega a la base de datos). Incluye un botón para volver a comprobar. Sin librerías extra: `fetch` y estado de React.

### 6. Docker Compose en la raíz, con nombre fijo y versiones fijas
`docker-compose.yml` en la raíz con `name: ovidex-dev` y dos servicios:
- `mariadb`: imagen `mariadb:11.8` (versión LTS fija, no `latest`), con un volumen con nombre para los datos de prueba y un `healthcheck`.
- `adminer`: imagen `adminer` con versión fija, para consultar la base de datos desde el navegador.

Los puertos y credenciales se leen de un `.env` en la raíz (Docker Compose lo carga solo). Se documenta en `.env.example` de la raíz. Los puertos se publican solo en `127.0.0.1` para que no sean accesibles desde la red.
- *Alternativa*: poner las credenciales directamente en el YAML. Descartado: lo prohíben las normas del proyecto.
- *Alternativa*: que Docker lea `backend/.env`. Descartado: mezclaría la configuración de Laravel con la de Docker; se prefiere que cada pieza tenga su `.env`, con los mismos valores de usuario y base de datos.

### 7. Tres archivos `.env.example`
- Raíz: puertos, nombre de base de datos, usuario y contraseñas de MariaDB (valores vacíos o de ejemplo evidentes).
- `backend/`: el de Laravel, cambiado a `DB_CONNECTION=mariadb` y con los mismos nombres de variables, sin contraseña.
- `frontend/`: `VITE_API_PROXY_TARGET`.

### 8. Pruebas del backend
Prueba de característica (feature test) de `/api/estado` que comprueba el caso correcto (200) y el caso sin base de datos (503, simulando el fallo). Las pruebas usan SQLite en memoria (configuración de `phpunit.xml`), así no tocan la base de datos de desarrollo.

## Risks / Trade-offs

- [Composer se instala en Windows como `composer.bat`, que algunas terminales (Git Bash) no ejecutan] → En esas terminales se invoca como `php <ruta>/composer.phar`; el README lista Composer como requisito.
- [PHP sin las extensiones `pdo_mysql` o `pdo_sqlite`] → Comprobar con `php -m` antes de crear el proyecto; el README indica cómo activarlas en `php.ini`.
- [El puerto 3306 u 8080 ya lo usa otro proyecto del PC] → Los puertos son configurables en el `.env` de la raíz.
- [Copiar por error valores reales al `.env.example`] → Solo valores de ejemplo evidentes; los `.env` reales ya están en `.gitignore`.
- [Saltos de línea CRLF en archivos generados en Windows] → `.gitattributes` ya fuerza LF en el repositorio.

## Open Questions

- Ninguna bloqueante. La versión exacta de Laravel se fija al crear el proyecto y queda registrada en `composer.lock`.
