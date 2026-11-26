import { useState } from 'react'
import {
  Baby,
  Camera,
  ClipboardList,
  ShoppingCart,
  SquareMinus,
  SquarePlus,
  Syringe,
} from 'lucide-react'
import { Link } from 'react-router'
import MenuInferior from './MenuInferior.jsx'
import './MenuRegistrar.css'

/*
 * Acciones frecuentes del botón ➕. Las que tienen "ruta" ya funcionan y
 * llevan a su pantalla; las demás llegarán más adelante.
 */
const ACCIONES = [
  { id: 'conteo', texto: 'Conteo', icono: ClipboardList },
  { id: 'parto', texto: 'Parto', icono: Baby },
  { id: 'tratamiento', texto: 'Tratamiento', icono: Syringe },
  { id: 'alta', texto: 'Alta', icono: SquarePlus, ruta: '/rebano/nuevo' },
  { id: 'baja', texto: 'Baja', icono: SquareMinus },
  { id: 'foto', texto: 'Foto', icono: Camera },
  { id: 'compra', texto: 'Compra de alimento', icono: ShoppingCart },
]

/*
 * Menú del botón "Registrar".
 * - Acción disponible: enlace real a su pantalla (para ir a otra pantalla,
 *   enlace); al pulsarla se cierra el menú.
 * - Acción pendiente: botón con aria-disabled (y no disabled) para que siga
 *   recibiendo el foco y el lector de pantalla pueda leer "Próximamente".
 */
function MenuRegistrar({ abierto, alCerrar }) {
  // true cuando el menú se cierra porque se va a otra pantalla: entonces el
  // foco no vuelve al botón "Registrar"
  const [navegando, setNavegando] = useState(false)

  // Al volver a abrir el menú, se olvida la navegación anterior
  // (ajuste de estado durante el pintado, permitido por React)
  if (abierto && navegando) setNavegando(false)

  function ir() {
    setNavegando(true)
    alCerrar()
  }

  return (
    <MenuInferior
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Registrar"
      devolverFoco={!navegando}
    >
      <ul className="menu-registrar">
        {ACCIONES.map(({ id, texto, icono: Icono, ruta }) => {
          const contenido = (
            <>
              <span className="menu-registrar__icono">
                <Icono size={26} aria-hidden="true" />
              </span>
              <span className="menu-registrar__texto">{texto}</span>
              {!ruta && (
                <span className="menu-registrar__aviso">Próximamente</span>
              )}
            </>
          )

          return (
            <li key={id}>
              {ruta ? (
                <Link
                  to={ruta}
                  className="menu-registrar__accion menu-registrar__accion--disponible"
                  onClick={ir}
                >
                  {contenido}
                </Link>
              ) : (
                <button
                  type="button"
                  className="menu-registrar__accion"
                  aria-disabled="true"
                  // Nombre con pausa: "Conteo, Próximamente" (sin esto, el
                  // lector de pantalla puede leer "ConteoPróximamente")
                  aria-label={`${texto}, Próximamente`}
                >
                  {contenido}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </MenuInferior>
  )
}

export default MenuRegistrar
