import { useId, useRef } from 'react'
import './Pestanas.css'

/*
 * Pestañas, según el patrón accesible de WAI-ARIA:
 * - La fila de pestañas tiene role="tablist"; cada pestaña, role="tab" y
 *   aria-selected; el contenido, role="tabpanel" unido a su pestaña.
 * - Solo la pestaña elegida está en el orden del tabulador; las flechas
 *   izquierda/derecha (e Inicio/Fin) se mueven entre pestañas y la eligen.
 *
 * - etiqueta: nombre de la fila para el lector de pantalla.
 * - pestanas: [{ id, texto, textoCorto?, contenido }]. textoCorto se muestra
 *   en pantallas estrechas; el lector de pantalla lee siempre el texto completo.
 * - seleccionada, alCambiar(id): pestaña elegida (la controla quien la usa,
 *   para poder, por ejemplo, volver a la primera al cambiar de animal).
 */
function Pestanas({ etiqueta, pestanas, seleccionada, alCambiar }) {
  const base = useId()
  const botones = useRef({})

  const idPestana = (id) => `${base}-pestana-${id}`
  const idPanel = (id) => `${base}-panel-${id}`

  function elegir(indice) {
    const pestana = pestanas[indice]
    alCambiar(pestana.id)
    botones.current[pestana.id]?.focus()
  }

  function alPulsarTecla(evento, indice) {
    const ultima = pestanas.length - 1
    const destino = {
      ArrowRight: indice === ultima ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultima : indice - 1,
      Home: 0,
      End: ultima,
    }[evento.key]

    if (destino === undefined) return

    evento.preventDefault()
    elegir(destino)
  }

  const actual = pestanas.find((p) => p.id === seleccionada) ?? pestanas[0]

  return (
    <div className="pestanas">
      <div role="tablist" aria-label={etiqueta} className="pestanas__lista">
        {pestanas.map((pestana, indice) => {
          const elegida = pestana.id === actual.id

          return (
            <button
              key={pestana.id}
              ref={(boton) => {
                botones.current[pestana.id] = boton
              }}
              type="button"
              role="tab"
              id={idPestana(pestana.id)}
              aria-selected={elegida}
              aria-controls={idPanel(pestana.id)}
              // Con texto corto, el nombre accesible es el texto completo
              aria-label={pestana.textoCorto ? pestana.texto : undefined}
              tabIndex={elegida ? 0 : -1}
              className="pestanas__pestana"
              onClick={() => alCambiar(pestana.id)}
              onKeyDown={(evento) => alPulsarTecla(evento, indice)}
            >
              {pestana.textoCorto ? (
                <>
                  <span className="pestanas__texto-largo">{pestana.texto}</span>
                  <span className="pestanas__texto-corto" aria-hidden="true">
                    {pestana.textoCorto}
                  </span>
                </>
              ) : (
                pestana.texto
              )}
            </button>
          )
        })}
      </div>

      {/* tabIndex 0: con el tabulador se llega al contenido tras la pestaña */}
      <div
        role="tabpanel"
        id={idPanel(actual.id)}
        aria-labelledby={idPestana(actual.id)}
        tabIndex={0}
        className="pestanas__panel"
      >
        {actual.contenido}
      </div>
    </div>
  )
}

export default Pestanas
