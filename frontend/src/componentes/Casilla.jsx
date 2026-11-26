import './Casilla.css'

/*
 * Casilla de verificación (checkbox) con su texto.
 * La etiqueta envuelve la casilla: pulsar el texto también la marca.
 * El resto de props (checked, onChange, name…) van al <input>.
 */
function Casilla({ children, className = '', ...resto }) {
  return (
    <label className={`casilla ${className}`.trim()}>
      <input type="checkbox" className="casilla__entrada" {...resto} />
      <span>{children}</span>
    </label>
  )
}

export default Casilla
