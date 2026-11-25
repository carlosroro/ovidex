# Ovidex

Aplicación web para la gestión de una explotación de ganado ovino: censo de animales, lotes, conteo diario, altas y bajas, inventario de material, alimentación, sanidad y reproducción.

> Proyecto en desarrollo. Por ahora contiene la estructura base y la base visual de la app (navegación, pantallas vacías, modo claro y oscuro), sin funcionalidades todavía. En *Más › Estado de la conexión* se comprueba la conexión entre el frontend, la API y la base de datos.

## Estructura

| Carpeta / archivo | Contenido |
|---|---|
| `backend/` | API REST con Laravel, Sanctum y MariaDB |
| `frontend/` | Aplicación React con Vite (JavaScript) |
| `docker-compose.yml` | Base de datos de desarrollo: MariaDB y Adminer |
| `openspec/` | Especificaciones y cambios (OpenSpec) |

## Requisitos

- PHP 8.3 o superior, con las extensiones `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl` y `fileinfo`
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
notepad .env        # pon en DB_PASSWORD la misma contraseña que en el .env de la raíz
php artisan key:generate
php artisan migrate
php artisan serve
```

La API queda en http://127.0.0.1:8000. Comprobación: http://127.0.0.1:8000/api/estado

### 3. Frontend (React)

En otra ventana de PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Abre http://localhost:5173. Para comprobar que todo está conectado, ve a **Más › Estado de la conexión**: debe mostrar **Conexión correcta**.

## Comandos útiles

| Comando | Para qué sirve |
|---|---|
| `docker compose -p ovidex-dev ps` | Ver el estado de los contenedores |
| `docker compose -p ovidex-dev stop` | Parar la base de datos (los datos se conservan) |
| `docker compose -p ovidex-dev start` | Volver a arrancarla |
| `php artisan test` (en `backend/`) | Ejecutar las pruebas del backend |
| `npm run lint` (en `frontend/`) | Revisar el código con Oxlint |
| `npm run format` (en `frontend/`) | Formatear el código con Prettier |
| `npm run build` (en `frontend/`) | Compilar el frontend |

Usa siempre `-p ovidex-dev` en los comandos de Docker y no uses comandos globales (`docker system prune`, `docker volume prune`…), para no afectar a otros proyectos de Docker del equipo.

## Variables de entorno

Cada parte tiene su `.env.example` sin valores reales: `.env.example` (raíz, Docker), `backend/.env.example` y `frontend/.env.example`. Los archivos `.env` nunca se suben al repositorio.
