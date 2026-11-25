import { Package } from 'lucide-react'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'

function Almacen() {
  return (
    <>
      <CabeceraPantalla titulo="Almacén" />
      <EstadoVacio icono={Package} titulo="El almacén llegará pronto">
        Aquí podrás llevar el material y la alimentación: existencias, compras y
        recuentos.
      </EstadoVacio>
    </>
  )
}

export default Almacen
