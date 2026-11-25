import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import './MenuInferior.css'

/*
 * Menú que aparece desde abajo (hoja inferior), hecho con <dialog>.
 * - abierto: true para mostrarlo.
 * - alCerrar: función que se llama cuando el menú se cierra por cualquier
 *   motivo (botón Cerrar, tecla Escape o toque fuera). Debe poner abierto=false.
 * - titulo: encabezado del menú (también es su nombre accesible).
 *
 * showModal() hace que el navegador bloquee el resto de la pantalla y
 * mantenga el foco dentro del menú.
 */
function MenuInferior({ abierto, alCerrar, titulo, children }) {
  const dialogo = useRef(null)
  const idTitulo = useId()

  // Sincroniza la prop "abierto" con el <dialog> real
  useEffect(() => {
    const elemento = dialogo.current
    if (abierto && !elemento.open) {
      // Se recuerda qué tenía el foco (el botón que abrió el menú)
      const anterior = document.activeElement
      elemento.showModal()
      return () => {
        if (elemento.open) elemento.close()
        // Al cerrar, el foco vuelve a ese botón
        anterior?.focus?.()
      }
    }
  }, [abierto])

  // Toque fuera: el clic cae en el propio <dialog> (su fondo), no en el contenido
  function alPulsar(evento) {
    if (evento.target === dialogo.current) alCerrar()
  }

  // La tecla Escape cierra el <dialog> por sí sola; aquí se avisa al padre
  function alCancelar(evento) {
    evento.preventDefault()
    alCerrar()
  }

  return (
    <dialog
      ref={dialogo}
      className="menu-inferior"
      aria-labelledby={idTitulo}
      onClick={alPulsar}
      onCancel={alCancelar}
    >
      <div className="menu-inferior__hoja">
        <div className="menu-inferior__cabecera">
          <h2 id={idTitulo}>{titulo}</h2>
          <button
            type="button"
            className="menu-inferior__cerrar"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export default MenuInferior
