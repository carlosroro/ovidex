import './EstadoVacio.css'

/*
 * Mensaje para pantallas o listas que aún no tienen contenido.
 * - icono: componente de icono de lucide-react (opcional).
 * - titulo: frase principal.
 * - children: explicación breve (opcional).
 */
function EstadoVacio({ icono: Icono, titulo, children }) {
  return (
    <div className="estado-vacio">
      {Icono && (
        <div className="estado-vacio__icono">
          <Icono size={32} aria-hidden="true" />
        </div>
      )}
      <h2 className="estado-vacio__titulo">{titulo}</h2>
      {children && <p className="estado-vacio__texto">{children}</p>}
    </div>
  )
}

export default EstadoVacio
