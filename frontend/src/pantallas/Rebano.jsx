import { useEffect, useMemo, useState } from 'react'
import { List, Plus, RefreshCw, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import CampoBusqueda from '../componentes/CampoBusqueda.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'
import GrupoOpciones from '../componentes/GrupoOpciones.jsx'
import { useCenso } from '../censo/contexto.js'
import { filtrarAnimales } from '../censo/filtrarAnimales.js'
import TarjetaAnimal from '../censo/TarjetaAnimal.jsx'
import './Rebano.css'

const OPCIONES_SEXO = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'hembra', texto: 'Hembras' },
  { valor: 'macho', texto: 'Machos' },
]

const OPCIONES_ESTADO = [
  { valor: 'activa', texto: 'Activas' },
  { valor: 'baja', texto: 'Bajas' },
  { valor: 'todos', texto: 'Todas' },
]

// Valor de cada filtro cuando no aparece en la dirección
const POR_DEFECTO = { buscar: '', sexo: 'todos', estado: 'activa' }

// Tarjetas que se pintan de cada vez (ver "Ver más")
const TRAMO = 100

const esOpcion = (opciones, valor) => opciones.some((o) => o.valor === valor)

/*
 * Lee la búsqueda y los filtros de la dirección (/rebano?buscar=47&sexo=macho).
 * Un valor desconocido se cambia por el de por defecto.
 */
function leerFiltros(parametros) {
  const sexo = parametros.get('sexo')
  const estado = parametros.get('estado')

  return {
    buscar: parametros.get('buscar') ?? POR_DEFECTO.buscar,
    sexo: esOpcion(OPCIONES_SEXO, sexo) ? sexo : POR_DEFECTO.sexo,
    estado: esOpcion(OPCIONES_ESTADO, estado) ? estado : POR_DEFECTO.estado,
  }
}

const textoTotal = (n) => `${n} ${n === 1 ? 'animal' : 'animales'}`

/*
 * Pantalla Rebaño: lista del censo con buscador y filtros.
 *
 * - La lista sale de useCenso() (todo el censo en memoria) y se filtra en el
 *   navegador a cada tecla, sin pedir nada al servidor.
 * - La búsqueda y los filtros viven en la dirección: al volver de una ficha
 *   con el botón atrás, o al recargar, la lista sigue igual.
 */
function Rebano() {
  const { animales, estado, recargar } = useCenso()
  const [parametros, setParametros] = useSearchParams()
  const { buscar, sexo, estado: filtroEstado } = leerFiltros(parametros)

  // Al entrar, se pide el censo: la primera vez con "Cargando…" y las
  // siguientes en segundo plano (la lista se ve al momento)
  useEffect(() => {
    recargar()
  }, [recargar])

  // Cambia un filtro en la dirección. "replace": escribir en el buscador no
  // llena el historial (el botón atrás no va letra a letra).
  function cambiarFiltro(nombre, valor) {
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (valor === POR_DEFECTO[nombre]) nuevos.delete(nombre)
        else nuevos.set(nombre, valor)
        return nuevos
      },
      { replace: true },
    )
  }

  // useMemo: solo se vuelve a filtrar si cambia la lista o algún filtro
  const resultados = useMemo(
    () => filtrarAnimales(animales, { buscar, sexo, estado: filtroEstado }),
    [animales, buscar, sexo, filtroEstado],
  )

  // Cuántas tarjetas se pintan. Al cambiar la búsqueda o un filtro, se
  // vuelve al primer tramo. La "clave" resume los filtros: si ya no es la
  // misma, el tramo se reinicia aquí mismo, durante el pintado (React lo
  // permite y así no se ve ni un instante la cantidad anterior).
  const clave = `${buscar}|${sexo}|${filtroEstado}`
  const [tramo, setTramo] = useState({ clave, cantidad: TRAMO })
  if (tramo.clave !== clave) setTramo({ clave, cantidad: TRAMO })
  const cantidad = tramo.clave === clave ? tramo.cantidad : TRAMO
  const visibles = resultados.slice(0, cantidad)
  const quedan = resultados.length - visibles.length

  const listo = estado === 'listo'

  return (
    <>
      <CabeceraPantalla
        titulo="Rebaño"
        subtitulo={listo ? textoTotal(resultados.length) : undefined}
        accion={
          <Boton to="/rebano/nuevo" icono={Plus}>
            Alta
          </Boton>
        }
      />

      <div className="rebano__controles">
        <CampoBusqueda
          etiqueta="Buscar por crotal o nombre"
          placeholder="Crotal o nombre"
          valor={buscar}
          alCambiar={(texto) => cambiarFiltro('buscar', texto)}
          cambioTeclado
        />
        <div className="rebano__filtros">
          <GrupoOpciones
            leyenda="Sexo"
            opciones={OPCIONES_SEXO}
            valor={sexo}
            alCambiar={(valor) => cambiarFiltro('sexo', valor)}
          />
          <GrupoOpciones
            leyenda="Estado"
            opciones={OPCIONES_ESTADO}
            valor={filtroEstado}
            alCambiar={(valor) => cambiarFiltro('estado', valor)}
          />
        </div>
      </div>

      {/* Anuncia al lector de pantalla cuántos resultados hay al buscar */}
      {listo && (
        <p className="solo-lectores" role="status">
          {textoTotal(resultados.length)}
        </p>
      )}

      {(estado === 'inicial' || estado === 'cargando') && (
        <p role="status" className="rebano__cargando">
          Cargando el rebaño…
        </p>
      )}

      {estado === 'error' && (
        <div className="rebano__error">
          <Aviso variante="error" titulo="No se puede cargar el rebaño">
            Comprueba que estás en la wifi de casa y que el servidor está
            encendido.
          </Aviso>
          <Boton
            variante="secundario"
            icono={RefreshCw}
            bloque
            onClick={recargar}
          >
            Reintentar
          </Boton>
        </div>
      )}

      {listo && animales.length === 0 && (
        <div className="rebano__vacio">
          <EstadoVacio icono={List} titulo="Todavía no hay animales">
            Da de alta el primer animal para empezar el censo.
          </EstadoVacio>
          <Boton to="/rebano/nuevo" icono={Plus} bloque>
            Dar de alta
          </Boton>
        </div>
      )}

      {listo && animales.length > 0 && resultados.length === 0 && (
        <EstadoVacio
          icono={SearchX}
          titulo="Ningún animal coincide con la búsqueda"
        >
          Prueba con otros dígitos o cambia los filtros.
        </EstadoVacio>
      )}

      {listo && visibles.length > 0 && (
        <>
          <ul className="rebano__lista">
            {visibles.map((animal) => (
              <li key={animal.id}>
                {/* La ficha recibe la búsqueda para que "Rebaño" vuelva a ella */}
                <TarjetaAnimal
                  animal={animal}
                  estadoNavegacion={{ busquedaRebano: parametros.toString() }}
                />
              </li>
            ))}
          </ul>

          {quedan > 0 && (
            <Boton
              variante="secundario"
              bloque
              onClick={() => setTramo({ clave, cantidad: cantidad + TRAMO })}
            >
              Ver más ({quedan} {quedan === 1 ? 'animal más' : 'animales más'})
            </Boton>
          )}
        </>
      )}
    </>
  )
}

export default Rebano
