import './PantallaSimple.css'

/*
 * Estructura de las pantallas que van sin barra de navegación inferior:
 * login, comprobación de la sesión y servidor no disponible.
 * - centrada: centra el contenido en vertical (por ejemplo, un mensaje de carga).
 */
function PantallaSimple({ centrada = false, children }) {
  const clases = ['pantalla-simple', centrada && 'pantalla-simple--centrada']
    .filter(Boolean)
    .join(' ')

  return (
    <main id="contenido" className={clases}>
      {children}
    </main>
  )
}

export default PantallaSimple
