import { useId } from 'react'
import { CircleAlert } from 'lucide-react'
import './CampoTexto.css'

/*
 * Campo de texto con etiqueta visible.
 * - etiqueta: texto de la etiqueta (obligatorio).
 * - ayuda: texto de ayuda bajo el campo (opcional).
 * - error: mensaje de error (opcional); marca el campo como no válido.
 * - accion: elemento que se pinta dentro del recuadro, a la derecha
 *   (opcional; por ejemplo, el botón de mostrar la contraseña).
 * - icono: icono de lucide-react dentro del recuadro, a la izquierda
 *   (opcional; por ejemplo, la lupa del buscador).
 * - etiquetaOculta: la etiqueta no se ve, pero el lector de pantalla la
 *   sigue leyendo (opcional; para campos cuyo uso ya se entiende a la vista).
 * El resto de props (type, value, onChange, placeholder, ref…) van al <input>.
 * La ayuda y el error se enlazan con aria-describedby para que el lector
 * de pantalla los lea al entrar en el campo.
 */
function CampoTexto({
  etiqueta,
  ayuda,
  error,
  accion,
  icono: Icono,
  etiquetaOculta = false,
  id,
  type = 'text',
  className = '',
  ...resto
}) {
  // useId genera un id único, necesario para unir <label> e <input>
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idAyuda = ayuda ? `${idCampo}-ayuda` : undefined
  const idError = error ? `${idCampo}-error` : undefined
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ') || undefined

  const clases = [
    'campo',
    error && 'campo--error',
    accion && 'campo--con-accion',
    Icono && 'campo--con-icono',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={clases}>
      <label
        htmlFor={idCampo}
        className={etiquetaOculta ? 'solo-lectores' : 'campo__etiqueta'}
      >
        {etiqueta}
      </label>
      <div className="campo__recuadro">
        {Icono && (
          <Icono className="campo__icono" size={22} aria-hidden="true" />
        )}
        <input
          id={idCampo}
          type={type}
          className="campo__entrada"
          aria-describedby={descripcion}
          aria-invalid={error ? true : undefined}
          {...resto}
        />
        {accion && <div className="campo__accion">{accion}</div>}
      </div>
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

export default CampoTexto
