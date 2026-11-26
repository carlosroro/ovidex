## ADDED Requirements

### Requirement: Formulario de alta y edición
La app SHALL tener un formulario para dar de alta un animal (`/rebano/nuevo`, título "Alta de animal") y para editarlo (`/rebano/:id/editar`, título "Editar animal") con estos campos: código oficial, identificador electrónico, nombre o número, sexo, reproductor, raza, fecha de nacimiento con su precisión, origen, madre, padre y notas. Los campos obligatorios MUST indicarlo en su etiqueta. En la edición, el formulario MUST mostrar los datos actuales del animal.

#### Scenario: Abrir el alta
- **WHEN** el usuario abre el formulario de alta
- **THEN** ve todos los campos vacíos, con la precisión de nacimiento "Fecha exacta" y el origen "Nacida en la explotación" elegidos y sin ningún identificador electrónico elegido

#### Scenario: Abrir la edición
- **WHEN** el usuario abre la edición de un animal
- **THEN** ve el formulario con los datos actuales del animal, incluidos su madre y su padre

### Requirement: Campo del código oficial
El campo del código oficial SHALL mostrar el prefijo `ES` fijo y pedir los 12 dígitos con el teclado numérico del móvil. Al escribir o pegar, MUST quitar los espacios y un `ES` inicial, y mostrar los dígitos agrupados de 4 en 4. Al guardar, MUST enviarse a la API como `ES` seguido de los 12 dígitos.

#### Scenario: Pegar un crotal completo
- **WHEN** el usuario pega `ES 0000 0000 0001` en el campo
- **THEN** el campo muestra `0000 0000 0001` tras el prefijo y al guardar se envía `ES000000000001`

#### Scenario: Menos de 12 dígitos
- **WHEN** el usuario escribe 8 dígitos y pulsa "Guardar"
- **THEN** el campo muestra el error "El código oficial debe ser ES seguido de 12 dígitos" y no se llama a la API

### Requirement: Campos que dependen de otros
La casilla "Carnero reproductor" SHALL mostrarse solo cuando el sexo elegido es Macho; si se cambia a Hembra, MUST enviarse como no reproductor. La precisión de la fecha de nacimiento MUST elegirse entre "Fecha exacta", "Mes y año", "Solo el año" y "Desconocida", y debajo MUST mostrarse solo lo que corresponde: un campo de fecha completa, un selector de mes con un campo de año, solo el campo de año, o nada. La fecha MUST enviarse como `AAAA-MM-DD`, usando el día 1 con precisión de mes y el 1 de enero con precisión de año; con precisión desconocida no se envía ninguna fecha.

#### Scenario: Elegir macho
- **WHEN** el usuario elige el sexo Macho
- **THEN** aparece la casilla "Carnero reproductor"

#### Scenario: Volver a hembra
- **WHEN** el usuario marca "Carnero reproductor" y después cambia el sexo a Hembra
- **THEN** la casilla desaparece y el animal se guarda como no reproductor

#### Scenario: Fecha desconocida
- **WHEN** el usuario elige la precisión "Desconocida"
- **THEN** no se muestra ningún campo de fecha

#### Scenario: Mes y año
- **WHEN** el usuario elige "Mes y año", selecciona marzo, escribe 2021 y guarda
- **THEN** se envía la fecha `2021-03-01` con precisión `mes`

#### Scenario: Solo el año
- **WHEN** el usuario elige "Solo el año", escribe 2021 y guarda
- **THEN** se envía la fecha `2021-01-01` con precisión `anio`

#### Scenario: Cambiar de precisión
- **WHEN** el usuario ha escrito una fecha exacta del 14/03/2021 y cambia a "Mes y año"
- **THEN** el selector muestra marzo y el año 2021 ya escritos

### Requirement: Elegir madre y padre
Los campos Madre y Padre SHALL permitir elegir un animal del censo mediante un buscador por crotal, que busca en el censo ya cargado en el navegador y con las mismas reglas que el buscador de Rebaño, que se abre desde la parte inferior de la pantalla con teclado numérico. El buscador de la madre MUST ofrecer solo hembras y el del padre solo machos, de cualquier estado, y ninguno MUST ofrecer el propio animal que se está editando. Una vez elegido, el campo MUST mostrar el animal (nombre y código agrupado) con opciones para cambiarlo o quitarlo.

#### Scenario: Elegir madre
- **WHEN** el usuario pulsa "Elegir madre", escribe `12` y toca un resultado
- **THEN** el buscador se cierra y el campo Madre muestra el animal elegido con los botones "Cambiar" y "Quitar"

#### Scenario: Solo machos en el padre
- **WHEN** el usuario abre el buscador del padre
- **THEN** solo aparecen machos

#### Scenario: Sin el propio animal
- **WHEN** el usuario edita una hembra y abre el buscador de la madre
- **THEN** esa hembra no aparece en los resultados

#### Scenario: Quitar la madre
- **WHEN** el campo Madre tiene un animal elegido y el usuario pulsa "Quitar"
- **THEN** el campo vuelve a mostrar "Elegir madre" y al guardar el animal queda sin madre

### Requirement: Guardar el formulario
Al pulsar "Guardar", el formulario SHALL comprobar antes los campos obligatorios y el formato del código oficial; si alguno falla, MUST marcar el error en su campo, llevar el foco al primero con error y no llamar a la API. En el alta, MUST generar en el navegador un identificador UUID nuevo y enviarlo con los datos. Mientras se guarda, el botón MUST desactivarse y decir "Guardando…". Al guardar correctamente, MUST abrirse la ficha del animal, y el botón atrás MUST NOT volver al formulario.

#### Scenario: Campos obligatorios vacíos
- **WHEN** el usuario pulsa "Guardar" sin elegir sexo
- **THEN** el campo Sexo muestra un error, recibe el foco y no se llama a la API

#### Scenario: Alta correcta
- **WHEN** el usuario rellena los obligatorios y pulsa "Guardar"
- **THEN** se crea el animal con un UUID generado en el navegador y se abre su ficha

#### Scenario: Edición correcta
- **WHEN** el usuario cambia la raza de un animal y pulsa "Guardar"
- **THEN** se guarda el cambio y se abre la ficha con la raza nueva

#### Scenario: Cancelar
- **WHEN** el usuario pulsa "Cancelar"
- **THEN** vuelve a la pantalla de la que venía sin guardar nada

### Requirement: Errores al guardar
Si la API rechaza los datos, el formulario SHALL mostrar cada mensaje en su campo y llevar el foco al primero con error. Los errores que no correspondan a ningún campo, los errores de conexión y los del servidor MUST mostrarse en un aviso de error encima del botón "Guardar", conservando lo escrito para poder reintentar, y MUST NOT cerrar la sesión.

#### Scenario: Crotal repetido
- **WHEN** el usuario guarda un animal con un código oficial que ya existe
- **THEN** el campo del código oficial muestra "Ya existe un animal con ese código oficial" y recibe el foco

#### Scenario: Sin conexión al guardar
- **WHEN** el usuario pulsa "Guardar" y no se puede conectar con el servidor
- **THEN** ve un aviso de error, los datos escritos siguen en el formulario y la sesión sigue iniciada
