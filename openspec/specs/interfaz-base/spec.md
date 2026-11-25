# interfaz-base Specification

## Purpose
Dar a toda la app un aspecto coherente y accesible: colores en modo claro y oscuro, tipografía local, iconos y componentes reutilizables sobre los que se construyen las funcionalidades.

## Requirements
### Requirement: Paleta de colores centralizada
La interfaz SHALL definir todos sus colores como variables CSS en un único archivo, con nombres según su uso (fondo, superficie, texto, bordes, principal, aviso, información y error) y con un valor para el modo claro ("Verde campo") y otro para el modo oscuro ("Noche"). Los componentes MUST usar estas variables y no colores escritos directamente.

#### Scenario: Colores del modo claro
- **WHEN** la app se muestra en modo claro
- **THEN** el fondo, las tarjetas, los textos, los bordes y el color principal usan los valores de la paleta "Verde campo"

#### Scenario: Colores del modo oscuro
- **WHEN** la app se muestra en modo oscuro
- **THEN** los mismos elementos usan los valores de la paleta "Noche" sin cambiar ningún componente

#### Scenario: Texto sobre el color principal
- **WHEN** se muestra texto o un icono sobre el color principal
- **THEN** es blanco en modo claro y oscuro (color de superficie oscura) en modo oscuro

### Requirement: Selección de apariencia
La app SHALL ofrecer tres opciones de apariencia: automática, clara y oscura. Por defecto SHALL ser automática, siguiendo la configuración del sistema. La elección MUST recordarse en el navegador y aplicarse antes de pintar la primera pantalla.

#### Scenario: Modo automático por defecto
- **WHEN** el usuario abre la app por primera vez y su sistema está en modo oscuro
- **THEN** la app se muestra en modo oscuro

#### Scenario: Cambio del sistema en modo automático
- **WHEN** la apariencia es automática y el sistema cambia de claro a oscuro
- **THEN** la app cambia a oscuro sin recargar

#### Scenario: Elección manual
- **WHEN** el usuario elige "Oscuro" en Ajustes y su sistema está en claro
- **THEN** la app se muestra en modo oscuro inmediatamente

#### Scenario: Se recuerda la elección
- **WHEN** el usuario ha elegido "Claro" y vuelve a abrir la app
- **THEN** la app se muestra en claro desde el primer momento, sin ver antes un instante en oscuro

#### Scenario: Almacenamiento no disponible
- **WHEN** el navegador no permite guardar la preferencia
- **THEN** la app funciona en modo automático sin mostrar errores

### Requirement: Tipografía local
La app SHALL usar la fuente Archivo para títulos y cifras destacadas e Inter para el resto del texto. Los archivos de las fuentes MUST servirse desde el propio proyecto, sin peticiones a servicios externos.

#### Scenario: Fuentes sin servicios externos
- **WHEN** se carga la app
- **THEN** ninguna petición de red va a dominios de terceros para obtener fuentes

#### Scenario: Títulos con Archivo
- **WHEN** se muestra el título de una pantalla
- **THEN** se ve con la fuente Archivo en peso grueso

### Requirement: Iconos de trazo
La interfaz SHALL usar iconos de trazo en SVG y MUST NOT usar emojis como iconos. Un icono que acompaña a un texto visible MUST ocultarse a los lectores de pantalla; un control que solo tiene icono MUST tener un nombre accesible.

#### Scenario: Icono con texto
- **WHEN** un botón muestra un icono y un texto
- **THEN** el icono está marcado como decorativo y el lector de pantalla solo lee el texto

#### Scenario: Botón solo con icono
- **WHEN** un botón muestra solo un icono
- **THEN** el lector de pantalla anuncia un nombre que describe la acción

### Requirement: Componentes base reutilizables
La app SHALL incluir los componentes reutilizables Botón, Tarjeta, Aviso, Campo de texto, Cabecera de pantalla, Barra de navegación y Menú inferior, con el aspecto de los mockups y usando las variables de la paleta.

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

#### Scenario: Cabecera de pantalla
- **WHEN** una pantalla usa la Cabecera de pantalla
- **THEN** muestra su título como encabezado principal y, si se indica, un enlace para volver

### Requirement: Accesibilidad básica
La interfaz SHALL cumplir estas reglas en todas las pantallas: zonas táctiles de al menos 48 × 48 px, contraste de texto de al menos 4,5:1 en los dos modos, botones para las acciones y enlaces para la navegación, foco visible al usar el teclado, idioma del documento en español y un único encabezado principal por pantalla.

#### Scenario: Tamaño táctil
- **WHEN** se mide cualquier botón o enlace interactivo
- **THEN** su zona táctil es de al menos 48 × 48 px

#### Scenario: Navegación con teclado
- **WHEN** el usuario recorre la pantalla con el tabulador
- **THEN** cada elemento interactivo muestra un contorno de foco visible

#### Scenario: Contraste
- **WHEN** se comprueba el contraste de los textos sobre sus fondos en modo claro y en modo oscuro
- **THEN** todos alcanzan al menos 4,5:1

#### Scenario: Movimiento reducido
- **WHEN** el sistema tiene activada la opción de reducir el movimiento
- **THEN** los menús aparecen sin animación

