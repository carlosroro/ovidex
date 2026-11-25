## 1. Dependencias y estructura

- [x] 1.1 Instalar en `frontend/` las dependencias `react-router`, `lucide-react`, `@fontsource-variable/archivo` e `@fontsource-variable/inter`
- [x] 1.2 Crear las carpetas `src/estilos/`, `src/componentes/`, `src/pantallas/` y `src/hooks/`

## 2. Tema, colores y tipografía

- [x] 2.1 Crear `src/estilos/tema.css` con las variables de color del modo claro en `:root`, incluidas las de error y las de medidas (radios, espacios, `--tactil-minimo`)
- [x] 2.2 Añadir en `tema.css` los valores del modo oscuro para `[data-tema="oscuro"]` y para el modo automático con `prefers-color-scheme: dark`, y declarar `color-scheme`
- [x] 2.3 Crear `src/estilos/base.css` con el reinicio básico, las fuentes (Archivo en títulos, Inter en el resto), el foco visible y la regla de `prefers-reduced-motion`
- [x] 2.4 Importar las fuentes y los estilos globales en `main.jsx` y borrar el `index.css` provisional
- [x] 2.5 Añadir en `index.html` el script en línea que aplica `data-tema` antes de arrancar React, con `try/catch`, y revisar `lang="es"` y `viewport-fit=cover`
- [x] 2.6 Crear el hook `src/hooks/useTema.js` que lee y guarda la preferencia (`auto`, `claro`, `oscuro`) y actualiza el atributo de `<html>`

## 3. Componentes base

- [x] 3.1 Crear `Boton` (variantes principal, secundario y peligro; icono opcional; enlace si recibe `to`)
- [x] 3.2 Crear `Tarjeta` (contenedor normal o enlace completo)
- [x] 3.3 Crear `Aviso` (variantes info, aviso, correcto y error, con icono y rol adecuado)
- [x] 3.4 Crear `CampoTexto` (etiqueta asociada, ayuda y error con `aria-describedby`)
- [x] 3.5 Crear `CabeceraPantalla` (título `h1`, subtítulo, enlace para volver y hueco para una acción)
- [x] 3.6 Crear `EstadoVacio` (icono, título y frase breve)

## 4. Navegación

- [x] 4.1 Crear `MenuInferior` con `<dialog>`: abrir con `showModal()`, cerrar con botón, Escape y toque fuera, y devolver el foco al botón que lo abrió
- [x] 4.2 Añadir al `MenuInferior` la cuadrícula de las siete acciones con icono, texto, "Próximamente" y `aria-disabled` (en el componente `MenuRegistrar`, que usa `MenuInferior`)
- [x] 4.3 Crear `BarraNavegacion` con los cuatro `NavLink`, el botón central "Registrar" que abre el menú y la zona segura inferior
- [x] 4.4 Crear `Marco` con el enlace "Saltar al contenido", el `<main>` con `<Outlet />`, el espacio inferior para la barra y la barra de navegación
- [x] 4.5 Definir las rutas en `App.jsx` y envolver la app con `BrowserRouter` en `main.jsx`

## 5. Pantallas

- [x] 5.1 Crear las pantallas vacías `Inicio`, `Rebano` y `Almacen` con su cabecera y `EstadoVacio`
- [x] 5.2 Crear la pantalla `Mas` con la lista de enlaces a Ajustes y Estado de la conexión
- [x] 5.3 Crear la pantalla `Ajustes` con el selector de apariencia (Automático, Claro, Oscuro) usando `useTema`
- [x] 5.4 Mover la lógica de estado de la conexión de `App.jsx` a `pantallas/EstadoConexion.jsx`, usando `CabeceraPantalla`, `Aviso` y `Boton`
- [x] 5.5 Crear la pantalla `NoEncontrada` con enlace a Inicio

## 6. Comprobación

- [x] 6.1 Pasar `npm run lint`, `npm run format:check` y `npm run build` sin errores
- [x] 6.2 Comprobar a mano la navegación: las cuatro secciones, recargar en cada ruta, botón atrás, ruta inexistente y sección destacada en la barra
- [x] 6.3 Comprobar a mano el menú "Registrar": abrir, acciones sin efecto, cerrar con botón, Escape y toque fuera, foco al cerrar
- [x] 6.4 Comprobar a mano la apariencia: automático siguiendo al sistema, claro y oscuro manuales, que se recuerda al recargar y que no hay parpadeo
- [x] 6.5 Comprobar en las DevTools que las fuentes se cargan desde el propio servidor y no hay peticiones a dominios externos
- [x] 6.6 Comprobar la accesibilidad: zonas táctiles de 48 px, foco visible con tabulador, contraste de los textos en los dos modos y textos alternativos de los iconos
- [x] 6.7 Comprobar la pantalla de estado de la conexión en Más con el servidor arrancado y parado
- [x] 6.8 Revisar el aspecto en un ancho de móvil (unos 390 px) comparándolo con los mockups

## 7. Documentación

- [x] 7.1 Actualizar el `README` si cambia algo de cómo arrancar el frontend
