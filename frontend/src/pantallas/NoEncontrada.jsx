import { House, SearchX } from 'lucide-react'
import Boton from '../componentes/Boton.jsx'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'

// Se muestra cuando la dirección no corresponde a ninguna pantalla
function NoEncontrada() {
  return (
    <>
      <CabeceraPantalla titulo="Página no encontrada" />
      <EstadoVacio icono={SearchX} titulo="Esta dirección no existe">
        Puede que el enlace esté mal escrito o que la pantalla se haya movido.
      </EstadoVacio>
      <Boton to="/" icono={House} bloque>
        Ir a Inicio
      </Boton>
    </>
  )
}

export default NoEncontrada
