# Ovidex

Aplicación web (PWA) para la gestión de una explotación ovina: censo de animales, lotes, conteo diario, altas y bajas, inventario de material, alimentación, sanidad y reproducción.

## Documento de referencia

- El diseño completo está en `docs/privado/diseno.md`. Léelo antes de proponer o implementar cualquier funcionalidad.
- `docs/privado/` NO se sube al repositorio. Nunca copies su contenido literal a otros archivos.

## Privacidad (obligatorio)

- Nunca escribas en ningún archivo del repositorio (código, especificaciones de OpenSpec, README, comentarios, mensajes de commit o de PR) datos reales de una explotación: cantidades de animales, ubicaciones, nombres de personas, códigos de identificación reales ni detalles de red.
- Las especificaciones describen funcionalidades de forma genérica.
- Los datos de prueba (seeders, factories, tests) son siempre inventados y claramente falsos. Crotales de prueba con el formato `ES 0000 0000 0001`, `ES 0000 0000 0002`…
- Las rutas, contraseñas y tokens van siempre en variables de entorno (`.env`), nunca escritos en el código ni en la configuración de Docker. Mantén actualizado `.env.example` sin valores reales.

## Stack

- Backend: Laravel (API REST) con Sanctum y MariaDB.
- Frontend: React con Vite, como PWA. IndexedDB con Dexie para funcionar sin conexión. Gráficos con Recharts.
- Identificadores UUID generados en el cliente.
- Estructura prevista del repositorio: `backend/` (Laravel) y `frontend/` (React).

## Entorno de desarrollo

- Windows. Los comandos de terminal son de PowerShell.
- Laravel y React se ejecutan directamente en Windows (PHP, Composer y Node instalados).
- Docker solo para la base de datos (MariaDB y Adminer), con Docker Compose y nombre de proyecto `ovidex-dev`.

## Docker: no afectar a otros proyectos

- En este PC hay otros proyectos con Docker que no deben verse afectados.
- Usa siempre comandos limitados a Ovidex: `docker compose -p ovidex-dev ...`.
- Nunca uses comandos globales (`docker system prune`, `docker volume prune`, `docker image prune`, `docker rmi`, `docker volume rm`, etc.).

## Convenciones de código

- JavaScript/JSX sin punto y coma. PHP y CSS con punto y coma.
- Nombres del dominio en castellano y sin ñ ni tildes en el código (por ejemplo: `Oveja`, `Lote`, `Conteo`, `anio`).
- Mensajes de commit en castellano, breves y descriptivos.

## Forma de trabajar

- Las funcionalidades se hacen con OpenSpec: propuesta → revisión del usuario → implementación → archivo.
- Los cambios pequeños (textos, estilos, errores puntuales) se pueden hacer sin OpenSpec.
- Una rama por cada cambio de OpenSpec. Nunca trabajes directamente sobre `main`.
- No hagas commit ni push sin que el usuario lo pida y haya revisado los cambios.
- El usuario está aprendiendo Laravel y React: explica en castellano qué haces y por qué, en pasos pequeños.