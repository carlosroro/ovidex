import { Route, Routes } from 'react-router'
import Marco from './componentes/Marco.jsx'
import Ajustes from './pantallas/Ajustes.jsx'
import Almacen from './pantallas/Almacen.jsx'
import EstadoConexion from './pantallas/EstadoConexion.jsx'
import Inicio from './pantallas/Inicio.jsx'
import Mas from './pantallas/Mas.jsx'
import NoEncontrada from './pantallas/NoEncontrada.jsx'
import Rebano from './pantallas/Rebano.jsx'

/*
 * Rutas de la app. Todas cuelgan de <Marco>, que pinta la barra inferior
 * y coloca la pantalla de cada ruta en su <Outlet />.
 */
function App() {
  return (
    <Routes>
      <Route element={<Marco />}>
        <Route index element={<Inicio />} />
        <Route path="rebano" element={<Rebano />} />
        <Route path="almacen" element={<Almacen />} />
        <Route path="mas">
          <Route index element={<Mas />} />
          <Route path="ajustes" element={<Ajustes />} />
          <Route path="estado" element={<EstadoConexion />} />
        </Route>
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}

export default App
