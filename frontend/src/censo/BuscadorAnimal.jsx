import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CircleAlert, RefreshCw } from 'lucide-react'
import Boton from '../componentes/Boton.jsx'
import CampoBusqueda from '../componentes/CampoBusqueda.jsx'
import Etiqueta from '../componentes/Etiqueta.jsx'
import MenuInferior from '../componentes/MenuInferior.jsx'
import { formatearCrotal } from '../utilidades/crotal.js'
import { useCenso } from './contexto.js'
import { filtrarAnimales } from './filtrarAnimales.js'
import './BuscadorAnimal.css'

// Resultados que se pintan de cada vez
const TRAMO = 50

/*
 * Campo para elegir otro animal del censo (la madre o el padre).
 *
 * - etiqueta: "Madre" o "Padre" (título del campo).
 * - sexo: 'hembra' o 'macho'; solo se ofrecen animales de ese sexo.
 * - valor: animal elegido { id, codigo_oficial, nombre_o_numero } o null.
 * - alCambiar(animal | null): al elegir o quitar.
 * - excluir: id del animal que se está editando (no puede ser su propia madre).
 * - error: mensaje de error (por ejemplo, el que devuelva la API).
 * - ref: va al botón principal del campo, para poder llevarle el foco.
 *
 * Busca en el censo ya cargado en el navegador (useCenso), con las mismas
 * reglas que Rebaño. Los animales de baja también valen: una oveja muerta
 * sigue siendo la madre.
 */
function BuscadorAnimal({
  etiqueta,
  sexo,
  valor,
  alCambiar,
  excluir = null,
  error,
  ref,
}) {
  const { animales, estado, recargar } = useCenso()
  const [abierto, setAbierto] = useState(false)
  const [buscar, setBuscar] = useState('')
  const [cantidad, setCantidad] = useState(TRAMO)
  const campoBusqueda = useRef(null)
  const botonPrincipal = useRef(null)
  // Tras elegir o quitar, el botón que tenía el foco desaparece: se lleva
  // el foco al botón que lo sustituye ("Cambiar" o "Elegir")
  const enfocarTrasCambio = useRef(false)

  const idTitulo = useId()
  const idError = error ? `${idTitulo}-error` : undefined
  const nombre = etiqueta.toLowerCase()

  const resultados = useMemo(
    () => filtrarAnimales(animales, { buscar, sexo, estado: 'todos', excluir }),
    [animales, buscar, sexo, excluir],
  )
  const visibles = resultados.slice(0, cantidad)

  // Al abrir: búsqueda vacía, foco en el buscador y censo al día
  useEffect(() => {
    if (!abierto) return
    campoBusqueda.current?.focus()
    recargar()
  }, [abierto, recargar])

  useEffect(() => {
    if (enfocarTrasCambio.current) {
      enfocarTrasCambio.current = false
      botonPrincipal.current?.focus()
    }
  })

  // El botón principal se guarda aquí y también en la ref de fuera
  function guardarBoton(elemento) {
    botonPrincipal.current = elemento
    if (typeof ref === 'function') ref(elemento)
    else if (ref) ref.current = elemento
  }

  function abrir() {
    setBuscar('')
    setCantidad(TRAMO)
    setAbierto(true)
  }

  function elegir(animal) {
    const { id, codigo_oficial, nombre_o_numero } = animal
    alCambiar({ id, codigo_oficial, nombre_o_numero })
    setAbierto(false)
    enfocarTrasCambio.current = true
  }

  function quitar() {
    alCambiar(null)
    enfocarTrasCambio.current = true
  }

  return (
    <div
      className={`buscador-animal ${error ? 'buscador-animal--error' : ''}`}
      role="group"
      aria-labelledby={idTitulo}
      aria-describedby={idError}
    >
      <p id={idTitulo} className="buscador-animal__titulo">
        {etiqueta}
      </p>

      {valor ? (
        <div className="buscador-animal__elegido">
          <div className="buscador-animal__datos">
            <span className="buscador-animal__nombre">
              {valor.nombre_o_numero || 'Sin nombre'}
            </span>
            <span className="buscador-animal__crotal">
              {formatearCrotal(valor.codigo_oficial)}
            </span>
          </div>
          <div className="buscador-animal__acciones">
            <Boton
              ref={guardarBoton}
              variante="secundario"
              onClick={abrir}
              aria-label={`Cambiar ${nombre}`}
            >
              Cambiar
            </Boton>
            <Boton
              variante="secundario"
              onClick={quitar}
              aria-label={`Quitar ${nombre}`}
            >
              Quitar
            </Boton>
          </div>
        </div>
      ) : (
        <Boton ref={guardarBoton} variante="secundario" bloque onClick={abrir}>
          Elegir {nombre}
        </Boton>
      )}

      {error && (
        <p id={idError} className="buscador-animal__error">
          <CircleAlert size={18} aria-hidden="true" />
          {error}
        </p>
      )}

      <MenuInferior
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo={`Elegir ${nombre}`}
      >
        <div className="buscador-animal__menu">
          <CampoBusqueda
            ref={campoBusqueda}
            etiqueta="Buscar por crotal o nombre"
            placeholder="Crotal o nombre"
            valor={buscar}
            alCambiar={(texto) => {
              setBuscar(texto)
              setCantidad(TRAMO)
            }}
            cambioTeclado
          />

          {(estado === 'inicial' || estado === 'cargando') && (
            <p role="status" className="buscador-animal__aviso">
              Cargando el rebaño…
            </p>
          )}

          {estado === 'error' && (
            <>
              <p role="alert" className="buscador-animal__aviso">
                No se puede cargar el rebaño.
              </p>
              <Boton
                variante="secundario"
                icono={RefreshCw}
                bloque
                onClick={recargar}
              >
                Reintentar
              </Boton>
            </>
          )}

          {estado === 'listo' && resultados.length === 0 && (
            <p role="status" className="buscador-animal__aviso">
              {buscar.trim()
                ? 'Ningún animal coincide con la búsqueda.'
                : `No hay ${sexo === 'hembra' ? 'hembras' : 'machos'} en el censo.`}
            </p>
          )}

          {estado === 'listo' && visibles.length > 0 && (
            <ul
              className="buscador-animal__lista"
              aria-label={`Resultados (${resultados.length})`}
            >
              {visibles.map((animal) => (
                <li key={animal.id}>
                  <button
                    type="button"
                    className="buscador-animal__resultado"
                    onClick={() => elegir(animal)}
                  >
                    <span className="buscador-animal__nombre">
                      {animal.nombre_o_numero || 'Sin nombre'}
                    </span>
                    <span className="buscador-animal__crotal">
                      {formatearCrotal(animal.codigo_oficial)}
                    </span>
                    {animal.estado === 'baja' && (
                      <Etiqueta pequena variante="aviso">
                        Baja
                      </Etiqueta>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {estado === 'listo' && resultados.length > visibles.length && (
            <Boton
              variante="secundario"
              bloque
              onClick={() => setCantidad((n) => n + TRAMO)}
            >
              Ver más
            </Boton>
          )}
        </div>
      </MenuInferior>
    </div>
  )
}

export default BuscadorAnimal
