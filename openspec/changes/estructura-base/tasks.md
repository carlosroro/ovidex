## 1. Comprobaciones previas

- [x] 1.1 Verificar en PowerShell las versiones de PHP (8.3 o superior), Composer, Node y Docker
- [x] 1.2 Verificar que PHP tiene activas las extensiones `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl` y `fileinfo` (`php -m`)

## 2. Base de datos en Docker

- [x] 2.1 Crear `.env.example` en la raíz con puertos, nombre de base de datos, usuario y contraseñas vacías para MariaDB
- [x] 2.2 Crear `docker-compose.yml` en la raíz con `name: ovidex-dev`, servicio `mariadb:11.8` (volumen con nombre y `healthcheck`) y servicio `adminer` con versión fija, puertos ligados a `127.0.0.1` y valores leídos del `.env`
- [x] 2.3 Copiar `.env.example` a `.env` (lo hace el usuario con sus propios valores), arrancar con `docker compose -p ovidex-dev up -d` y comprobar el acceso desde Adminer

## 3. Backend Laravel

- [x] 3.1 Crear el proyecto con `composer create-project laravel/laravel backend`
- [x] 3.2 Ejecutar `php artisan install:api` para instalar Sanctum y habilitar `routes/api.php`
- [x] 3.3 Ajustar `backend/.env.example` para MariaDB (`DB_CONNECTION=mariadb`, host, puerto, base de datos y usuario de ejemplo, sin contraseña) y nombre de la app genérico
- [x] 3.4 Configurar el `backend/.env` local (lo hace el usuario) y ejecutar `php artisan migrate` contra MariaDB
- [x] 3.5 Crear `EstadoController` y la ruta `GET /api/estado` que devuelve 200 o 503 según la base de datos responda, sin exponer detalles del error

## 4. Pruebas del backend

- [ ] 4.1 Configurar `phpunit.xml` para usar SQLite en memoria en las pruebas
- [ ] 4.2 Crear la prueba de `/api/estado` con base de datos disponible (200 y JSON esperado)
- [ ] 4.3 Crear la prueba de `/api/estado` con la base de datos fallando (503, `base_datos: error` y sin detalles internos)
- [ ] 4.4 Ejecutar `php artisan test` y comprobar que todo pasa

## 5. Frontend React

- [ ] 5.1 Crear el proyecto con `npm create vite@latest frontend -- --template react` e instalar dependencias
- [ ] 5.2 Configurar ESLint para JavaScript sin punto y coma y quitar el contenido de demostración de Vite
- [ ] 5.3 Crear `frontend/.env.example` con `VITE_API_PROXY_TARGET` y configurar el proxy de `/api` en `vite.config.js` leyendo esa variable
- [ ] 5.4 Crear la página de estado: estados "comprobando", "conexión correcta", "sin API" y "sin base de datos", con botón de volver a comprobar
- [ ] 5.5 Ejecutar `npm run lint` y `npm run build` sin errores

## 6. Documentación y verificación final

- [ ] 6.1 Escribir `README.md` genérico: qué es Ovidex, requisitos, pasos de arranque (Docker, backend, frontend) y comandos de Docker limitados a `ovidex-dev`
- [ ] 6.2 Prueba de punta a punta: con todo arrancado, la página muestra "conexión correcta"; parando MariaDB, muestra el fallo de base de datos; parando Laravel, muestra el fallo de API
- [ ] 6.3 Revisar con `git status` que no se sube ningún `.env`, `vendor/` ni `node_modules/`, y que ningún archivo contiene datos reales
