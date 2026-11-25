## Context

El frontend (`frontend/`) es una aplicación React con Vite que hoy tiene un único componente, `App.jsx`, con la página de estado de la conexión, y unos estilos mínimos provisionales en `index.css`. No hay enrutador, ni componentes reutilizables, ni modo oscuro.

El documento de diseño fija el aspecto: mobile-first, botones grandes, alto contraste para uso a pleno sol, paleta "Verde campo" (claro) y "Noche" (oscuro), tipografía Archivo + Inter y navegación inferior con un botón central "Registrar". Los mockups muestran las medidas aproximadas: cabeceras con título grande en Archivo 800, tarjetas blancas con borde fino y esquinas de 16 px, campos de 56 px de alto con borde de 2 px, y una barra inferior de cinco huecos con el botón central elevado.

Restricción importante: la app tendrá que funcionar sin conexión más adelante, así que nada de lo que se añada ahora puede depender de servicios externos (fuentes, iconos, CDN).

## Goals / Non-Goals

**Goals:**
- Un único sitio donde viven los colores (variables CSS), de modo que el modo oscuro sea solo cambiar valores.
- Componentes pequeños y reutilizables que las siguientes funcionalidades usen sin rehacer estilos.
- Navegación con rutas reales (cada pantalla tiene su dirección, el botón "atrás" del móvil funciona).
- Accesibilidad básica integrada en los componentes, no añadida después.

**Non-Goals:**
- Login, datos, sincronización, PWA y service worker.
- Contenido real en las pantallas: solo cabeceras y un estado vacío.
- Una librería de componentes completa: solo las piezas de la lista.

## Decisions

### 1. Estilos: CSS normal con variables, un archivo por componente

Las variables de la paleta van en `src/estilos/tema.css`; los estilos generales (tipografía, reinicio básico) en `src/estilos/base.css`; y cada componente importa su propio `.css` (por ejemplo `Boton.jsx` + `Boton.css`). Las clases usan un prefijo con el nombre del componente (`.boton`, `.boton--secundario`) para no chocar.

- **Por qué**: es CSS de toda la vida, fácil de aprender y de depurar en el navegador, y Vite lo soporta sin configurar nada.
- **Alternativas**: Tailwind (rápido, pero añade otra sintaxis que aprender y llena el JSX de clases); CSS Modules (aíslan mejor, pero añaden un paso más de abstracción). Se pueden adoptar más adelante si hace falta.

Los nombres de las variables siguen el uso, no el color, para que funcionen en los dos modos: `--color-fondo`, `--color-superficie`, `--color-texto`, `--color-texto-secundario`, `--color-texto-atenuado`, `--color-borde-campo`, `--color-borde-tarjeta`, `--color-principal`, `--color-principal-pulsado`, `--color-principal-suave`, `--color-sobre-principal`, `--color-aviso-fondo`, `--color-aviso-borde`, `--color-aviso-texto`, `--color-info-fondo`, `--color-info-texto` y los de error (ver decisión 9). También se definen variables de medidas: radios, espacios y la altura mínima táctil (`--tactil-minimo: 48px`).

### 2. Modo oscuro: atributo en `<html>` + preferencia del sistema

- Los valores claros se definen en `:root`.
- Los oscuros se aplican en dos casos: `:root[data-tema="oscuro"]` (elegido a mano) y dentro de `@media (prefers-color-scheme: dark)` para `:root:not([data-tema="claro"])` (automático).
- La elección del usuario (`claro`, `oscuro` o `auto`) se guarda en `localStorage` con la clave `ovidex-tema`. En `auto` no se pone el atributo y manda el sistema.
- Un pequeño script en línea en `index.html` lee esa clave y pone el atributo **antes** de que React arranque, para evitar el "parpadeo" de ver la app en claro un instante al abrirla en oscuro.
- Un hook `useTema()` expone la preferencia actual y una función para cambiarla; lo usa el selector de Ajustes.
- Se declara `color-scheme: light dark` para que los controles nativos (barras de desplazamiento, casillas) también cambien.

- **Por qué**: con CSS el cambio es instantáneo y no hace falta volver a pintar componentes. `localStorage` basta para una preferencia de un solo dispositivo.
- **Alternativas**: guardar el tema en un contexto de React y pasar colores por props (más código y más lento); guardarlo en IndexedDB (innecesario para un solo valor, y es asíncrono, lo que provocaría el parpadeo).

### 3. Fuentes: paquetes de Fontsource

Se instalan `@fontsource-variable/archivo` y `@fontsource-variable/inter` y se importan en `main.jsx`. Vite copia los archivos `.woff2` al compilar y los sirve desde el propio proyecto.

