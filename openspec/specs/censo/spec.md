# censo Specification

## Purpose
Guardar los datos de cada animal del rebaño (ovejas y carneros), con su código oficial, su genealogía básica y quién crea y modifica cada ficha, y ofrecerlos mediante una API protegida por la sesión.
## Requirements
### Requirement: Datos de un animal
El sistema SHALL guardar ovejas y carneros en el mismo censo. Cada animal MUST tener: identificador UUID, código oficial (obligatorio y único), tipo de identificador electrónico (`bolo`, `crotal_electronico` o `ninguno`, obligatorio), nombre o número (opcional, máximo 40 caracteres), sexo (`hembra` o `macho`, obligatorio), si es reproductor (sí o no), raza (opcional, máximo 50 caracteres), fecha de nacimiento con su precisión (`exacta`, `mes`, `anio` o `desconocida`), origen (`nacida` o `comprada`, obligatorio), madre y padre (opcionales, otros animales del censo), estado (`activa` o `baja`), notas (opcional, máximo 2000 caracteres), quién lo creó, quién lo modificó por última vez y las fechas de creación y modificación.

#### Scenario: Alta con los datos mínimos
- **WHEN** se crea un animal indicando solo identificador, código oficial, tipo de identificador electrónico, sexo, precisión de nacimiento desconocida y origen
- **THEN** el animal se guarda sin nombre, raza, fecha, madre, padre ni notas, y no es reproductor

#### Scenario: Valor no permitido
- **WHEN** se intenta crear un animal con un sexo, tipo de identificador, precisión u origen que no está en la lista permitida
- **THEN** la API responde 422 con un mensaje en el campo correspondiente

### Requirement: Código oficial normalizado y validado
El código oficial SHALL guardarse normalizado: en mayúsculas y sin espacios. Después de normalizarlo, MUST cumplir el formato `ES` seguido de exactamente 12 dígitos, y MUST ser único en todo el censo (incluidos los animales de baja). La comprobación de unicidad MUST hacerse con el valor ya normalizado.

#### Scenario: Normalización al guardar
- **WHEN** se crea un animal con el código `es 0000 0000 0001`
- **THEN** se guarda como `ES000000000001`

#### Scenario: Formato incorrecto
- **WHEN** se crea un animal con el código `ES 0000 0001` (menos de 12 dígitos) o `FR000000000001`
- **THEN** la API responde 422 con el mensaje "El código oficial debe ser ES seguido de 12 dígitos"

#### Scenario: Código repetido escrito de otra forma
- **WHEN** ya existe un animal con `ES000000000001` y se intenta crear otro con `es 0000 0000 0001`
- **THEN** la API responde 422 con el mensaje "Ya existe un animal con ese código oficial"

#### Scenario: Editar sin cambiar el código
- **WHEN** se edita un animal y se envía su mismo código oficial
- **THEN** no se considera repetido y se guarda

### Requirement: Fecha de nacimiento con precisión
La precisión de la fecha de nacimiento SHALL ser obligatoria y tener uno de estos valores: `exacta` (se conoce el día), `mes` (se conocen el mes y el año), `anio` (solo se conoce el año) o `desconocida`. Con precisión `exacta`, `mes` o `anio`, la fecha MUST indicarse; con precisión `desconocida`, la fecha MUST NOT indicarse. Con precisión `mes`, la fecha MUST guardarse como el día 1 de ese mes, y con precisión `anio`, como el 1 de enero de ese año, sea cual sea el día recibido. La fecha guardada MUST NOT ser posterior al día actual.

#### Scenario: Fecha exacta sin fecha
- **WHEN** se crea un animal con precisión exacta y sin fecha
- **THEN** la API responde 422 con un error en la fecha de nacimiento

#### Scenario: Precisión de año sin fecha
- **WHEN** se crea un animal con precisión `anio` y sin fecha
- **THEN** la API responde 422 con un error en la fecha de nacimiento

#### Scenario: Normalización con precisión de mes
- **WHEN** se crea un animal con precisión `mes` y la fecha `2021-03-14`
- **THEN** se guarda la fecha `2021-03-01`

#### Scenario: Normalización con precisión de año
- **WHEN** se crea un animal con precisión `anio` y la fecha `2021-03-14`
- **THEN** se guarda la fecha `2021-01-01`

#### Scenario: Mes actual con precisión de mes
- **WHEN** se crea un animal con precisión `mes` y una fecha del mes en curso
- **THEN** se acepta

#### Scenario: Fecha desconocida con fecha
- **WHEN** se crea un animal con precisión desconocida y una fecha
- **THEN** la API responde 422 con un error en la fecha de nacimiento

#### Scenario: Fecha futura
- **WHEN** se crea un animal con una fecha de nacimiento posterior a hoy
- **THEN** la API responde 422 con un error en la fecha de nacimiento

### Requirement: Madre, padre y reproductor
La madre SHALL ser un animal existente del censo de sexo hembra y el padre un animal existente de sexo macho, en cualquier estado. Un animal MUST NOT ser su propia madre ni su propio padre. Un animal que figura como madre de otros MUST NOT poder cambiar a macho, y uno que figura como padre MUST NOT poder cambiar a hembra. Solo los machos MUST poder marcarse como reproductores.

#### Scenario: Madre macho
- **WHEN** se indica como madre un animal macho
- **THEN** la API responde 422 con el mensaje "La madre tiene que ser una hembra"

#### Scenario: Padre hembra
- **WHEN** se indica como padre un animal hembra
- **THEN** la API responde 422 con el mensaje "El padre tiene que ser un macho"

#### Scenario: Madre inexistente
- **WHEN** se indica como madre un identificador que no corresponde a ningún animal
- **THEN** la API responde 422 con un error en la madre

