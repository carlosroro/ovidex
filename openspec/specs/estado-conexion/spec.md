# estado-conexion Specification

## Purpose
Permitir comprobar de un vistazo que el frontend llega a la API y que la API llega a la base de datos.

## Requirements
### Requirement: Ruta de estado de la API
La API SHALL ofrecer la ruta `GET /api/estado`, sin autenticación, que responde en JSON indicando si la API funciona y si la base de datos está accesible.

#### Scenario: API y base de datos disponibles
- **WHEN** se hace una petición `GET /api/estado` y la base de datos responde
- **THEN** la API devuelve el código 200 con `{ "api": "ok", "base_datos": "ok" }`

#### Scenario: Base de datos no disponible
- **WHEN** se hace una petición `GET /api/estado` y la base de datos no responde
- **THEN** la API devuelve el código 503 con `{ "api": "ok", "base_datos": "error" }`

#### Scenario: No se revelan detalles internos
- **WHEN** la comprobación de la base de datos falla
- **THEN** la respuesta MUST NOT incluir el mensaje de error, el host, el usuario ni otros datos de conexión

### Requirement: Página de estado en el frontend
El frontend SHALL ofrecer, dentro de la sección Más, una pantalla de estado de la conexión (`/mas/estado`) que al abrirse consulta `/api/estado` y muestra el resultado de forma clara, usando los componentes base de la interfaz. Esta pantalla MUST NOT mostrarse al abrir la app.

#### Scenario: Acceso desde Más
- **WHEN** el usuario pulsa "Estado de la conexión" en la pantalla Más
- **THEN** se abre la pantalla de estado y se lanza la comprobación

#### Scenario: No se comprueba al abrir la app
- **WHEN** el usuario abre la app en la dirección raíz
- **THEN** se muestra Inicio y no se hace ninguna petición a `/api/estado`

#### Scenario: Comprobación en curso
- **WHEN** la pantalla se abre y la petición aún no ha terminado
- **THEN** se muestra un mensaje indicando que se está comprobando la conexión

#### Scenario: Conexión correcta
- **WHEN** la API responde que la API y la base de datos están bien
- **THEN** la pantalla muestra que la conexión funciona

#### Scenario: La API no responde
- **WHEN** la petición a `/api/estado` falla por red o el servidor de Laravel no está arrancado
- **THEN** la pantalla muestra que no se puede conectar con la API

#### Scenario: La base de datos no responde
- **WHEN** la API responde con `base_datos` igual a `error`
- **THEN** la pantalla muestra que la API funciona pero la base de datos no está disponible

#### Scenario: Volver a comprobar
- **WHEN** el usuario pulsa el botón de volver a comprobar
- **THEN** la pantalla repite la petición y actualiza el resultado