- **Por qué**: no hay que descargar ni copiar archivos a mano, solo se incluyen las letras latinas y la versión "variable" contiene todos los pesos (400–800) en un solo archivo por fuente. Cuando llegue la PWA, el service worker podrá guardarlas en caché como cualquier otro archivo de la app.
- **Alternativas**: descargar los `.woff2` a `public/fonts` y escribir los `@font-face` a mano (más trabajo y fácil equivocarse con los subconjuntos); seguir con Google Fonts (no funcionaría sin conexión).

Pila de respaldo: `Archivo, Inter, system-ui, sans-serif` para títulos e `Inter, system-ui, sans-serif` para el resto.

### 4. Enrutador: React Router en modo declarativo

Se usa `react-router` con `<BrowserRouter>`, `<Routes>` y `<Route>`. Rutas:

| Ruta | Pantalla |
|---|---|
| `/` | Inicio |
| `/rebano` | Rebaño |
| `/almacen` | Almacén |
| `/mas` | Más (lista de opciones) |
| `/mas/ajustes` | Ajustes (selector de apariencia) |
| `/mas/estado` | Estado de la conexión |
| cualquier otra | Pantalla "no encontrada" con enlace a Inicio |

Todas cuelgan de un componente de diseño común (`Marco`) que pinta el contenido con `<Outlet />` y la barra de navegación inferior debajo. Las rutas van sin tildes ni ñ (`/rebano`, `/almacen`, `/mas`), siguiendo la convención del código.

- **Por qué**: es el enrutador más usado en React, tiene buena documentación en castellano y el modo declarativo es el más sencillo (no necesita cargadores ni acciones). `NavLink` marca solo el enlace activo con `aria-current="page"`.
- **Alternativas**: `wouter` (más pequeño, pero menos documentación); hacer las pantallas con un estado interno sin URL (el botón atrás del móvil no funcionaría).

En desarrollo, Vite ya devuelve `index.html` para cualquier ruta, así que recargar en `/rebano` funciona. En la instalación de uso, Caddy tendrá que hacer lo mismo; se anotará cuando se monte.

### 5. Iconos: `lucide-react`

Iconos de trazo, con el mismo estilo que los de los mockups (líneas de 2 px con extremos redondeados). Solo se incluyen en la compilación los iconos que se importan.

- **Por qué**: ligera, con muchos iconos y sin tener que copiar SVG a mano.
- **Alternativas**: SVG propios copiados de los mockups (control total, pero hay que mantenerlos); Heroicons o Tabler (similares; Lucide tiene más iconos útiles para este caso).

Regla: si el icono acompaña a un texto visible, lleva `aria-hidden="true"`; si va solo (por ejemplo, un botón con solo icono), el botón lleva `aria-label`. Para no olvidarlo, los componentes reciben el icono como prop y lo marcan ellos.

### 6. Menú inferior: elemento `<dialog>` nativo

El `MenuInferior` usa `<dialog>` abierto con `showModal()`, colocado pegado al borde inferior con forma de hoja. El navegador se encarga de: bloquear el resto de la pantalla, mover el foco dentro, cerrar con la tecla Escape o el botón atrás de Android (en navegadores que lo soportan) y devolver el foco al botón ➕ al cerrar. Se añade cierre al tocar el fondo oscuro y un botón "Cerrar" visible.

- **Por qué**: accesible por defecto y sin dependencias.
- **Alternativas**: un `div` con posición fija (hay que programar a mano el foco, Escape y el bloqueo); una librería como Radix (más peso para un solo componente).

Las acciones del menú (Conteo, Parto, Tratamiento, Alta, Baja, Foto, Compra de alimento) se muestran como una cuadrícula de botones con icono y texto. Mientras no funcionen, llevan la indicación "Próximamente" y `aria-disabled="true"`; pulsarlas no hace nada. Se usa `aria-disabled` en lugar de `disabled` para que sigan recibiendo el foco y los lectores de pantalla puedan leerlas.

### 7. Componentes base y organización de carpetas

```
frontend/src/
  main.jsx               fuentes, estilos globales y el enrutador
  App.jsx                definición de rutas
  estilos/               tema.css, base.css
  componentes/           Boton, Tarjeta, Aviso, CampoTexto, CabeceraPantalla,
                         BarraNavegacion, MenuInferior, Marco, EstadoVacio
  pantallas/             Inicio, Rebano, Almacen, Mas, Ajustes,
                         EstadoConexion, NoEncontrada
  hooks/                 useTema.js
```

Resumen de cada componente:

