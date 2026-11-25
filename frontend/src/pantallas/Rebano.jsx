import { List } from 'lucide-react'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'

function Rebano() {
  return (
    <>
      <CabeceraPantalla titulo="Rebaño" />
      <EstadoVacio icono={List} titulo="El censo llegará pronto">
        Aquí podrás buscar los animales, consultar su ficha y organizarlos por
        lotes.
      </EstadoVacio>
    </>
  )
}

export default Rebano
