# rebano Specification

## Purpose
Consultar el censo desde el móvil: lista completa del rebaño con buscador por los últimos dígitos del crotal y por nombre, y filtros por sexo y estado.
## Requirements
### Requirement: Lista del rebaño
La pantalla Rebaño (`/rebano`) SHALL mostrar la lista de animales del censo con el título "Rebaño", el número total de animales que cumplen la búsqueda y los filtros, y un botón "Alta" que lleva al formulario de alta. Cada animal MUST mostrarse como un enlace a su ficha con su nombre o número (o "Sin nombre"), su código oficial agrupado (`ES 0000 0000 0001`) con los últimos 4 dígitos resaltados, y etiquetas de sexo, de reproductor (si lo es), de edad (si se conoce) y de baja (si lo está).

#### Scenario: Ver la lista
- **WHEN** el usuario entra en Rebaño y hay animales activos
- **THEN** ve cada animal con su nombre o número, su código oficial agrupado y sus etiquetas, y el total de animales

#### Scenario: Abrir una ficha
- **WHEN** el usuario pulsa un animal de la lista
- **THEN** se abre la ficha de ese animal

#### Scenario: Ir al alta
- **WHEN** el usuario pulsa "Alta"
- **THEN** se abre el formulario de alta

### Requirement: Buscador por crotal y por nombre
La pantalla Rebaño SHALL tener un campo de búsqueda con etiqueta accesible que abre por defecto el teclado numérico del móvil y que tiene un botón para cambiar al teclado de letras y volver al numérico. La lista MUST filtrarse en el propio navegador a medida que se escribe, sin botón de buscar y sin esperar al servidor. Si el texto contiene solo dígitos (ignorando espacios), MUST mostrar los animales cuyo código oficial termina en esos dígitos o cuyo nombre o número los contiene. Si contiene otros caracteres, MUST mostrar los animales cuyo nombre o número contiene el texto, sin distinguir mayúsculas ni tildes, o cuyo código oficial contiene el texto sin espacios y en mayúsculas.

#### Scenario: Buscar por los últimos dígitos
- **WHEN** existen `ES000000000047` y `ES000000004712` y el usuario escribe `47` en el buscador
- **THEN** la lista muestra `ES000000000047` y no `ES000000004712`

#### Scenario: Dígitos en el nombre
- **WHEN** existe un animal con el número "Nº 47" y el usuario escribe `47`
- **THEN** ese animal aparece en la lista

#### Scenario: Buscar un crotal completo
- **WHEN** el usuario cambia al teclado de letras y escribe `ES 0000 0000 0001`
- **THEN** la lista muestra el animal con código `ES000000000001`

#### Scenario: Resultados al momento
- **WHEN** la lista ya se ha cargado y el usuario escribe en el buscador
- **THEN** los resultados cambian al momento sin hacer ninguna petición al servidor

#### Scenario: Teclado numérico por defecto
- **WHEN** el usuario toca el buscador
- **THEN** el móvil muestra el teclado numérico

#### Scenario: Cambiar a teclado de letras
- **WHEN** el usuario pulsa el botón para usar el teclado de letras y escribe `siete`
- **THEN** el campo acepta letras y la lista muestra el animal llamado "Prueba Siete"

#### Scenario: Borrar la búsqueda
- **WHEN** hay texto en el buscador y el usuario pulsa el botón de borrar
- **THEN** el campo se vacía y la lista vuelve a mostrar todos los animales según los filtros

### Requirement: Filtros por sexo y estado
La pantalla Rebaño SHALL tener filtros de sexo (Todos, Hembras, Machos) y de estado (Activas, Bajas, Todas). Por defecto MUST mostrarse Todos y Activas. La búsqueda y los filtros MUST conservarse al volver a la lista desde una ficha con el botón atrás o al recargar la página.

#### Scenario: Filtro por defecto
- **WHEN** el usuario entra en Rebaño por primera vez
- **THEN** solo ve animales activos de los dos sexos

#### Scenario: Filtrar machos
- **WHEN** el usuario elige "Machos"
- **THEN** la lista muestra solo los machos activos

#### Scenario: Volver de una ficha
- **WHEN** el usuario busca `12`, elige "Hembras", abre una ficha y pulsa atrás
- **THEN** la lista sigue con la búsqueda `12` y el filtro "Hembras"

### Requirement: Carga del censo completo
La pantalla Rebaño SHALL obtener el censo completo una sola vez y conservarlo mientras se navega por la app, de modo que al volver a Rebaño la lista se muestre al momento. Cada vez que se entra en Rebaño, MUST volver a pedirse en segundo plano para recoger los cambios hechos desde otro móvil, sin vaciar la lista mientras tanto. Un animal recién creado o editado MUST aparecer en la lista con sus datos nuevos sin esperar a esa recarga.

#### Scenario: Volver a la lista
- **WHEN** el usuario abre una ficha desde Rebaño y vuelve
- **THEN** la lista aparece al momento, sin el mensaje de carga

#### Scenario: Animal recién creado
- **WHEN** el usuario da de alta un animal y después vuelve a Rebaño
- **THEN** el animal nuevo aparece en la lista

### Requirement: Mostrar la lista por tramos
De los animales que cumplen la búsqueda y los filtros, la lista SHALL pintar al principio los primeros 100 y, si hay más, un botón "Ver más" que pinta otros 100 al final sin perder los ya mostrados. Al cambiar la búsqueda o los filtros, MUST volver a mostrar solo los primeros 100. El total indicado en la cabecera MUST ser siempre el de todos los resultados, no solo los pintados.

#### Scenario: Más de 100 resultados
- **WHEN** hay 150 animales activos y el usuario pulsa "Ver más"
- **THEN** la lista muestra los 150 y la cabecera indica 150 animales

### Requirement: Estados de la lista
La pantalla Rebaño SHALL indicar mientras carga el censo por primera vez, cuando el censo está vacío (con un botón para dar de alta), cuando ningún animal coincide con la búsqueda o los filtros, y cuando no se puede conectar con el servidor (con un botón "Reintentar"). Un error de conexión MUST NOT cerrar la sesión.

#### Scenario: Censo vacío
- **WHEN** no hay ningún animal y el usuario entra en Rebaño sin buscar
- **THEN** ve el mensaje "Todavía no hay animales" y un botón para dar de alta

#### Scenario: Sin resultados
- **WHEN** el usuario busca unos dígitos que no coinciden con ningún animal
- **THEN** ve el mensaje "Ningún animal coincide con la búsqueda"

#### Scenario: Sin conexión
- **WHEN** no se puede conectar con el servidor al cargar la lista
- **THEN** ve un aviso de error con el botón "Reintentar" y sigue con la sesión iniciada

