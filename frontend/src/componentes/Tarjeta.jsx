import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import './Tarjeta.css'

/*
 * Tarjeta: caja con fondo, borde fino y esquinas redondeadas.
 * - Sin "to": un contenedor normal.
 * - Con "to": toda la tarjeta es un enlace, con una flecha al final.
 */
function Tarjeta({ to, className = '', children, ...resto }) {
  if (to) {
    return (
      <Link
        to={to}
        className={`tarjeta tarjeta--enlace ${className}`.trim()}
        {...resto}
      >
        <div className="tarjeta__contenido">{children}</div>
        <ChevronRight
          className="tarjeta__flecha"
          size={20}
          aria-hidden="true"
        />
      </Link>
    )
  }

  return (
    <div className={`tarjeta ${className}`.trim()} {...resto}>
      {children}
    </div>
  )
}

export default Tarjeta
