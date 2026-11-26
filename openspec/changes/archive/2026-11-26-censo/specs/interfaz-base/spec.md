## MODIFIED Requirements

### Requirement: Componentes base reutilizables
La app SHALL incluir los componentes reutilizables Botón, Tarjeta, Aviso, Campo de texto, Campo de contraseña, Casilla, Grupo de opciones, Área de texto, Campo de búsqueda, Pestañas, Etiqueta, Cabecera de pantalla, Barra de navegación y Menú inferior, con el aspecto de los mockups y usando las variables de la paleta.

#### Scenario: Variantes del botón
- **WHEN** se usa el componente Botón
- **THEN** se puede elegir entre las variantes principal, secundario y peligro, con o sin icono

#### Scenario: Botón que navega
- **WHEN** un Botón se usa para ir a otra pantalla
- **THEN** se pinta como un enlace real con el aspecto de botón

#### Scenario: Variantes del aviso
- **WHEN** se usa el componente Aviso
- **THEN** se puede elegir entre información, aviso, correcto y error, cada uno con sus colores e icono

#### Scenario: Campo de texto con etiqueta
- **WHEN** se usa el componente Campo de texto
- **THEN** tiene una etiqueta visible asociada al campo, y su texto de ayuda o de error se lee al enfocar el campo

#### Scenario: Campo de contraseña
- **WHEN** se usa el componente Campo de contraseña
- **THEN** se comporta como un Campo de texto que oculta lo escrito y tiene dentro un botón con icono de ojo, con nombre accesible "Mostrar contraseña" u "Ocultar contraseña" según el estado y tamaño táctil suficiente

#### Scenario: Casilla
- **WHEN** se usa el componente Casilla
- **THEN** muestra una casilla de verificación con su texto, que se marca o desmarca pulsando tanto la casilla como el texto, con el color principal y tamaño táctil suficiente

#### Scenario: Grupo de opciones
- **WHEN** se usa el componente Grupo de opciones
- **THEN** muestra un grupo con título visible y opciones excluyentes con aspecto de botones, de las que se elige una pulsándola o con las flechas del teclado, que el lector de pantalla anuncia como grupo de opciones y que puede mostrar un mensaje de error asociado

#### Scenario: Área de texto
- **WHEN** se usa el componente Área de texto
- **THEN** se comporta como un Campo de texto de varias líneas, con etiqueta visible, ayuda y error

#### Scenario: Campo de búsqueda
- **WHEN** se usa el componente Campo de búsqueda
- **THEN** muestra un campo con icono de lupa y nombre accesible, un botón para borrar el texto cuando hay algo escrito y, si se indica, un botón para alternar entre el teclado numérico y el de letras

#### Scenario: Pestañas
- **WHEN** se usa el componente Pestañas
- **THEN** muestra una fila de pestañas con la seleccionada destacada y su panel debajo, que el lector de pantalla anuncia como pestañas y que se recorre con las flechas izquierda y derecha

#### Scenario: Etiqueta
- **WHEN** se usa el componente Etiqueta
- **THEN** muestra un texto corto en forma de píldora, con variantes neutra, principal y aviso

#### Scenario: Cabecera de pantalla
- **WHEN** una pantalla usa la Cabecera de pantalla
- **THEN** muestra su título como encabezado principal y, si se indica, un enlace para volver
