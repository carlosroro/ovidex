## 1. Tabla y modelo de animales

- [x] 1.1 Crear las enumeraciones respaldadas en `app/Enums`: `Sexo`, `TipoElectronico`, `PrecisionFecha`, `Origen` y `EstadoAnimal`
- [x] 1.2 Crear la migración de `animales` con todas las columnas, el índice único de `codigo_oficial`, el índice de `estado` y las claves foráneas de madre, padre, `creado_por` y `modificado_por` (`nullOnDelete`)
- [x] 1.3 Crear el modelo `Animal`: `$table = 'animales'`, `HasUuids`, campos asignables, `casts` de las enumeraciones, la fecha y `reproductor`, y el mutador que normaliza el código oficial (mayúsculas, sin espacios)
- [x] 1.4 Añadir al modelo las relaciones `madre()`, `padre()`, `creador()` y `modificador()`
- [x] 1.5 Prueba unitaria del mutador del código oficial
- [x] 1.6 Ejecutar `php artisan migrate` y comprobar la tabla en Adminer

## 2. Datos de prueba

- [x] 2.1 Crear `AnimalFactory` (crotales de prueba `ES0000…`, hembra activa por defecto) con los estados `macho()`, `reproductor()`, `deBaja()` y `fechaDesconocida()`
- [x] 2.2 Crear `CensoPruebaSeeder`: unos 30 animales inventados con crotales `ES000000000001`…, carneros reproductores, las cuatro precisiones de fecha, los tres identificadores y los dos orígenes, algunas hembras con madre y padre, auditoría con el primer usuario de prueba si existe, y sin duplicar al repetirse
- [x] 2.3 Llamar a `CensoPruebaSeeder` desde `DatabaseSeeder` solo en `local` y `testing`, después de los usuarios
- [x] 2.4 Pruebas `CensoPruebaSeederTest`: crea animales con relaciones de sexo correctas, incluye un reproductor y no duplica al ejecutarse dos veces

## 3. Validaciones de alta y edición

- [x] 3.1 Crear las reglas comunes de alta y edición (clase base o trait) con `prepareForValidation()` que normaliza el código oficial y los mensajes en castellano
- [x] 3.2 Reglas de formato y unicidad del código oficial, valores permitidos de las enumeraciones y longitudes máximas
- [x] 3.3 Reglas de la fecha de nacimiento según sus cuatro precisiones: normalizar al día 1 (`mes`) o al 1 de enero (`anio`), obligatoria salvo con `desconocida`, prohibida con `desconocida` y no futura
- [x] 3.4 Reglas de madre (existe y es hembra), padre (existe y es macho) y reproductor solo en machos
- [x] 3.5 `GuardarAnimalRequest`: `id` obligatorio, UUID y no repetido; madre y padre distintos del `id` recibido
- [x] 3.6 `ActualizarAnimalRequest`: unicidad del crotal ignorando el propio animal, sin autorreferencia en madre y padre, y sin cambio de sexo si tiene descendencia

## 4. API del censo

