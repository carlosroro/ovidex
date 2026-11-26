## ADDED Requirements

### Requirement: Datos de una cuenta de usuario
Cada cuenta SHALL tener un identificador UUID como clave primaria, un nombre para mostrar, un nombre de usuario único y una contraseña guardada con hash. El nombre de usuario MUST guardarse en minúsculas, tener entre 3 y 30 caracteres y contener solo letras sin tildes, números, punto, guion y guion bajo. La contraseña MUST tener al menos 8 caracteres. Las cuentas MUST NOT tener email.

#### Scenario: Identificador UUID
- **WHEN** se crea una cuenta
- **THEN** su identificador es un UUID

#### Scenario: Contraseña con hash
- **WHEN** se crea una cuenta
- **THEN** en la base de datos no se guarda la contraseña en claro, sino su hash

#### Scenario: Sesiones asociadas al usuario
- **WHEN** un usuario inicia sesión
- **THEN** la sesión guardada en el servidor queda asociada a su UUID

### Requirement: Sin registro público
La app SHALL NOT ofrecer ninguna forma de crear cuentas desde el frontend ni desde la API.

#### Scenario: No hay ruta de registro
- **WHEN** se busca una ruta de la API o una pantalla para registrarse
- **THEN** no existe

### Requirement: Comando para crear cuentas
El backend SHALL ofrecer el comando `php artisan usuarios:crear`, que pide de forma interactiva el nombre, el nombre de usuario y la contraseña (dos veces). La contraseña MUST NOT mostrarse mientras se escribe ni al terminar. Si un dato no es válido, el comando MUST explicar el motivo y volver a pedirlo.

#### Scenario: Crear una cuenta válida
- **WHEN** se ejecuta el comando y se introducen un nombre, un usuario libre y válido, y la misma contraseña válida dos veces
- **THEN** se crea la cuenta y el comando indica que se ha creado, sin mostrar la contraseña

#### Scenario: Usuario en mayúsculas
- **WHEN** se introduce un nombre de usuario con mayúsculas
- **THEN** la cuenta se guarda con el usuario en minúsculas

#### Scenario: Usuario repetido
- **WHEN** se introduce un nombre de usuario que ya existe
- **THEN** el comando indica que ya está en uso y no crea una cuenta duplicada

#### Scenario: Formato de usuario no válido
- **WHEN** se introduce un usuario con espacios, tildes u otros caracteres no permitidos, o con menos de 3 caracteres
- **THEN** el comando indica el formato válido y no crea la cuenta con ese usuario

#### Scenario: Contraseña demasiado corta
- **WHEN** se introduce una contraseña de menos de 8 caracteres
- **THEN** el comando indica la longitud mínima y no crea la cuenta con esa contraseña

#### Scenario: Las contraseñas no coinciden
- **WHEN** la confirmación de la contraseña no coincide con la primera
- **THEN** el comando lo indica y no crea la cuenta con esa contraseña

### Requirement: Comando para cerrar todas las sesiones de un usuario
El backend SHALL ofrecer el comando `php artisan usuarios:cerrar-sesiones <usuario>`, que invalida todas las sesiones abiertas de ese usuario en el servidor y anula su cookie de "recordarme" en todos los dispositivos. MUST NOT afectar a las sesiones de otros usuarios ni cambiar la contraseña. El nombre de usuario MUST compararse sin distinguir mayúsculas.

#### Scenario: Cerrar las sesiones de un usuario
- **WHEN** se ejecuta el comando con un usuario que tiene sesiones abiertas
- **THEN** se eliminan todas sus sesiones del servidor y el comando indica cuántas se han cerrado

#### Scenario: El móvil perdido deja de tener acceso
- **WHEN** tras ejecutar el comando, un dispositivo usa la cookie de sesión o la cookie de "recordarme" que tenía antes
- **THEN** la API responde 401 y no lo identifica como ese usuario

#### Scenario: Otros usuarios no se ven afectados
- **WHEN** se ejecuta el comando con un usuario
- **THEN** las sesiones de los demás usuarios siguen abiertas

#### Scenario: Se puede volver a entrar
- **WHEN** tras ejecutar el comando, el usuario inicia sesión con su contraseña
- **THEN** entra con normalidad

#### Scenario: Usuario inexistente
- **WHEN** se ejecuta el comando con un usuario que no existe
- **THEN** el comando muestra un error, termina con código de fallo y no modifica nada

### Requirement: Usuarios de prueba en desarrollo
El seeder de la base de datos SHALL crear, solo en los entornos de desarrollo y pruebas, dos cuentas de prueba con nombres y usuarios claramente inventados. Su contraseña MUST leerse de la variable de entorno `SEEDER_PASSWORD`, que MUST estar vacía en `.env.example`, y MUST NOT estar escrita en el código.

#### Scenario: Sembrar en desarrollo
- **WHEN** se ejecuta `php artisan db:seed` en el entorno local con la variable de la contraseña de prueba definida
- **THEN** existen las dos cuentas de prueba y se puede iniciar sesión con ellas

#### Scenario: Falta la contraseña de prueba
- **WHEN** se ejecuta el seeder con `SEEDER_PASSWORD` vacía o sin definir
- **THEN** el seeder se detiene sin crear ninguna cuenta y muestra un mensaje claro que indica qué variable falta y que hay que definirla en `backend/.env`

#### Scenario: Entorno de producción
- **WHEN** se ejecuta el seeder en el entorno de producción
- **THEN** no se crea ninguna cuenta de prueba
