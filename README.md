# Ovidex

Aplicación web para la gestión de una explotación de ganado ovino: censo de animales, lotes, conteo diario, altas y bajas, inventario de material, alimentación, sanidad y reproducción.

> Proyecto en desarrollo. Por ahora contiene la estructura base, la base visual de la app (navegación, pantallas vacías, modo claro y oscuro) y el inicio de sesión. En *Más › Estado de la conexión* se comprueba la conexión entre el frontend, la API y la base de datos.

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `backend/` | API REST con Laravel, Sanctum y MariaDB |
| `frontend/` | Aplicación React con Vite (JavaScript) |
| `docker-compose.yml` | Base de datos de desarrollo: MariaDB y Adminer |
| `openspec/` | Especificaciones y cambios (OpenSpec) |

## Requisitos

- PHP 8.3 o superior, con las extensiones `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl` y `fileinfo` (y, opcionalmente, `intl`, que necesitan algunos comandos de Artisan como `db:table`)
- Composer 2
- Node.js 20 o superior y npm
- Docker Desktop

En desarrollo, Laravel y React se ejecutan directamente en el sistema. Docker se usa solo para la base de datos.

## Arrancar el entorno de desarrollo

Los comandos son de PowerShell y se lanzan desde la raíz del repositorio salvo que se indique otra carpeta.

### 1. Base de datos (Docker)

```powershell
Copy-Item .env.example .env
notepad .env        # rellena DB_PASSWORD y DB_ROOT_PASSWORD
docker compose -p ovidex-dev up -d
```

- MariaDB queda en `127.0.0.1:3307` y Adminer en http://localhost:8081 (sistema *MySQL*, servidor `mariadb`).
- Los contenedores no arrancan solos: hay que volver a ejecutar `up -d` (o `start`) cada vez.

### 2. Backend (Laravel)

```powershell
cd backend
composer install
Copy-Item .env.example .env
notepad .env        # DB_PASSWORD (la misma que en el .env de la raíz) y SEEDER_PASSWORD
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

- En `backend/.env`, `SEEDER_PASSWORD` es la contraseña que tendrán los usuarios de prueba. Elige la que quieras; si está vacía, `--seed` se detiene con un aviso.
- `migrate --seed` crea las tablas y dos usuarios de prueba inventados: **`prueba1`** y **`prueba2`**, con la contraseña de `SEEDER_PASSWORD`. Solo se crean en desarrollo, nunca en producción.

La API queda en http://127.0.0.1:8000. Comprobación: http://127.0.0.1:8000/api/estado

#### Si ya tenías la base de datos de antes del inicio de sesión

La tabla de usuarios ha cambiado (identificadores UUID, se entra con nombre de usuario en vez de email). Hay que recrear la base de datos de desarrollo:

```powershell
cd backend
php artisan migrate:fresh --seed
```

`migrate:fresh` **borra todas las tablas** y las vuelve a crear. Úsalo solo en la base de datos de desarrollo, que no contiene datos reales.

### 3. Frontend (React)

En otra ventana de PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Abre http://localhost:5173 e inicia sesión con `prueba1` y la contraseña de `SEEDER_PASSWORD`. Para comprobar que todo está conectado, ve a **Más › Estado de la conexión**: debe mostrar **Conexión correcta**.

## Cuentas de usuario

La app no tiene registro público: las cuentas se crean desde la terminal, en la carpeta `backend/`.

### Crear una cuenta

```powershell
php artisan usuarios:crear
```

El comando pide, uno a uno:

1. **Nombre**: el que se mostrará en la app.
2. **Usuario**: con el que se inicia sesión. De 3 a 30 caracteres: letras sin tildes, números, punto, guion o guion bajo. Se guarda en minúsculas.
3. **Contraseña** (dos veces): al menos 8 caracteres. No se ve mientras se escribe.

Si un dato no es válido, explica el motivo y lo vuelve a pedir.

### Si se pierde un móvil con la sesión iniciada

```powershell
php artisan usuarios:cerrar-sesiones <usuario>
```

Cierra **todas** las sesiones de ese usuario en todos sus dispositivos y anula el "Mantener la sesión". El usuario tendrá que volver a iniciar sesión en sus otros móviles. No cambia la contraseña ni afecta a los demás usuarios.

### Duración de la sesión

- Con **"Mantener la sesión en este móvil"** marcado (por defecto), la sesión dura 365 días. Se cambia con `AUTH_REMEMBER_MINUTOS` en `backend/.env`.
- Sin marcarlo, la sesión caduca tras `SESSION_LIFETIME` minutos sin usar la app (120 por defecto).

## Pruebas automáticas

| Dónde | Comando | Qué hace |
|---|---|---|
| `backend/` | `php artisan test` | Pruebas del backend (no necesitan la base de datos de Docker) |
| `frontend/` | `npm test` | Pruebas del frontend, una vez |
| `frontend/` | `npm run test:vigilar` | Pruebas del frontend, repitiéndose al guardar cambios |

Las pruebas del frontend usan Vitest y Testing Library, y no necesitan el backend arrancado ni el `.env` del frontend.

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `docker compose -p ovidex-dev ps` | Ver el estado de los contenedores |
| `docker compose -p ovidex-dev stop` | Parar la base de datos (los datos se conservan) |
| `docker compose -p ovidex-dev start` | Volver a arrancarla |
| `php artisan test` (en `backend/`) | Ejecutar las pruebas del backend |
| `php artisan usuarios:crear` (en `backend/`) | Crear una cuenta de usuario |
| `php artisan usuarios:cerrar-sesiones <usuario>` (en `backend/`) | Cerrar todas las sesiones de un usuario |
| `npm test` (en `frontend/`) | Ejecutar las pruebas del frontend |
| `npm run lint` (en `frontend/`) | Revisar el código con Oxlint |
| `npm run format` (en `frontend/`) | Formatear el código con Prettier |
| `npm run build` (en `frontend/`) | Compilar el frontend |

Usa siempre `-p ovidex-dev` en los comandos de Docker y no uses comandos globales (`docker system prune`, `docker volume prune`…), para no afectar a otros proyectos de Docker del equipo.

## Variables de entorno

Cada parte tiene su `.env.example` sin valores reales: `.env.example` (raíz, Docker), `backend/.env.example` y `frontend/.env.example`. Los archivos `.env` nunca se suben al repositorio.