- [x] 4.1 Crear `AnimalResource` con los campos del diseño y madre, padre y usuarios de auditoría solo cuando se han cargado
- [x] 4.2 Crear `AnimalController` con `index` (todos los animales, activos y de baja, ordenados por crotal, sin paginar)
- [x] 4.3 Añadir `show` (carga madre, padre, creador y modificador), `store` (UUID del cliente, estado activa, auditoría, 201) y `update` (auditoría de modificación)
- [x] 4.4 Registrar las rutas con `apiResource` (sin `destroy`) dentro del grupo `auth:sanctum`, con el parámetro `{animal}` restringido a UUID
- [x] 4.5 Pruebas `AnimalCrearTest`: alta correcta con UUID, estado y auditoría; normalización; formato, crotal repetido, UUID repetido o no válido y obligatorios
- [x] 4.6 Pruebas `AnimalCrearTest`: madre macho, padre hembra, madre inexistente, madre de baja aceptada, hembra reproductora, fecha futura, combinaciones de fecha y precisión no válidas, normalización de las fechas de mes y de año, y mes en curso aceptado
- [x] 4.7 Pruebas `AnimalEditarTest`: edición con auditoría, conservar su propio crotal, crotal de otro, su propia madre o padre, cambio de sexo con descendencia, e `id` y `estado` ignorados
- [x] 4.8 Pruebas `AnimalListarTest`: devuelve todos los animales (activos y de baja) ordenados por crotal, sin paginar y sin relaciones cargadas
- [x] 4.9 Pruebas `AnimalVerTest` (madre, padre y auditoría; 404) y `AnimalRutasTest` (401 sin sesión en todas; `DELETE` da 405)
- [x] 4.10 Ejecutar `php artisan test` y comprobar que pasan todas las pruebas
- [x] 4.11 Ejecutar `php artisan migrate:fresh --seed` y probar la API a mano con sesión iniciada (listar, ver, crear y editar)

## 5. Utilidades y API en el frontend

- [ ] 5.1 Crear `src/utilidades/crotal.js` (`normalizarCrotal`, `formatearCrotal`, `ultimosDigitos`) con sus pruebas
- [ ] 5.2 Crear `src/utilidades/fechas.js` (`formatearFecha`, `formatearNacimiento`, `calcularEdad`) con pruebas de las cuatro precisiones
- [ ] 5.3 Crear `src/utilidades/uuid.js` (`nuevoUuid`, con alternativa a `crypto.getRandomValues()`) con pruebas con y sin `crypto.randomUUID`
- [ ] 5.4 Crear `src/utilidades/textosAnimal.js` con los textos visibles de cada valor (sexo, identificador, origen, estado, tipo de animal)
- [ ] 5.5 Crear `src/api/animales.js` con `listarAnimales`, `obtenerAnimal`, `crearAnimal` y `actualizarAnimal` sobre `peticion()`
- [ ] 5.6 Crear `src/censo/filtrarAnimales.js` (búsqueda por últimos dígitos o por texto, sexo, estado y `excluir`) con pruebas `filtrarAnimales.test.js`
- [ ] 5.7 Crear `CensoProvider` y `useCenso()` en `src/censo/` (carga única, recarga en segundo plano, `guardarEnCenso`, estado de error sin cerrar la sesión) y colocarlo dentro de las rutas protegidas
- [ ] 5.8 Pruebas `CensoProvider.test.jsx`: carga una vez, conserva la lista, recarga en segundo plano, `guardarEnCenso` añade y sustituye, y error de red

## 6. Componentes nuevos de la base visual

- [ ] 6.1 Crear `Etiqueta` (variantes neutra, principal y aviso)
- [ ] 6.2 Crear `GrupoOpciones` con radios nativos, `fieldset`/`legend`, variantes segmentada y vertical, y error asociado
- [ ] 6.3 Crear `AreaTexto` con etiqueta, ayuda y error
- [ ] 6.4 Crear `CampoBusqueda` con lupa, botón de borrar y botón para alternar teclado numérico y de letras, con su prueba
- [ ] 6.5 Crear `Pestanas` con el patrón accesible (roles, `aria-selected`, flechas izquierda y derecha), con su prueba
- [ ] 6.6 Revisar los componentes nuevos en modo claro y oscuro y en ancho de móvil

## 7. Pantalla Rebaño

