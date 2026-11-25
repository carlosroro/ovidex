## ADDED Requirements

### Requirement: Rutas de las secciones principales
La app SHALL tener una dirección (ruta) propia para cada sección principal: Inicio (`/`), Rebaño (`/rebano`), Almacén (`/almacen`) y Más (`/mas`). Abrir o recargar cualquiera de esas direcciones MUST mostrar directamente su pantalla.

#### Scenario: Abrir la app
- **WHEN** el usuario abre la app en la dirección raíz
- **THEN** se muestra la pantalla de Inicio

#### Scenario: Recargar una sección
- **WHEN** el usuario está en Almacén y recarga la página
- **THEN** sigue viendo la pantalla de Almacén

#### Scenario: Botón atrás
- **WHEN** el usuario va de Inicio a Rebaño y pulsa el botón atrás del navegador o del móvil
- **THEN** vuelve a la pantalla de Inicio

### Requirement: Pantallas vacías preparadas
Cada sección principal SHALL mostrar su cabecera con el título de la sección y un mensaje de que el contenido llegará más adelante. Las pantallas MUST NOT mostrar datos reales ni de ejemplo.

#### Scenario: Pantalla de Rebaño vacía
- **WHEN** el usuario entra en Rebaño
- **THEN** ve el título "Rebaño" y un mensaje indicando que la sección aún no tiene contenido

### Requirement: Barra de navegación inferior
La app SHALL mostrar en todas las pantallas una barra de navegación fija en la parte inferior con, en este orden: Inicio, Rebaño, el botón central "Registrar", Almacén y Más. Cada sección MUST ser un enlace con icono y texto, y la sección actual MUST destacarse visualmente y marcarse como página actual para los lectores de pantalla.

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

### Requirement: Menú de acciones del botón Registrar
El botón central "Registrar" SHALL abrir un menú que aparece desde la parte inferior con las acciones Conteo, Parto, Tratamiento, Alta, Baja, Foto y Compra de alimento, cada una con icono y texto. Mientras estas acciones no estén implementadas, MUST indicarse que llegarán próximamente y pulsarlas MUST NOT tener ningún efecto.

#### Scenario: Abrir el menú
- **WHEN** el usuario pulsa el botón "Registrar"
- **THEN** aparece el menú con las siete acciones y el resto de la pantalla queda atenuado y bloqueado

#### Scenario: Acción aún no disponible
- **WHEN** el usuario pulsa la acción "Parto"
- **THEN** no ocurre nada y la acción se ve marcada como "Próximamente"

#### Scenario: Cerrar el menú
- **WHEN** el menú está abierto y el usuario pulsa "Cerrar", toca fuera del menú o pulsa la tecla Escape
- **THEN** el menú se cierra y el foco vuelve al botón "Registrar"

#### Scenario: Foco dentro del menú
- **WHEN** el menú está abierto y el usuario usa el tabulador
- **THEN** el foco se mueve solo entre los elementos del menú

### Requirement: Sección Más
La pantalla Más SHALL mostrar una lista de enlaces a sus subpantallas: Ajustes (`/mas/ajustes`) y Estado de la conexión (`/mas/estado`). Cada subpantalla MUST tener un enlace para volver a Más.

#### Scenario: Ir a Ajustes
- **WHEN** el usuario pulsa "Ajustes" en la pantalla Más
- **THEN** se muestra la pantalla de Ajustes con un enlace para volver a Más

#### Scenario: Selector de apariencia en Ajustes
- **WHEN** el usuario está en Ajustes
- **THEN** ve el selector de apariencia con las opciones Automático, Claro y Oscuro, con la opción actual marcada

### Requirement: Ruta no encontrada
La app SHALL mostrar una pantalla de "página no encontrada" cuando la dirección no corresponda a ninguna pantalla, con un enlace para ir a Inicio.

#### Scenario: Dirección desconocida
- **WHEN** el usuario abre una dirección que no existe
- **THEN** ve un mensaje de página no encontrada y un enlace a Inicio, con la barra de navegación visible
