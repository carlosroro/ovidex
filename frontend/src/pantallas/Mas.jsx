import { useState } from 'react'
import { LogOut, Settings, Wifi } from 'lucide-react'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import Tarjeta from '../componentes/Tarjeta.jsx'
import { useSesion } from '../sesion/contexto.js'
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
  const { usuario, cerrarSesion } = useSesion()
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState(null)

  async function salir() {
    setCerrando(true)
    setError(null)
    try {
      // Si va bien, la sesión pasa a "sin-sesion" y RutaProtegida lleva al
      // login (sin recordar Más: al volver a entrar se irá a Inicio)
      await cerrarSesion()
    } catch {
      // Sin conexión o error del servidor: la sesión sigue abierta
      setError(
        'No se ha podido cerrar la sesión. Comprueba la conexión con el servidor y vuelve a intentarlo.',
      )
      setCerrando(false)
    }
  }

  return (
    <>
      <CabeceraPantalla
        titulo="Más"
        subtitulo={
          usuario &&
          `Sesión iniciada como ${usuario.nombre} (${usuario.usuario})`
        }
      />
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

      {error && <Aviso variante="error" titulo={error} />}

      {/* Es una acción (no lleva a otra pantalla), por eso es un botón */}
      <Boton
        variante="secundario"
        icono={LogOut}
        bloque
        onClick={salir}
        disabled={cerrando}
      >
        {cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Boton>
    </>
  )
}

export default Mas