#### Scenario: Su propia madre
- **WHEN** se edita una hembra indicando como madre a ella misma
- **THEN** la API responde 422 con el mensaje "Un animal no puede ser su propia madre"

#### Scenario: Su propio padre
- **WHEN** se edita un macho indicando como padre a él mismo
- **THEN** la API responde 422 con el mensaje "Un animal no puede ser su propio padre"

#### Scenario: Madre de baja
- **WHEN** se indica como madre una hembra de baja
- **THEN** se acepta

#### Scenario: Cambio de sexo con descendencia
- **WHEN** se edita una hembra que figura como madre de otro animal y se cambia su sexo a macho
- **THEN** la API responde 422 con un error en el sexo y no se guarda el cambio

#### Scenario: Hembra reproductora
- **WHEN** se crea una hembra marcada como reproductora
- **THEN** la API responde 422 con el mensaje "Solo los machos pueden marcarse como reproductores"

### Requirement: Identificador generado en el cliente
Al crear un animal, la API SHALL exigir un identificador UUID enviado por el cliente y guardar el animal con ese identificador. Si el identificador no es un UUID válido o ya existe, MUST responder 422 sin crear nada. El identificador MUST NOT poder cambiarse al editar.

#### Scenario: Alta con UUID del cliente
- **WHEN** el cliente crea un animal con un UUID nuevo
- **THEN** la API responde 201 y el animal queda guardado con ese mismo UUID

#### Scenario: UUID repetido
- **WHEN** el cliente envía dos veces la creación de un animal con el mismo UUID
- **THEN** la segunda petición responde 422 y en el censo solo hay un animal con ese identificador

#### Scenario: Cambiar el identificador al editar
- **WHEN** se edita un animal enviando otro identificador en el cuerpo
- **THEN** el identificador del animal no cambia

### Requirement: Estado al crear
Todo animal creado desde la API SHALL quedar en estado `activa`. La API MUST NOT permitir fijar ni cambiar el estado al crear o editar.

#### Scenario: Intento de crear de baja
- **WHEN** se crea un animal enviando el estado `baja`
- **THEN** el animal se guarda como `activa`

### Requirement: Quién crea y modifica
Al crear un animal, el sistema SHALL guardar el usuario con sesión como creador y como último en modificarlo. Al editarlo, MUST actualizar solo el último en modificarlo. Estos datos MUST NOT poder fijarse desde la petición.

#### Scenario: Alta
- **WHEN** un usuario crea un animal
- **THEN** el animal guarda a ese usuario como creador y como último en modificarlo

#### Scenario: Edición por otro usuario
- **WHEN** un segundo usuario edita un animal creado por el primero
- **THEN** el creador sigue siendo el primero y el último en modificarlo pasa a ser el segundo

### Requirement: API del censo
La API SHALL ofrecer, solo con sesión iniciada: listar animales (`GET /api/animales`), ver uno (`GET /api/animales/{id}`), crearlo (`POST /api/animales`, responde 201) y editarlo (`PUT /api/animales/{id}`). MUST NOT existir ninguna forma de borrar un animal. Al ver un animal, la respuesta MUST incluir el identificador, el código oficial y el nombre o número de su madre y de su padre, y el identificador y nombre del creador y del último en modificarlo. Los errores de validación MUST devolverse con código 422 y un mensaje en castellano por campo.

#### Scenario: Sin sesión
- **WHEN** se llama a cualquiera de las rutas del censo sin sesión iniciada
- **THEN** la API responde 401

#### Scenario: Borrar
- **WHEN** se envía una petición `DELETE /api/animales/{id}`
- **THEN** la API responde 405 y el animal sigue existiendo

#### Scenario: Animal inexistente
- **WHEN** se pide un animal con un identificador que no existe
- **THEN** la API responde 404

#### Scenario: Ver con madre y padre
- **WHEN** se pide un animal que tiene madre y padre
- **THEN** la respuesta incluye el código oficial y el nombre o número de los dos y el nombre del último usuario que lo modificó

### Requirement: Listado completo del censo
El listado (`GET /api/animales`) SHALL devolver todos los animales del censo, activos y de baja, ordenados por código oficial, sin paginar ni filtrar, para que el cliente busque y filtre sobre la lista completa. Cada animal del listado MUST incluir todos sus datos propios, incluidos los identificadores de su madre y de su padre, pero no los datos de la madre, el padre ni los usuarios.

#### Scenario: Activos y de baja
- **WHEN** hay animales activos y de baja y se pide el listado
- **THEN** aparecen todos, ordenados por código oficial

#### Scenario: Sin paginación
- **WHEN** hay 120 animales y se pide el listado
- **THEN** la respuesta contiene los 120

### Requirement: Animales de prueba en desarrollo
El proyecto SHALL incluir un seeder que, solo en los entornos de desarrollo y pruebas, crea animales inventados con códigos oficiales consecutivos de prueba (`ES000000000001`, `ES000000000002`…), entre ellos varios machos reproductores, y algunas hembras con madre y padre asignados de entre esos mismos animales. MUST NOT contener datos reales y MUST NOT duplicar animales si se ejecuta más de una vez.

#### Scenario: Ejecutar el seeder
- **WHEN** se ejecutan los seeders en el entorno de desarrollo
- **THEN** el censo tiene animales de prueba activos, al menos un macho reproductor y al menos un animal con madre y padre que cumplen las reglas de sexo

#### Scenario: Ejecutarlo dos veces
- **WHEN** se ejecuta el seeder de animales una segunda vez
- **THEN** no se crea ningún animal repetido

#### Scenario: Entorno de uso
- **WHEN** se ejecutan los seeders en un entorno que no es de desarrollo ni de pruebas
- **THEN** no se crea ningún animal