- [ ] 7.1 Añadir las rutas `/rebano/nuevo`, `/rebano/:id` y `/rebano/:id/editar` en `App.jsx` y comprobar que "Rebaño" queda destacado en todas
- [ ] 7.2 Sustituir el estado vacío de `Rebano.jsx` por la cabecera con total y botón "Alta", el buscador y los filtros guardados en la dirección
- [ ] 7.3 Obtener la lista con `useCenso()`, pedir la recarga en segundo plano al entrar y filtrar con `filtrarAnimales()` a cada tecla
- [ ] 7.4 Pintar cada animal como `Tarjeta` enlace con nombre, crotal agrupado con los últimos 4 dígitos resaltados y etiquetas
- [ ] 7.5 Pintar por tramos de 100 con "Ver más" (volviendo a 100 al cambiar la búsqueda o los filtros) y añadir los estados de primera carga, censo vacío, sin resultados y error con "Reintentar"
- [ ] 7.6 Pruebas `Rebano.test.jsx`: activas por defecto, teclado numérico y cambio a letras, filtrado al escribir sin llamar a la API, filtros en la lista y en la dirección, total, tarjetas, "Ver más", vacío, sin resultados y error

## 8. Ficha del animal

- [ ] 8.1 Crear `FichaAnimal.jsx` con la carga por `id`, estados de carga, 404 y error, y el enlace de volver con los filtros de la lista
- [ ] 8.2 Tarjeta DNI: huecos de foto vacíos, tipo, título, estado, código oficial destacado y etiquetas
- [ ] 8.3 Pestañas con Datos (raza, nacimiento, origen, madre y padre enlazados, notas) y "Próximamente" en las demás
- [ ] 8.4 Botón "Editar" y pie "Modificada por… · fecha"
- [ ] 8.5 Pruebas `FichaAnimal.test.jsx`: código agrupado, etiquetas, título sin nombre, nacimiento con las cuatro precisiones y edad "≈", enlaces, pie, pestañas con teclado y 404

## 9. Formulario de alta y edición

- [ ] 9.1 Crear `FormularioAnimal.jsx` con los campos en orden, modo alta o edición según la ruta y carga de datos en la edición
- [ ] 9.2 Campo del código oficial con prefijo `ES` fijo, teclado numérico, limpieza al pegar y agrupado de 4 en 4
- [ ] 9.3 Casilla de reproductor solo con Macho
- [ ] 9.4 Fecha de nacimiento con las cuatro precisiones: campo de fecha, selector de mes y año, solo año o nada; conservar lo escrito al cambiar de precisión y enviar `AAAA-MM-DD`
- [ ] 9.5 Crear `BuscadorAnimal` con `MenuInferior` sobre la lista de `useCenso()` y `filtrarAnimales()` (sexo, `estado: 'todos'` y exclusión del propio animal); elegir, cambiar y quitar
- [ ] 9.6 Guardar: validación local con foco en el primer error, UUID nuevo en el alta, botón "Guardando…", `guardarEnCenso()` con la respuesta, navegación a la ficha con `replace`, y "Cancelar"
- [ ] 9.7 Mostrar los errores 422 en sus campos y los demás errores en un `Aviso`, conservando lo escrito
- [ ] 9.8 Pruebas `BuscadorAnimal.test.jsx`: solo el sexo que toca, sin el propio animal, incluye bajas; elegir, cambiar y quitar
- [ ] 9.9 Pruebas `FormularioAnimal.test.jsx`: validación local, reproductor, campos y fecha enviada según la precisión, alta con UUID y crotal normalizado, errores 422 en su campo, error de red, edición, actualización del censo y navegación a la ficha

## 10. Menú Registrar

- [ ] 10.1 Convertir la acción "Alta" de `MenuRegistrar` en un enlace a `/rebano/nuevo` que cierra el menú, manteniendo "Próximamente" en el resto
- [ ] 10.2 Prueba: "Alta" abre el formulario y cierra el menú; "Parto" sigue sin efecto

## 11. Comprobación final

- [ ] 11.1 Ejecutar `npm test`, `npm run lint` y `npm run format:check` en el frontend y `php artisan test` en el backend
- [ ] 11.2 Probar en el navegador (ancho de móvil, modo claro y oscuro): buscar, filtrar, abrir fichas, navegar a la madre, dar de alta, editar y alta desde el menú ➕
- [ ] 11.3 Actualizar el README con el seeder de animales de prueba y cómo recrear la base de desarrollo
