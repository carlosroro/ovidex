import { Link } from 'react-router'
import './Boton.css'

/*
 * Botón de la app.
 * - variante: 'principal' (por defecto), 'secundario' o 'peligro'.
 * - icono: componente de icono de lucide-react (opcional).
 * - to: si se indica, se pinta como enlace (<Link>) con aspecto de botón.
 *   Regla: para ir a otra pantalla, enlace; para hacer algo, botón.
 * - bloque: ocupa todo el ancho disponible.
 * Un botón que solo lleva icono necesita aria-label para tener nombre.
 */
function Boton({
  variante = 'principal',
  icono: Icono,
  to,
  bloque = false,
  type = 'button',
  className = '',
  children,
  ...resto
}) {
  const clases = [
    'boton',
    `boton--${variante}`,
    bloque && 'boton--bloque',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const contenido = (
    <>
      {Icono && <Icono className="boton__icono" size={20} aria-hidden="true" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={clases} {...resto}>
        {contenido}
      </Link>
    )
  }

  return (
    <button type={type} className={clases} {...resto}>
      {contenido}
    </button>
  )
}

export default Boton
