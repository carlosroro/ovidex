import { Moon, Smartphone, Sun } from 'lucide-react'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import { useTema } from '../hooks/useTema.js'
import './Ajustes.css'

const OPCIONES_TEMA = [
  {
    valor: 'auto',
    icono: Smartphone,
    titulo: 'Automático',
    detalle: 'Igual que la configuración del móvil',
  },
  { valor: 'claro', icono: Sun, titulo: 'Claro', detalle: 'Fondo claro' },
  {
    valor: 'oscuro',
    icono: Moon,
    titulo: 'Oscuro',
    detalle: 'Fondo oscuro, para usar de noche',
  },
]

/*
 * Selector de apariencia hecho con botones de opción (<input type="radio">)
 * reales: el navegador ya sabe que solo se puede elegir uno, se manejan con
 * las flechas del teclado y el lector de pantalla dice "1 de 3, marcado".
 */
function Ajustes() {
  const [tema, cambiarTema] = useTema()

  return (
    <>
      <CabeceraPantalla titulo="Ajustes" volverA="/mas" textoVolver="Más" />

      <fieldset className="selector-tema">
        <legend className="selector-tema__leyenda">
          <h2>Apariencia</h2>
        </legend>
        {OPCIONES_TEMA.map(({ valor, icono: Icono, titulo, detalle }) => (
          <label key={valor} className="selector-tema__opcion">
            <input
              type="radio"
              name="tema"
              value={valor}
              checked={tema === valor}
              onChange={() => cambiarTema(valor)}
            />
            <Icono size={24} aria-hidden="true" />
            <span className="selector-tema__textos">
              <span className="selector-tema__titulo">{titulo}</span>
              <span className="selector-tema__detalle">{detalle}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </>
  )
}

export default Ajustes
