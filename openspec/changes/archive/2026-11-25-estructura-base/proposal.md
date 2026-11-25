## Why

El repositorio todavía no tiene código: solo configuración de Git, Claude Code y OpenSpec. Antes de construir cualquier funcionalidad hace falta una base común (backend, frontend y base de datos) que arranque en el PC de desarrollo y en la que se pueda comprobar que todas las piezas se comunican entre sí.

## What Changes

- Nuevo proyecto Laravel en `backend/`, configurado solo como API REST (sin vistas Blade para la app), con Sanctum instalado y conectado a MariaDB.
- Nuevo proyecto React con Vite en `frontend/`, en JavaScript (sin TypeScript).
- Nuevo archivo de Docker Compose para desarrollo, con nombre de proyecto `ovidex-dev`, que levanta solo MariaDB (versión fija) y Adminer. Laravel y React se ejecutan directamente en Windows.
- Archivos `.env.example` (raíz para Docker, `backend/` y `frontend/`) sin valores reales.
- Ruta de prueba `GET /api/estado` que indica si la API responde y si la base de datos está accesible.
- Página en React que llama a `/api/estado` y muestra de forma clara si la conexión funciona.
- `README.md` genérico: qué es el proyecto, requisitos y cómo arrancar el entorno de desarrollo.

## Fuera de este cambio

- Inicio de sesión y gestión de usuarios (Sanctum queda instalado, pero sin usarse todavía).
- PWA, service worker y funcionamiento sin conexión (IndexedDB, Dexie, sincronización).
- Cualquier funcionalidad de la aplicación (censo, lotes, conteo, etc.) y sus tablas.
- Diseño visual definitivo (paleta, tipografías, navegación).
- Instalación de uso en Docker con Caddy, HTTPS y DuckDNS.

## Capabilities

### New Capabilities
- `estado-conexion`: ruta de la API que informa del estado del backend y de la base de datos, y página del frontend que la consulta y muestra el resultado.
- `entorno-desarrollo`: arranque del entorno local (base de datos en Docker aislada en el proyecto `ovidex-dev`, variables de entorno de ejemplo y documentación de arranque).

### Modified Capabilities
<!-- Ninguna: no hay especificaciones previas. -->

## Impact

- Carpetas nuevas: `backend/`, `frontend/`.
- Archivos nuevos en la raíz: `docker-compose.yml`, `.env.example`, `README.md`.
- Dependencias nuevas: Laravel y Sanctum (Composer); React y Vite (npm); imágenes de Docker de MariaDB y Adminer.
- No afecta a otros proyectos de Docker del PC: todo queda bajo el proyecto `ovidex-dev`.
