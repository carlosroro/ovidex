## MODIFIED Requirements

### Requirement: Rutas de las secciones principales
La app SHALL tener una dirección (ruta) propia para cada sección principal: Inicio (`/`), Rebaño (`/rebano`), Almacén (`/almacen`) y Más (`/mas`). Con la sesión iniciada, abrir o recargar cualquiera de esas direcciones MUST mostrar directamente su pantalla. Sin sesión, MUST llevar antes al login.

#### Scenario: Abrir la app
- **WHEN** el usuario con sesión abre la app en la dirección raíz
- **THEN** se muestra la pantalla de Inicio

#### Scenario: Recargar una sección
- **WHEN** el usuario con sesión está en Almacén y recarga la página
- **THEN** sigue viendo la pantalla de Almacén

#### Scenario: Botón atrás
- **WHEN** el usuario va de Inicio a Rebaño y pulsa el botón atrás del navegador o del móvil
- **THEN** vuelve a la pantalla de Inicio

#### Scenario: Abrir una sección sin sesión
- **WHEN** el usuario sin sesión abre la dirección de una sección
- **THEN** se muestra el login y, tras entrar, la sección que había abierto

### Requirement: Barra de navegación inferior
La app SHALL mostrar en todas las pantallas, excepto en la de login, una barra de navegación fija en la parte inferior con, en este orden: Inicio, Rebaño, el botón central "Registrar", Almacén y Más. Cada sección MUST ser un enlace con icono y texto, y la sección actual MUST destacarse visualmente y marcarse como página actual para los lectores de pantalla.

#### Scenario: Ir a una sección
- **WHEN** el usuario pulsa "Almacén" en la barra inferior
- **THEN** se muestra la pantalla de Almacén y "Almacén" aparece destacado en la barra

#### Scenario: Sección actual en subpantallas
- **WHEN** el usuario está en una subpantalla de Más (por ejemplo, Ajustes)
- **THEN** "Más" aparece destacado en la barra

#### Scenario: Zona segura del móvil
- **WHEN** la app se usa en un móvil con barra de gestos en la parte inferior
- **THEN** la barra de navegación no queda tapada por ella

#### Scenario: El contenido no queda oculto
- **WHEN** una pantalla tiene contenido hasta el final
- **THEN** el último elemento se puede ver por completo sin quedar debajo de la barra

#### Scenario: Sin barra en el login
- **WHEN** se muestra la pantalla de login
- **THEN** no aparece la barra de navegación inferior

### Requirement: Sección Más
La pantalla Más SHALL mostrar con qué usuario se ha iniciado sesión, una lista de enlaces a sus subpantallas, Ajustes (`/mas/ajustes`) y Estado de la conexión (`/mas/estado`), y un botón "Cerrar sesión". Cada subpantalla MUST tener un enlace para volver a Más.

#### Scenario: Ir a Ajustes
- **WHEN** el usuario pulsa "Ajustes" en la pantalla Más
- **THEN** se muestra la pantalla de Ajustes con un enlace para volver a Más

#### Scenario: Selector de apariencia en Ajustes
- **WHEN** el usuario está en Ajustes
- **THEN** ve el selector de apariencia con las opciones Automático, Claro y Oscuro, con la opción actual marcada

#### Scenario: Usuario actual
- **WHEN** el usuario entra en Más
- **THEN** ve el nombre y el usuario con los que ha iniciado sesión

#### Scenario: Cerrar sesión
- **WHEN** el usuario pulsa "Cerrar sesión"
- **THEN** se cierra la sesión en el servidor y se muestra el login

#### Scenario: Error al cerrar sesión
- **WHEN** el usuario pulsa "Cerrar sesión" y no se puede conectar con el servidor
- **THEN** se muestra un aviso de error y la sesión sigue abierta
