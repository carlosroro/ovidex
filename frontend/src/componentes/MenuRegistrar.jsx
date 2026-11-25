import {
  Baby,
  Camera,
  ClipboardList,
  ShoppingCart,
  SquareMinus,
  SquarePlus,
  Syringe,
} from 'lucide-react'
import MenuInferior from './MenuInferior.jsx'
import './MenuRegistrar.css'

// Acciones frecuentes del botón ➕. Todavía no funcionan.
const ACCIONES = [
  { id: 'conteo', texto: 'Conteo', icono: ClipboardList },
  { id: 'parto', texto: 'Parto', icono: Baby },
  { id: 'tratamiento', texto: 'Tratamiento', icono: Syringe },
  { id: 'alta', texto: 'Alta', icono: SquarePlus },
  { id: 'baja', texto: 'Baja', icono: SquareMinus },
  { id: 'foto', texto: 'Foto', icono: Camera },
  { id: 'compra', texto: 'Compra de alimento', icono: ShoppingCart },
]

/*
 * Menú del botón "Registrar".
 * Cada acción es un botón real con aria-disabled (y no disabled) para que
 * siga recibiendo el foco y el lector de pantalla pueda leer "Próximamente".
 */
function MenuRegistrar({ abierto, alCerrar }) {
  return (
    <MenuInferior abierto={abierto} alCerrar={alCerrar} titulo="Registrar">
      <ul className="menu-registrar">
        {ACCIONES.map(({ id, texto, icono: Icono }) => (
          <li key={id}>
            <button
              type="button"
              className="menu-registrar__accion"
              aria-disabled="true"
            >
              <span className="menu-registrar__icono">
                <Icono size={26} aria-hidden="true" />
              </span>
              <span className="menu-registrar__texto">{texto}</span>
              <span className="menu-registrar__aviso">Próximamente</span>
            </button>
          </li>
        ))}
      </ul>
    </MenuInferior>
  )
}

export default MenuRegistrar
