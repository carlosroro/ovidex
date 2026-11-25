import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import BarraNavegacion from './BarraNavegacion.jsx'
import './Marco.css'

/*
 * Estructura común de todas las pantallas:
 * enlace "Saltar al contenido" + contenido de la ruta + barra inferior.
 * <Outlet /> es el hueco donde React Router pinta la pantalla de la ruta actual.
 */
function Marco() {
  const { pathname } = useLocation()

  // Al cambiar de pantalla, se empieza desde arriba
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      {/* Para teclado: salta directamente al contenido */}
      <a href="#contenido" className="marco__saltar">
        Saltar al contenido
      </a>
      <main id="contenido" className="marco__contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <BarraNavegacion />
    </>
  )
}

export default Marco
