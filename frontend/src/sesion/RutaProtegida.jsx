import { RefreshCw } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import PantallaSimple from '../componentes/PantallaSimple.jsx'
import { useSesion } from './contexto.js'

/*
 * Envuelve las rutas que necesitan sesión. Según el estado de la sesión:
 * - comprobando: pantalla de carga (no se enseña el login a quien ya tiene sesión);
 * - error: el servidor no responde, con botón para reintentar;
 * - sin-sesion: lleva al login, recordando la dirección que se quería abrir;
 * - iniciada: muestra la pantalla de la ruta (<Outlet />).
 */
function RutaProtegida() {
  const { estado, cerradaPorUsuario, reintentar } = useSesion()
  const ubicacion = useLocation()

  if (estado === 'comprobando') {
    return (
      <PantallaSimple centrada>
        <p role="status" className="pantalla-simple__mensaje">
          Comprobando la sesión…
        </p>
      </PantallaSimple>
    )
  }

  if (estado === 'error') {
    return (
      <PantallaSimple centrada>
        <Aviso variante="error" titulo="No se puede conectar con el servidor">
          Comprueba que estás en la wifi de casa y que el servidor está
          encendido.
        </Aviso>
        <Boton
          variante="secundario"
          icono={RefreshCw}
          bloque
          onClick={reintentar}
        >
          Reintentar
        </Boton>
      </PantallaSimple>
    )
  }

  if (estado === 'sin-sesion') {
    // replace: el botón atrás no volverá a esta dirección protegida.
    // state.desde: el login llevará aquí después de entrar, salvo si la
    // sesión la cerró el propio usuario (entonces irá a Inicio).
    return (
      <Navigate
        to="/login"
        replace
        state={cerradaPorUsuario ? undefined : { desde: ubicacion }}
      />
    )
  }

  return <Outlet />
}

export default RutaProtegida
