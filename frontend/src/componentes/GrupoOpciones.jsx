import { useId } from 'react'
import { CircleAlert } from 'lucide-react'
import './GrupoOpciones.css'

/*
 * Grupo de opciones excluyentes (se elige una), con aspecto de botones.
 *
 * Por dentro son botones de opción nativos (<input type="radio">) con el
 * mismo "name", dentro de un <fieldset> cuyo <legend> es el título. Así, sin
 * código extra, el lector de pantalla lo anuncia como grupo ("Sexo, grupo
 * de opciones, Hembra, 1 de 2") y las flechas del teclado cambian la opción.
 *
 * - leyenda: título del grupo, visible (obligatorio).
 * - opciones: [{ valor, texto }].
 * - valor: valor elegido ('' o null si ninguno).
 * - alCambiar(valor): se llama al elegir otra opción.
 * - variante: 'segmentada' (en fila, por defecto) o 'vertical' (una debajo
 *   de otra, para textos largos).
 * - ayuda, error: como en CampoTexto.
 * - ref: va al primer botón de opción, para poder llevar el foco al grupo
 *   (por ejemplo, cuando tiene un error).
 */
function GrupoOpciones({
  leyenda,
  opciones,
  valor,
  alCambiar,
  variante = 'segmentada',
  ayuda,
  error,
  ref,
  className = '',
}) {
  const nombre = useId()
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined
  const idError = error ? `${nombre}-error` : undefined
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  const clases = [
    'grupo-opciones',
    `grupo-opciones--${variante}`,
    error && 'grupo-opciones--error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <fieldset className={clases} aria-describedby={descripcion}>
      <legend className="grupo-opciones__leyenda">{leyenda}</legend>

      <div className="grupo-opciones__opciones">
        {opciones.map((opcion, indice) => (
          <label key={opcion.valor} className="grupo-opciones__opcion">
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              checked={valor === opcion.valor}
              onChange={() => alCambiar(opcion.valor)}
              className="grupo-opciones__entrada"
              aria-invalid={error ? true : undefined}
              ref={indice === 0 ? ref : undefined}
            />
            <span className="grupo-opciones__texto">{opcion.texto}</span>
          </label>
        ))}
      </div>

      {ayuda && (
        <p id={idAyuda} className="grupo-opciones__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="grupo-opciones__error">
          <CircleAlert size={18} aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  )
}

export default GrupoOpciones
