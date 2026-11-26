## MODIFIED Requirements

### Requirement: Componentes base reutilizables
La app SHALL incluir los componentes reutilizables Botón, Tarjeta, Aviso, Campo de texto, Campo de contraseña, Casilla, Cabecera de pantalla, Barra de navegación y Menú inferior, con el aspecto de los mockups y usando las variables de la paleta.

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

#### Scenario: Cabecera de pantalla
- **WHEN** una pantalla usa la Cabecera de pantalla
- **THEN** muestra su título como encabezado principal y, si se indica, un enlace para volver
