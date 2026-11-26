import './Etiqueta.css'

/*
 * Etiqueta: texto corto en forma de píldora ("Hembra", "5 años", "Baja"…).
 * - variante: 'neutra' (por defecto, solo borde), 'principal' (fondo verde
 *   suave) o 'aviso' (colores de aviso).
 * - pequena: versión más compacta, para listas.
 * Es solo texto: no se puede pulsar.
 */
function Etiqueta({
  variante = 'neutra',
  pequena = false,
  className = '',
  children,
}) {
  const clases = [
    'etiqueta',
    `etiqueta--${variante}`,
    pequena && 'etiqueta--pequena',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={clases}>{children}</span>
}

export default Etiqueta
