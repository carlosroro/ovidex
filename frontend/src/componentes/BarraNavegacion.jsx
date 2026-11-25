import { useState } from 'react'
import { Ellipsis, House, List, Package, Plus } from 'lucide-react'
import { NavLink } from 'react-router'
import MenuRegistrar from './MenuRegistrar.jsx'
import './BarraNavegacion.css'

/*
 * Barra de navegación inferior: Inicio · Rebaño · [Registrar] · Almacén · Más.
 * NavLink añade aria-current="page" al enlace de la sección actual;
 * el CSS usa ese mismo atributo para destacarlo.
 */
function EnlaceSeccion({ to, icono: Icono, texto, end = false }) {
  return (
    <NavLink to={to} end={end} className="barra__enlace">
      <Icono size={26} aria-hidden="true" />
      {texto}
    </NavLink>
  )
}

function BarraNavegacion() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      <nav className="barra" aria-label="Navegación principal">
        {/* "end": Inicio solo está activo en "/" exacto, no en todas las rutas */}
        <EnlaceSeccion to="/" icono={House} texto="Inicio" end />
        <EnlaceSeccion to="/rebano" icono={List} texto="Rebaño" />
        <div className="barra__centro">
          <button
            type="button"
            className="barra__registrar"
            aria-label="Registrar"
            aria-haspopup="dialog"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(true)}
          >
            <Plus size={30} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
        <EnlaceSeccion to="/almacen" icono={Package} texto="Almacén" />
        <EnlaceSeccion to="/mas" icono={Ellipsis} texto="Más" />
      </nav>

      <MenuRegistrar
        abierto={menuAbierto}
        alCerrar={() => setMenuAbierto(false)}
      />
    </>
  )
}

export default BarraNavegacion
