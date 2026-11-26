## ADDED Requirements

### Requirement: Subpantallas del Rebaño
La sección Rebaño SHALL tener, además de la lista (`/rebano`), las direcciones de la ficha de un animal (`/rebano/:id`), del alta (`/rebano/nuevo`) y de la edición (`/rebano/:id/editar`). Con la sesión iniciada, abrir o recargar cualquiera de ellas MUST mostrar directamente su pantalla, y en todas MUST aparecer "Rebaño" destacado en la barra de navegación.

#### Scenario: Recargar una ficha
- **WHEN** el usuario con sesión está en la ficha de un animal y recarga la página
- **THEN** sigue viendo la ficha de ese animal

#### Scenario: Sección actual en la ficha
- **WHEN** el usuario está en la ficha, el alta o la edición de un animal
- **THEN** "Rebaño" aparece destacado en la barra

## MODIFIED Requirements

### Requirement: Pantallas vacías preparadas
Las secciones principales que aún no tienen contenido (Inicio y Almacén) SHALL mostrar su cabecera con el título de la sección y un mensaje de que el contenido llegará más adelante. Estas pantallas MUST NOT mostrar datos reales ni de ejemplo.

#### Scenario: Pantalla de Almacén vacía
- **WHEN** el usuario entra en Almacén
- **THEN** ve el título "Almacén" y un mensaje indicando que la sección aún no tiene contenido

### Requirement: Menú de acciones del botón Registrar
El botón central "Registrar" SHALL abrir un menú que aparece desde la parte inferior con las acciones Conteo, Parto, Tratamiento, Alta, Baja, Foto y Compra de alimento, cada una con icono y texto. La acción "Alta" MUST ser un enlace que cierra el menú y abre el formulario de alta de un animal. Mientras el resto de acciones no estén implementadas, MUST indicarse que llegarán próximamente y pulsarlas MUST NOT tener ningún efecto.

#### Scenario: Abrir el menú
- **WHEN** el usuario pulsa el botón "Registrar"
- **THEN** aparece el menú con las siete acciones y el resto de la pantalla queda atenuado y bloqueado

#### Scenario: Acción Alta
- **WHEN** el usuario pulsa la acción "Alta"
- **THEN** el menú se cierra y se abre el formulario de alta de un animal

#### Scenario: Acción aún no disponible
- **WHEN** el usuario pulsa la acción "Parto"
- **THEN** no ocurre nada y la acción se ve marcada como "Próximamente"

#### Scenario: Cerrar el menú
- **WHEN** el menú está abierto y el usuario pulsa "Cerrar", toca fuera del menú o pulsa la tecla Escape
- **THEN** el menú se cierra y el foco vuelve al botón "Registrar"

#### Scenario: Foco dentro del menú
- **WHEN** el menú está abierto y el usuario usa el tabulador
- **THEN** el foco se mueve solo entre los elementos del menú
