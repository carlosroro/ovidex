import { Route, Routes } from 'react-router'
import CensoProvider from './censo/CensoProvider.jsx'
import Marco from './componentes/Marco.jsx'
import Ajustes from './pantallas/Ajustes.jsx'
import Almacen from './pantallas/Almacen.jsx'
import EstadoConexion from './pantallas/EstadoConexion.jsx'
import FichaAnimal from './pantallas/FichaAnimal.jsx'
import FormularioAnimal from './pantallas/FormularioAnimal.jsx'
import Inicio from './pantallas/Inicio.jsx'
import Login from './pantallas/Login.jsx'
import Mas from './pantallas/Mas.jsx'
import NoEncontrada from './pantallas/NoEncontrada.jsx'
import Rebano from './pantallas/Rebano.jsx'
import RutaProtegida from './sesion/RutaProtegida.jsx'

/*
 * Rutas de la app.
 * - /login va suelta, sin barra inferior.
 * - El resto cuelga de <RutaProtegida> (sin sesión, lleva al login) y de
 *   <Marco>, que pinta la barra inferior y coloca cada pantalla en su <Outlet />.
 * - <CensoProvider> guarda la lista del censo para todas esas pantallas.
 *   Al estar dentro de <RutaProtegida>, al cerrarse la sesión desaparece
 *   y la lista se olvida.
 */
function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route
          element={
            <CensoProvider>
              <Marco />
            </CensoProvider>
          }
        >
          <Route index element={<Inicio />} />
          <Route path="rebano">
            <Route index element={<Rebano />} />
            {/* "nuevo" es una ruta propia: React Router la prefiere a ":id" */}
            <Route path="nuevo" element={<FormularioAnimal />} />
            <Route path=":id" element={<FichaAnimal />} />
            <Route path=":id/editar" element={<FormularioAnimal />} />
          </Route>
          <Route path="almacen" element={<Almacen />} />
          <Route path="mas">
            <Route index element={<Mas />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="estado" element={<EstadoConexion />} />
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
