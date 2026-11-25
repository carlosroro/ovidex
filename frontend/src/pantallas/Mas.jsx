import { Settings, Wifi } from 'lucide-react'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import Tarjeta from '../componentes/Tarjeta.jsx'
import './Mas.css'

// Opciones de la sección Más. Para añadir una, basta con una línea nueva.
const OPCIONES = [
  {
    to: '/mas/ajustes',
    icono: Settings,
    titulo: 'Ajustes',
    detalle: 'Apariencia de la app',
  },
  {
    to: '/mas/estado',
    icono: Wifi,
    titulo: 'Estado de la conexión',
    detalle: 'Comprueba que el servidor responde',
  },
]

function Mas() {
  return (
    <>
      <CabeceraPantalla titulo="Más" />
      <ul className="opciones">
        {OPCIONES.map(({ to, icono: Icono, titulo, detalle }) => (
          <li key={to}>
            <Tarjeta to={to}>
              <div className="opcion">
                <span className="opcion__icono">
                  <Icono size={24} aria-hidden="true" />
                </span>
                <span className="opcion__textos">
                  <span className="opcion__titulo">{titulo}</span>
                  <span className="opcion__detalle">{detalle}</span>
                </span>
              </div>
            </Tarjeta>
          </li>
        ))}
      </ul>
    </>
  )
}

export default Mas
