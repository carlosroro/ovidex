## Why

La aplicación solo tiene una página provisional que comprueba la conexión con la API. Antes de construir las funcionalidades (censo, conteo, almacén…) hace falta una base visual común: colores, tipografía, navegación y componentes reutilizables. Así cada funcionalidad nueva se monta sobre piezas ya hechas y con un aspecto coherente, en lugar de inventar estilos cada vez.

## What Changes

- Variables CSS con la paleta "Verde campo" (modo claro) y "Noche" (modo oscuro), definidas en un único sitio.
- Modo oscuro que sigue la configuración del sistema por defecto, con un selector para elegirlo a mano (claro, oscuro o automático) que se recuerda en el navegador.
- Fuentes Archivo (títulos y cifras) e Inter (resto del texto) incluidas en el propio proyecto, sin depender de Google Fonts.
- Navegación con rutas entre cuatro secciones: Inicio, Rebaño, Almacén y Más.
- Barra de navegación inferior fija con las cuatro secciones y un botón central "Registrar" (➕).
- El botón "Registrar" abre un menú inferior con las acciones frecuentes (Conteo, Parto, Tratamiento, Alta, Baja, Foto y Compra de alimento), marcadas como "Próximamente".
- Pantallas vacías con su cabecera para cada sección, listas para las siguientes funcionalidades.
- Dentro de Más: una pantalla de Ajustes (con el selector de apariencia) y la pantalla de estado de la conexión, que deja de ser la página de inicio. **BREAKING** (solo para quien la usaba): la comprobación de la conexión ya no aparece al abrir la app, sino en Más › Estado de la conexión.
- Componentes base reutilizables: botón, tarjeta, aviso, campo de texto, cabecera de pantalla, barra de navegación y menú inferior.
- Iconos de trazo con una librería ligera, sin emojis.
- Reglas de accesibilidad: zonas táctiles de al menos 48 px, contraste suficiente, botones y enlaces reales, iconos con texto alternativo o marcados como decorativos.

## Capabilities

### New Capabilities

- `interfaz-base`: paleta de colores, modo claro/oscuro con selector, tipografía local, iconos, componentes base reutilizables y reglas de accesibilidad comunes a toda la interfaz.
- `navegacion`: rutas de las secciones principales, barra de navegación inferior, menú de acciones del botón "Registrar", sección Más con sus subpantallas y pantalla para rutas que no existen.

### Modified Capabilities

- `estado-conexion`: la página de estado deja de mostrarse al abrir la app y pasa a ser una pantalla dentro de Más, con la nueva apariencia.

## Impact

- **Frontend** (`frontend/`): se reorganiza `src/` en componentes, pantallas y estilos; `App.jsx` pasa a definir las rutas; `index.css` se sustituye por los estilos de la base visual; `index.html` añade un pequeño script para aplicar el tema antes de pintar la página.
- **Dependencias nuevas** del frontend: un enrutador (`react-router`), una librería de iconos (`lucide-react`) y las fuentes Archivo e Inter empaquetadas como paquetes npm (`@fontsource-variable/...`).
- **Backend**: sin cambios. La ruta `GET /api/estado` sigue igual.

## Fuera de este cambio

- Inicio de sesión y usuarios.
- Datos reales o de prueba en las pantallas (cifras, listas, avisos de ejemplo).
- Funcionamiento de las acciones del menú "Registrar".
- Secciones internas de Almacén (Material y Alimentación) y de Rebaño.
- PWA (instalación, service worker) y funcionamiento sin conexión.
- Indicador de conexión y cambios pendientes en las cabeceras (llegará con la sincronización).
