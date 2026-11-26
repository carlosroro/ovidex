import { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import CampoTexto from './CampoTexto.jsx'
import './CampoBusqueda.css'

/*
 * Buscador: campo con lupa, botón para borrar y, si se pide, botón para
 * cambiar entre el teclado numérico y el de letras del móvil.
 *
 * - etiqueta: nombre del campo para el lector de pantalla (obligatorio).
 *   No se ve, salvo con etiquetaVisible.
 * - valor, alCambiar(texto): texto escrito.
 * - cambioTeclado: muestra el botón "ABC"/"123". El teclado empieza siendo
 *   el numérico (lo más habitual: los últimos dígitos del crotal).
 * - ref: llega al <input> (por ejemplo, para darle el foco desde fuera).
 * El resto de props (placeholder…) van al <input>.
 *
 * inputMode no cambia lo que se puede escribir, solo el teclado que abre el
 * móvil. En un ordenador se puede escribir cualquier cosa en los dos modos.
 */
function CampoBusqueda({
  etiqueta,
  etiquetaVisible = false,
  valor,
  alCambiar,
  cambioTeclado = false,
  className = '',
  ref,
  ...resto
}) {
  const [teclado, setTeclado] = useState(cambioTeclado ? 'numeric' : 'text')
  const campo = useRef(null)

  // El <input> se guarda en "campo" (para los botones de este componente) y
  // también en la ref que llegue de fuera, si llega
  function guardarCampo(elemento) {
    campo.current = elemento
    if (typeof ref === 'function') ref(elemento)
    else if (ref) ref.current = elemento
  }

  function cambiarTeclado() {
    setTeclado((actual) => (actual === 'numeric' ? 'text' : 'numeric'))
    // El móvil solo cambia de teclado al volver a entrar en el campo
    requestAnimationFrame(() => campo.current?.focus())
  }

  function borrar() {
    alCambiar('')
    campo.current?.focus()
  }

  const numerico = teclado === 'numeric'
  const clases = [
    'campo-busqueda',
    cambioTeclado && 'campo-busqueda--con-teclado',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CampoTexto
      {...resto}
      ref={guardarCampo}
      etiqueta={etiqueta}
      etiquetaOculta={!etiquetaVisible}
      icono={Search}
      className={clases}
      value={valor}
      onChange={(evento) => alCambiar(evento.target.value)}
      inputMode={teclado}
      enterKeyHint="search"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      accion={
        <>
          {valor && (
            <button
              type="button"
              className="campo-busqueda__boton"
              aria-label="Borrar búsqueda"
              onClick={borrar}
            >
              <X size={22} aria-hidden="true" />
            </button>
          )}
          {cambioTeclado && (
            <button
              type="button"
              className="campo-busqueda__boton campo-busqueda__teclado"
              aria-label={
                numerico ? 'Usar teclado de letras' : 'Usar teclado numérico'
              }
              onClick={cambiarTeclado}
            >
              {numerico ? 'ABC' : '123'}
            </button>
          )}
        </>
      }
    />
  )
}

export default CampoBusqueda
