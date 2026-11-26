## Why

El censo es el núcleo de la aplicación: lotes, conteo diario, altas y bajas, sanidad y reproducción giran alrededor de la ficha de cada animal. Con el login ya terminado, es la primera funcionalidad de datos de la fase base y la que permite empezar a usar la app de verdad: consultar el rebaño desde el móvil, buscar un animal por su crotal y ver o corregir su ficha.

## What Changes

- **Modelo y tabla de animales** (ovejas y carneros en la misma tabla) con: código oficial (obligatorio y único), tipo de identificador electrónico (bolo, crotal electrónico o ninguno), nombre o número (opcional), sexo, si es reproductor, raza, fecha de nacimiento con su precisión (exacta, mes y año, solo el año o desconocida; las aproximadas se muestran como "03/2021 (aprox.)" o "2021 (aprox.)" y su edad como "≈ N años"), origen (nacida en la explotación o comprada), madre, padre, estado (activa o baja), notas, y quién creó y modificó por última vez cada ficha.
- **Código oficial normalizado**: se guarda en mayúsculas y sin espacios, se valida con el formato `ES` seguido de 12 dígitos (sin excepciones, para todos los animales) y se muestra agrupado (`ES 0000 0000 0001`).
- **Genealogía básica**: madre y padre se eligen entre los animales del censo con un buscador por crotal. La madre debe ser hembra, el padre macho, y un animal no puede ser su propia madre ni su propio padre.
- **UUID generado en el frontend** al dar de alta; la API lo acepta al crear, preparando las altas sin conexión de la fase 2.
- **API REST protegida por la sesión** para listar el censo completo, ver, crear y editar animales. No se pueden borrar.
- **Censo completo en el navegador**: la app descarga una vez la lista de todos los animales y busca y filtra sobre ella, sin paginar en el servidor. Así la búsqueda es instantánea y, en la fase 2, la pantalla solo tendrá que leer la lista de la copia local del móvil en lugar de la API.
- **Pantalla Rebaño** (`/rebano`): lista de animales con buscador por los últimos dígitos del crotal (teclado numérico) y por nombre o número, filtros por sexo y estado (por defecto, solo activas) y botón de alta.
- **Ficha del animal tipo DNI** (`/rebano/:id`), según el mockup: huecos de foto de cara y de costado (vacíos), código oficial destacado, etiquetas (sexo, edad, identificador electrónico), pestañas Datos · Reproducción · Sanidad · Historial (solo Datos con contenido; el resto, "Próximamente"), enlaces a la madre y al padre, notas y "Modificada por… · fecha" al pie.
- **Formulario de alta y edición** (`/rebano/nuevo` y `/rebano/:id/editar`), al que se llega desde Rebaño, desde el botón Editar de la ficha y desde la acción "Alta" del menú ➕, que deja de estar en "Próximamente".
- **Componentes nuevos de la base visual** para estos formularios y pantallas: grupo de opciones, área de texto, pestañas, etiqueta y campo de búsqueda.
- **Datos de prueba**: seeder de desarrollo con animales inventados (crotales `ES 0000 0000 0001`, `ES 0000 0000 0002`…), con carneros y algunas relaciones de madre y padre.
- **Pruebas**: en el backend, validaciones, normalización del crotal, rutas protegidas, relaciones de madre y padre y filtros; en el frontend, formulario, buscador y ficha.

## Capabilities

### New Capabilities
- `censo`: datos de cada animal, normalización y validación del código oficial, reglas de madre y padre, auditoría de quién crea y modifica, API REST (listar el censo completo, ver, crear con UUID del cliente, editar, sin borrar) y animales de prueba para desarrollo.
- `rebano`: carga del censo completo en el navegador y pantalla de lista del rebaño con buscador por crotal y por nombre, filtros por sexo y estado y acceso al alta.
- `ficha-animal`: pantalla de la ficha tipo DNI con sus pestañas, etiquetas, enlaces a la madre y al padre y datos de auditoría.
- `formulario-animal`: formulario de alta y edición, incluido el buscador para elegir madre y padre y la presentación de los errores de validación.

### Modified Capabilities
- `navegacion`: Rebaño deja de ser una pantalla vacía y gana subrutas (ficha, alta y edición) en las que "Rebaño" sigue destacado en la barra; la acción "Alta" del menú ➕ pasa a funcionar y lleva al formulario de alta.
- `interfaz-base`: se añaden los componentes Grupo de opciones, Área de texto, Pestañas, Etiqueta y Campo de búsqueda.

## Impact

- **Backend**: migración de la tabla `animales`, modelo `Animal`, enumeraciones de sexo, tipo de identificador, precisión de fecha, origen y estado, Form Requests de alta y edición, `AnimalResource`, `AnimalController`, rutas en `routes/api.php` (dentro del grupo protegido), factoría, seeder de prueba y pruebas.
- **API**: nuevas rutas `GET /api/animales`, `GET /api/animales/{id}`, `POST /api/animales` y `PUT /api/animales/{id}`.
- **Frontend**: módulo de API de animales, contexto del censo con la lista completa y su función de búsqueda y filtrado, utilidades de crotal, fechas y UUID, pantallas Rebaño, Ficha y Formulario, componentes nuevos, rutas nuevas en `App.jsx` y cambio en el menú Registrar.
- **Dependencias**: ninguna nueva.
- **Base de datos de desarrollo**: hay que ejecutar las migraciones y el seeder nuevo (`php artisan migrate --seed` o `migrate:fresh --seed`).

## Fuera de este cambio

- Fotos (de identificación y galería) y el atajo "Ovejas sin fotos".
- Lotes y el filtro por lote; el filtro por edad.
- Bajas (venta, muerte, sacrificio) y altas por compra o por parto con sus datos propios (fecha y procedencia de la compra).
- Altas históricas de animales ya muertos.
- Carga inicial desde una hoja de cálculo (CSV o Excel).
- Contenido de las pestañas Reproducción, Sanidad e Historial (incluida la descendencia de cada animal).
- Avisos en la ficha (por ejemplo, tiempo de espera).
- Cifras del censo y buscador en la pantalla de Inicio.
- Borrar fichas.
- Funcionamiento sin conexión y sincronización (fase 2).
