import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import './Aviso.css'

// Icono de cada variante
const ICONOS = {
  info: Info,
  aviso: TriangleAlert,
  correcto: CircleCheck,
  error: CircleAlert,
}

/*
 * Aviso: bloque destacado con icono, título y detalle.
 * - variante: 'info' (por defecto), 'aviso', 'correcto' o 'error'.
 * - El error usa role="alert" (el lector de pantalla lo anuncia en el acto);
 *   el resto, role="status" (lo anuncia sin interrumpir).
 *   Se puede cambiar pasando otro "role".
 */
function Aviso({
  variante = 'info',
  titulo,
  className = '',
  children,
  ...resto
}) {
  const Icono = ICONOS[variante]
  const rol = variante === 'error' ? 'alert' : 'status'

  return (
    <div
      role={rol}
      className={`aviso aviso--${variante} ${className}`.trim()}
      {...resto}
    >
      <Icono className="aviso__icono" size={22} aria-hidden="true" />
      <div className="aviso__texto">
        {titulo && <p className="aviso__titulo">{titulo}</p>}
        {children && <div className="aviso__detalle">{children}</div>}
      </div>
    </div>
  )
}

export default Aviso
