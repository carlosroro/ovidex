## ADDED Requirements

### Requirement: Base de datos de desarrollo en Docker aislada
El repositorio SHALL incluir un archivo de Docker Compose con el nombre de proyecto `ovidex-dev` que levanta únicamente MariaDB, con una versión fija, y Adminer, también con versión fija.

#### Scenario: Arrancar la base de datos
- **WHEN** se ejecuta `docker compose -p ovidex-dev up -d` en la raíz del repositorio con un `.env` válido
- **THEN** se crean y arrancan solo los contenedores de MariaDB y Adminer del proyecto `ovidex-dev`

#### Scenario: No afectar a otros proyectos
- **WHEN** se arrancan o se paran los contenedores de Ovidex
- **THEN** los contenedores, volúmenes y redes de otros proyectos de Docker MUST NOT verse modificados

#### Scenario: Versiones fijas
- **WHEN** se revisa el archivo de Docker Compose
- **THEN** ninguna imagen usa la etiqueta `latest` ni carece de etiqueta de versión

#### Scenario: Solo accesible desde el propio PC
- **WHEN** se publican los puertos de MariaDB y Adminer
- **THEN** quedan ligados a `127.0.0.1` y no son accesibles desde otros equipos de la red

### Requirement: Configuración por variables de entorno sin valores reales
Las credenciales, puertos y direcciones SHALL leerse de archivos `.env` no versionados. El repositorio SHALL incluir `.env.example` en la raíz, en `backend/` y en `frontend/`, sin contraseñas, tokens ni datos reales.

#### Scenario: Sin secretos en el código
- **WHEN** se revisan el archivo de Docker Compose y la configuración de Laravel y Vite
- **THEN** no contienen contraseñas, tokens ni rutas personales escritas directamente

#### Scenario: Plantillas completas
- **WHEN** se copia cada `.env.example` a `.env` y se rellenan los valores vacíos
- **THEN** la pieza correspondiente (Docker, Laravel o React) tiene todas las variables que necesita para arrancar

### Requirement: Backend Laravel como API con Sanctum y MariaDB
El directorio `backend/` SHALL contener un proyecto Laravel con las rutas de API habilitadas, Sanctum instalado y la conexión de base de datos configurada para MariaDB.

#### Scenario: Migraciones iniciales
- **WHEN** con la base de datos de Docker arrancada se ejecuta `php artisan migrate`
- **THEN** las migraciones iniciales de Laravel y Sanctum se aplican sin errores en MariaDB

### Requirement: Frontend React con Vite en JavaScript
El directorio `frontend/` SHALL contener un proyecto React creado con Vite en JavaScript, sin TypeScript, que en desarrollo redirige las peticiones a `/api` hacia el backend.

#### Scenario: Arrancar el frontend
- **WHEN** se ejecuta `npm run dev` en `frontend/` con su `.env` configurado
- **THEN** el servidor de Vite arranca y las peticiones a `/api/*` llegan al backend de Laravel

### Requirement: Documentación de arranque
El repositorio SHALL incluir un `README.md` genérico que explica qué es el proyecto, los requisitos y los pasos para arrancar el entorno de desarrollo, sin datos reales de ninguna explotación.

#### Scenario: Arranque desde cero
- **WHEN** una persona con los requisitos instalados sigue los pasos del `README.md`
- **THEN** consigue ver en el navegador la página de estado indicando que la conexión funciona
