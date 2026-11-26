import Etiqueta from '../componentes/Etiqueta.jsx'
import Tarjeta from '../componentes/Tarjeta.jsx'
import { formatearCrotal } from '../utilidades/crotal.js'
import { calcularEdad } from '../utilidades/fechas.js'
import { TEXTOS_SEXO } from '../utilidades/textosAnimal.js'
import './TarjetaAnimal.css'

/*
 * Un animal en la lista del rebaño: enlace a su ficha con su nombre o número,
 * el crotal agrupado (con los últimos 4 dígitos resaltados, que son los que
 * se usan en el día a día) y etiquetas de sexo, reproductor, edad y baja.
 *
 * - estadoNavegacion: se pasa a la ficha (por ejemplo, la búsqueda de la
 *   lista, para que el enlace "Rebaño" de la ficha vuelva a ella).
 */
function TarjetaAnimal({ animal, estadoNavegacion }) {
  const crotal = formatearCrotal(animal.codigo_oficial)
  const edad = calcularEdad(
    animal.fecha_nacimiento,
    animal.precision_nacimiento,
  )

  return (
    <Tarjeta
      to={`/rebano/${animal.id}`}
      state={estadoNavegacion}
      className="tarjeta-animal"
    >
      <p
        className={
          animal.nombre_o_numero
            ? 'tarjeta-animal__nombre'
            : 'tarjeta-animal__nombre tarjeta-animal__nombre--vacio'
        }
      >
        {animal.nombre_o_numero || 'Sin nombre'}
      </p>
      <p className="tarjeta-animal__crotal">
        {crotal.slice(0, -4)}
        <strong>{crotal.slice(-4)}</strong>
      </p>
      <p className="tarjeta-animal__etiquetas">
        <Etiqueta pequena>{TEXTOS_SEXO[animal.sexo]}</Etiqueta>
        {animal.reproductor && (
          <Etiqueta pequena variante="principal">
            Reproductor
          </Etiqueta>
        )}
        {edad && <Etiqueta pequena>{edad}</Etiqueta>}
        {animal.estado === 'baja' && (
          <Etiqueta pequena variante="aviso">
            Baja
          </Etiqueta>
        )}
      </p>
    </Tarjeta>
  )
}

export default TarjetaAnimal
