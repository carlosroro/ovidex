import { useId } from 'react'
import { CircleAlert } from 'lucide-react'
import './CampoTexto.css'
import './AreaTexto.css'

/*
 * Campo de texto de varias líneas (<textarea>), por ejemplo para las notas.
 * Funciona igual que CampoTexto y usa sus estilos:
 * - etiqueta (obligatoria), ayuda y error (opcionales).
 * - rows: alto inicial en líneas (4 por defecto); se puede agrandar.
 * El resto de props (value, onChange, maxLength, ref…) van al <textarea>.
 */
function AreaTexto({
  etiqueta,
  ayuda,
  error,
  id,
  rows = 4,
  className = '',
  ...resto
}) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined
  const idError = error ? `${idCampo}-error` : undefined
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  const clases = ['campo', error && 'campo--error', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={clases}>
      <label htmlFor={idCampo} className="campo__etiqueta">
        {etiqueta}
      </label>
      <textarea
        id={idCampo}
        rows={rows}
        className="campo__entrada area-texto"
        aria-describedby={descripcion}
        aria-invalid={error ? true : undefined}
        {...resto}
      />
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="campo__error">
          <CircleAlert size={18} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

export default AreaTexto
