## MODIFIED Requirements

### Requirement: Backend Laravel como API con Sanctum y MariaDB
El directorio `backend/` SHALL contener un proyecto Laravel con las rutas de API habilitadas, Sanctum instalado y configurado para autenticar el frontend con cookie de sesión, y la conexión de base de datos configurada para MariaDB.

#### Scenario: Migraciones iniciales
- **WHEN** con la base de datos de Docker arrancada se ejecuta `php artisan migrate`
- **THEN** las migraciones se aplican sin errores en MariaDB, con la tabla de usuarios con clave UUID y sin la tabla de tokens personales de Sanctum

#### Scenario: Pruebas del backend
- **WHEN** se ejecuta `php artisan test` en `backend/`
- **THEN** se ejecutan todas las pruebas sin necesitar la base de datos de Docker

### Requirement: Documentación de arranque
El repositorio SHALL incluir un `README.md` genérico que explica qué es el proyecto, los requisitos, los pasos para arrancar el entorno de desarrollo, cómo crear cuentas de usuario, cómo cerrar todas las sesiones de un usuario y cómo ejecutar las pruebas, sin datos reales de ninguna explotación.

#### Scenario: Arranque desde cero
- **WHEN** una persona con los requisitos instalados sigue los pasos del `README.md`
- **THEN** consigue iniciar sesión con un usuario de prueba y ver en la página de estado que la conexión funciona

#### Scenario: Crear una cuenta
- **WHEN** una persona sigue las instrucciones del `README.md` para crear una cuenta
- **THEN** sabe qué comando ejecutar y qué datos le va a pedir

#### Scenario: Móvil perdido
- **WHEN** una persona busca en el `README.md` qué hacer si pierde un móvil con la sesión iniciada
- **THEN** encuentra el comando para cerrar todas las sesiones de su usuario

## ADDED Requirements

### Requirement: Pruebas automáticas del frontend
El frontend SHALL incluir Vitest y Testing Library para probar los componentes en un navegador simulado. Las pruebas MUST poder ejecutarse sin el backend arrancado y sin el archivo `.env` del frontend.

#### Scenario: Ejecutar las pruebas
- **WHEN** se ejecuta `npm test` en `frontend/`
- **THEN** se ejecutan todas las pruebas una vez y se muestra el resultado

#### Scenario: Modo vigilancia
- **WHEN** se ejecuta `npm run test:vigilar` en `frontend/`
- **THEN** las pruebas se repiten automáticamente al guardar cambios
