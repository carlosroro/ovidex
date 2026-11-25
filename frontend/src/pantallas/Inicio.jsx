import { Sprout } from 'lucide-react'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'

function Inicio() {
  return (
    <>
      <CabeceraPantalla titulo="Inicio" />
      <EstadoVacio icono={Sprout} titulo="Aquí verás el resumen del día">
        Los avisos, las cifras del rebaño y la actividad reciente aparecerán en
        esta pantalla más adelante.
      </EstadoVacio>
    </>
  )
}

export default Inicio