- **Boton**: variantes `principal`, `secundario` y `peligro`; puede llevar icono; alto mínimo 56 px (por encima de los 48 exigidos). Si recibe `to`, se pinta como enlace (`Link`) con el mismo aspecto, para que navegar sea siempre un enlace y actuar sea siempre un botón.
- **Tarjeta**: contenedor con fondo de superficie, borde fino y esquinas redondeadas. Puede ser un enlace completo (como los avisos de Inicio en el mockup).
- **Aviso**: bloque con icono y texto en las variantes `info`, `aviso`, `correcto` y `error`. Usa `role="status"` o `role="alert"` según la gravedad.
- **CampoTexto**: etiqueta visible siempre unida al campo (`<label htmlFor>`), campo de 56 px, texto de ayuda y mensaje de error opcionales enlazados con `aria-describedby`.
- **CabeceraPantalla**: título (`<h1>`) en Archivo, subtítulo opcional, enlace "volver" opcional y hueco para una acción a la derecha.
- **BarraNavegacion**: `<nav aria-label="Navegación principal">` con cuatro `NavLink` y el botón ➕ en el centro. Fija abajo y respetando la zona segura del móvil (`env(safe-area-inset-bottom)`).
- **MenuInferior**: ver decisión 6.
- **Marco**: estructura común (contenido + barra inferior) y enlace "Saltar al contenido" para teclado.
- **EstadoVacio**: icono, título y frase breve, para las pantallas que aún no tienen contenido.

### 8. Pantalla de estado de la conexión

Se mueve la lógica actual de `App.jsx` a `pantallas/EstadoConexion.jsx` sin cambiar su comportamiento, usando ahora `CabeceraPantalla`, `Aviso` y `Boton`. Al ser una pantalla independiente, la petición a `/api/estado` solo se hace al entrar en ella.

### 9. Color de error (rojo)

La paleta del documento de diseño no define el rojo, aunque dice que se reserva para errores y acciones peligrosas. Se usan estos valores, elegidos para que cumplan el contraste mínimo:

| Uso | Claro | Oscuro |
|---|---|---|
| Error: fondo | `#FCE8E6` | `#3D1C1A` |
| Error: borde | `#F0B4AE` | `#6E2C27` |
| Error: texto e icono | `#A1251B` | `#F4B4AD` |

### 10. Accesibilidad y contraste

- Todos los elementos táctiles miden al menos 48 × 48 px (variable `--tactil-minimo`).
- Foco visible en todos los elementos interactivos (`:focus-visible` con un contorno de 3 px en el color principal).
- `lang="es"` en el documento y un único `<h1>` por pantalla.
- Se comprobará el contraste de cada pareja texto/fondo de los dos modos con una herramienta (por ejemplo, el comprobador de contraste de las DevTools del navegador) y se apuntará cualquier pareja que no llegue a 4,5:1.
- **Cambio en la paleta tras la comprobación**: el borde de los campos (`--color-borde-campo`) no llegaba al contraste de 3:1 que WCAG exige a los bordes que marcan dónde está un control (1,58:1 en claro y 1,59:1 en oscuro sobre las tarjetas). Se oscurece manteniendo el mismo matiz:

  | Uso | Claro | Oscuro |
  |---|---|---|
  | Borde de campos (antes) | `#C9CFC9` | `#3A443D` |
  | Borde de campos (ahora) | `#858E87` | `#6B766E` |

  Con los valores nuevos, el contraste es de 3,38:1 (claro) y 3,39:1 (oscuro) sobre las tarjetas, y de 3,09:1 y 3,83:1 sobre el fondo. Todas las demás parejas de texto y fondo superan el 4,5:1 en los dos modos.
- Se respeta `prefers-reduced-motion` desactivando la animación del menú inferior.

## Risks / Trade-offs

- [Más dependencias en el frontend] → Son cuatro paquetes pequeños y muy usados; se fijan las versiones en `package-lock.json`.
- [El atributo `data-tema` y `localStorage` pueden fallar si el navegador bloquea el almacenamiento] → Se envuelve el acceso en `try/catch` y, si falla, se usa el modo automático.
- [`<dialog>` en navegadores antiguos] → Está soportado en todos los navegadores móviles actuales; la app se usará en móviles recientes.
- [El botón atrás de Android no siempre cierra el `<dialog>`] → Se acepta por ahora; el menú se cierra con el botón "Cerrar", tocando fuera o con Escape.
- [La página de estado ya no se ve al abrir la app] → Es intencionado: Inicio es la pantalla principal. Sigue accesible en Más.
- [Sin pruebas automáticas en el frontend] → Este cambio es casi todo visual; se verificará a mano con una lista de comprobación (ver tareas). Las pruebas automáticas llegarán cuando haya lógica de datos.

## Migration Plan

No hay datos ni usuarios todavía. Basta con instalar las dependencias nuevas (`npm install` en `frontend/`) tras bajar la rama. Para volver atrás, se revierte la rama.

## Open Questions

Resueltas en la revisión:

- **Colores de error**: se aceptan los valores de la decisión 9.
- **Pruebas del frontend**: no se añaden en este cambio. Vitest y Testing Library se incorporarán cuando el frontend tenga lógica de datos.
