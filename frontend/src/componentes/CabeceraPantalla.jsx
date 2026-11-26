import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import './CabeceraPantalla.css'

/*
 * Cabecera de cada pantalla.
 * - titulo: encabezado principal (<h1>). Solo debe haber uno por pantalla.
 * - subtitulo: línea pequeña bajo el título (opcional).
 * - volverA + textoVolver: enlace para volver, por ejemplo a "Más" (opcional).
 * - estadoVolver: estado de navegación que lleva ese enlace (opcional; por
 *   ejemplo, la búsqueda de Rebaño para que la ficha pueda volver a ella).
 * - accion: elemento a la derecha del título, normalmente un Boton (opcional).
 */
function CabeceraPantalla({
  titulo,
  subtitulo,
  volverA,
  textoVolver = 'Volver',
  estadoVolver,
  accion,
}) {
  return (
    <header className="cabecera">
      {volverA && (
        <Link to={volverA} state={estadoVolver} className="cabecera__volver">
          <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
          {textoVolver}
        </Link>
      )}
      <div className="cabecera__fila">
        <div className="cabecera__textos">
          <h1>{titulo}</h1>
          {subtitulo && <p className="cabecera__subtitulo">{subtitulo}</p>}
        </div>
        {accion && <div className="cabecera__accion">{accion}</div>}
      </div>
    </header>
  )
}

export default CabeceraPantalla
