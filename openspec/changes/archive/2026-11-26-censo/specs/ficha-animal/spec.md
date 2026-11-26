## ADDED Requirements

### Requirement: Ficha tipo DNI
La ficha de un animal (`/rebano/:id`) SHALL mostrar, en una tarjeta destacada: dos huecos para las fotos de cara y de costado (vacíos, con el texto "Sin foto" y sin acción), el tipo de animal, el nombre o número como encabezado principal (o los últimos 4 dígitos del crotal si no tiene), una etiqueta de estado ("Activa" o "Baja"), el código oficial agrupado (`ES 0000 0000 0001`) en un bloque destacado con el título "Código oficial", y etiquetas de sexo, edad (si se conoce), tipo de identificador electrónico y reproductor (si lo es). La ficha MUST verse correctamente en modo claro y oscuro.

#### Scenario: Ficha de una oveja
- **WHEN** el usuario abre la ficha de una hembra activa con nombre, fecha exacta y bolo ruminal
- **THEN** ve su nombre como título, la etiqueta "Activa", el código oficial agrupado y las etiquetas "Hembra", su edad en años y "Bolo ruminal"

#### Scenario: Animal sin nombre
- **WHEN** el usuario abre la ficha de un animal sin nombre ni número con código `ES000000000123`
- **THEN** el título es "…0123"

#### Scenario: Carnero reproductor
- **WHEN** el usuario abre la ficha de un macho marcado como reproductor
- **THEN** ve el tipo "Carnero reproductor" y la etiqueta "Reproductor"

#### Scenario: Edad desconocida
- **WHEN** el animal tiene la fecha de nacimiento desconocida
- **THEN** no aparece la etiqueta de edad

#### Scenario: Edad aproximada
- **WHEN** el animal tiene una fecha de nacimiento con precisión de mes o de año de hace unos 5 años
- **THEN** la etiqueta de edad es "≈ 5 años"

#### Scenario: Huecos de foto
- **WHEN** el usuario abre cualquier ficha
- **THEN** ve los huecos "Cara" y "Costado" con el texto "Sin foto"

### Requirement: Pestañas de la ficha
La ficha SHALL tener las pestañas Datos, Reproducción, Sanidad e Historial, con Datos seleccionada al abrirla. Las pestañas Reproducción, Sanidad e Historial MUST mostrar que su contenido llegará próximamente. Las pestañas MUST poder usarse con lector de pantalla y con las flechas del teclado.

#### Scenario: Pestaña por defecto
- **WHEN** el usuario abre una ficha
- **THEN** está seleccionada la pestaña Datos y se ve su contenido

#### Scenario: Pestaña sin contenido
- **WHEN** el usuario pulsa la pestaña Sanidad
- **THEN** ve un mensaje de que llegará próximamente

#### Scenario: Teclado
- **WHEN** el foco está en la pestaña Datos y el usuario pulsa la flecha derecha
- **THEN** el foco pasa a la pestaña Reproducción y se selecciona

### Requirement: Pestaña Datos
La pestaña Datos SHALL mostrar raza, nacimiento, origen, madre y padre, con un guion cuando no hay dato, y las notas si las hay. El nacimiento MUST mostrarse como `dd/mm/aaaa` si la precisión es exacta, como "mm/aaaa (aprox.)" si es de mes, como "aaaa (aprox.)" si es de año y como "Desconocida" si no se conoce. La madre y el padre MUST ser enlaces a sus fichas.

#### Scenario: Nacimiento exacto
- **WHEN** el animal nació el 14/03/2021 y la precisión es exacta
- **THEN** el nacimiento se muestra como "14/03/2021"

#### Scenario: Nacimiento con precisión de mes
- **WHEN** el animal tiene la fecha 2021-03-01 con precisión de mes
- **THEN** el nacimiento se muestra como "03/2021 (aprox.)"

#### Scenario: Nacimiento con precisión de año
- **WHEN** el animal tiene la fecha 2021-01-01 con precisión de año
- **THEN** el nacimiento se muestra como "2021 (aprox.)"

#### Scenario: Ir a la madre
- **WHEN** el usuario pulsa el enlace de la madre
- **THEN** se abre la ficha de la madre con la pestaña Datos seleccionada

#### Scenario: Sin padre
- **WHEN** el animal no tiene padre
- **THEN** en Padre aparece un guion

### Requirement: Editar desde la ficha y volver
La ficha SHALL tener un enlace "Rebaño" para volver a la lista (con la búsqueda y los filtros que tenía, si se llegó desde ella) y un botón "Editar" que lleva al formulario de edición de ese animal.

#### Scenario: Editar
- **WHEN** el usuario pulsa "Editar" en una ficha
- **THEN** se abre el formulario de edición con los datos del animal

### Requirement: Datos de modificación
Al pie de la ficha SHALL mostrarse "Modificada por {nombre} · dd/mm/aaaa" con el nombre del último usuario que la modificó y la fecha de esa modificación. Si ese usuario ya no existe, MUST mostrarse "Modificada el dd/mm/aaaa".

#### Scenario: Pie de la ficha
- **WHEN** un usuario de prueba editó la ficha el 20/11/2026
- **THEN** al pie aparece "Modificada por" seguido de su nombre y "· 20/11/2026"

### Requirement: Estados de la ficha
La ficha SHALL indicar mientras carga, mostrar "Este animal no existe" con un enlace a Rebaño si el animal no existe, y mostrar un aviso de error con un botón "Reintentar" si no se puede conectar con el servidor, sin cerrar la sesión.

#### Scenario: Animal inexistente
- **WHEN** el usuario abre la dirección de un animal que no existe
- **THEN** ve "Este animal no existe" y un enlace a Rebaño
