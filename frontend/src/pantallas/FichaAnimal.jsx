import { useEffect, useState } from 'react'
import {
  Camera,
  ChevronLeft,
  CircleHelp,
  Clock,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { obtenerAnimal } from '../api/animales.js'
import { ErrorApi } from '../api/cliente.js'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import EstadoVacio from '../componentes/EstadoVacio.jsx'
import Etiqueta from '../componentes/Etiqueta.jsx'
import Pestanas from '../componentes/Pestanas.jsx'
import { formatearCrotal } from '../utilidades/crotal.js'
import {
  calcularEdad,
  formatearFecha,
  formatearNacimiento,
} from '../utilidades/fechas.js'
import {
  TEXTOS_ESTADO,
  TEXTOS_ORIGEN,
  TEXTOS_SEXO,
  TEXTOS_TIPO_ELECTRONICO,
  textoEnlaceAnimal,
  tipoDeAnimal,
  tituloAnimal,
} from '../utilidades/textosAnimal.js'
import '../componentes/CabeceraPantalla.css'
import './FichaAnimal.css'

/*
 * Ficha de un animal (/rebano/:id), tipo DNI.
 *
 * El contenido lleva key={id}: al pasar de una ficha a otra (por ejemplo, a
 * la de la madre), React lo crea de nuevo, así que la carga, los errores y la
 * pestaña elegida empiezan de cero sin código extra.
 */
function FichaAnimal() {
  const { id } = useParams()
  return <ContenidoFicha key={id} id={id} />
}

function ContenidoFicha({ id }) {
  const { state } = useLocation()
  // estado: 'cargando' | 'listo' | 'no-existe' | 'error'
  const [carga, setCarga] = useState({ estado: 'cargando', animal: null })
  const [intento, setIntento] = useState(0)
  const [pestana, setPestana] = useState('datos')

  // La búsqueda de Rebaño viaja de pantalla en pantalla (también al ir a la
  // madre o al padre) para que "Rebaño" vuelva a la lista como estaba
  const busquedaRebano = state?.busquedaRebano ?? ''
  const volverA = busquedaRebano ? `/rebano?${busquedaRebano}` : '/rebano'
  const estadoNavegacion = { busquedaRebano }

  useEffect(() => {
    let cancelada = false

    obtenerAnimal(id)
      .then((animal) => {
        if (!cancelada) setCarga({ estado: 'listo', animal })
      })
      .catch((error) => {
        if (cancelada) return
        const noExiste = error instanceof ErrorApi && error.estado === 404
        setCarga({ estado: noExiste ? 'no-existe' : 'error', animal: null })
      })

    return () => {
      cancelada = true
    }
  }, [id, intento])

  function reintentar() {
    setCarga({ estado: 'cargando', animal: null })
    setIntento((n) => n + 1)
  }

  const { animal } = carga

  return (
    <>
      <div className="ficha__barra">
        <Link to={volverA} className="cabecera__volver">
          <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
          Rebaño
        </Link>
        {animal && (
          <Boton
            variante="secundario"
            icono={Pencil}
            to={`/rebano/${animal.id}/editar`}
            state={estadoNavegacion}
          >
            Editar
          </Boton>
        )}
      </div>

      {carga.estado === 'cargando' && (
        <p role="status" className="ficha__cargando">
          Cargando la ficha…
        </p>
      )}

      {carga.estado === 'no-existe' && (
        <>
          <h1 className="solo-lectores">Animal no encontrado</h1>
          <EstadoVacio icono={CircleHelp} titulo="Este animal no existe">
            Puede que la dirección esté mal escrita.
          </EstadoVacio>
          <Boton variante="secundario" to="/rebano" bloque>
            Ir a Rebaño
          </Boton>
        </>
      )}

      {carga.estado === 'error' && (
        <>
          <h1 className="solo-lectores">Ficha del animal</h1>
          <Aviso variante="error" titulo="No se puede cargar la ficha">
            Comprueba que estás en la wifi de casa y que el servidor está
            encendido.
          </Aviso>
          <Boton
            variante="secundario"
            icono={RefreshCw}
            bloque
            onClick={reintentar}
          >
            Reintentar
          </Boton>
        </>
      )}

      {carga.estado === 'listo' && (
        <>
          <TarjetaDni animal={animal} />
          <Pestanas
            etiqueta="Secciones de la ficha"
            seleccionada={pestana}
            alCambiar={setPestana}
            pestanas={[
              {
                id: 'datos',
                texto: 'Datos',
                contenido: (
                  <PestanaDatos
                    animal={animal}
                    estadoNavegacion={estadoNavegacion}
                  />
                ),
              },
              {
                id: 'reproduccion',
                texto: 'Reproducción',
                textoCorto: 'Reproduc.',
                contenido: <Proximamente />,
              },
              { id: 'sanidad', texto: 'Sanidad', contenido: <Proximamente /> },
              {
                id: 'historial',
                texto: 'Historial',
                contenido: <Proximamente />,
              },
            ]}
          />
          <PieModificacion animal={animal} />
        </>
      )}
    </>
  )
}

/*
 * Tarjeta principal: fotos (aún vacías), tipo, nombre, estado, código
 * oficial destacado y etiquetas.
 */
function TarjetaDni({ animal }) {
  const edad = calcularEdad(
    animal.fecha_nacimiento,
    animal.precision_nacimiento,
  )
  const activa = animal.estado === 'activa'

  return (
    <section className="ficha-dni" aria-labelledby="ficha-titulo">
      {/* Las fotos llegarán en otro cambio: de momento, huecos vacíos */}
      <div className="ficha-dni__fotos">
        <HuecoFoto tipo="Cara" />
        <HuecoFoto tipo="Costado" />
      </div>

      <div className="ficha-dni__datos">
        <div className="ficha-dni__cabecera">
          <div className="ficha-dni__nombre">
            <p className="ficha-dni__tipo">{tipoDeAnimal(animal)}</p>
            <h1 id="ficha-titulo">{tituloAnimal(animal)}</h1>
          </div>
          <Etiqueta variante={activa ? 'principal' : 'neutra'}>
            {TEXTOS_ESTADO[animal.estado]}
          </Etiqueta>
        </div>

        <div className="ficha-dni__codigo">
          <p className="ficha-dni__codigo-titulo">Código oficial</p>
          <p className="ficha-dni__codigo-valor">
            {formatearCrotal(animal.codigo_oficial)}
          </p>
        </div>

        <ul className="ficha-dni__etiquetas" aria-label="Resumen">
          <li>
            <Etiqueta>{TEXTOS_SEXO[animal.sexo]}</Etiqueta>
          </li>
          {edad && (
            <li>
              <Etiqueta>{edad}</Etiqueta>
            </li>
          )}
          <li>
            <Etiqueta>
              {TEXTOS_TIPO_ELECTRONICO[animal.tipo_electronico]}
            </Etiqueta>
          </li>
          {animal.reproductor && (
            <li>
              <Etiqueta variante="principal">Reproductor</Etiqueta>
            </li>
          )}
        </ul>
      </div>
    </section>
  )
}

function HuecoFoto({ tipo }) {
  return (
    <div className="ficha-dni__foto">
      <Camera size={32} strokeWidth={1.6} aria-hidden="true" />
      <span>
        <span className="solo-lectores">Foto de {tipo.toLowerCase()}: </span>
        Sin foto
      </span>
      <span className="ficha-dni__foto-tipo" aria-hidden="true">
        {tipo}
      </span>
    </div>
  )
}

/*
 * Pestaña Datos: lista de definición (<dl>), la forma correcta de presentar
 * pares "nombre: valor". Madre y padre son enlaces a sus fichas.
 */
function PestanaDatos({ animal, estadoNavegacion }) {
  const progenitor = (otro) =>
    otro ? (
      <Link to={`/rebano/${otro.id}`} state={estadoNavegacion}>
        {textoEnlaceAnimal(otro)}
      </Link>
    ) : (
      '—'
    )

  const filas = [
    ['Raza', animal.raza || '—'],
    [
      'Nacimiento',
      formatearNacimiento(animal.fecha_nacimiento, animal.precision_nacimiento),
    ],
    ['Origen', TEXTOS_ORIGEN[animal.origen]],
    ['Madre', progenitor(animal.madre)],
    ['Padre', progenitor(animal.padre)],
  ]

  return (
    <div className="ficha-datos">
      <dl className="ficha-datos__lista">
        {filas.map(([nombre, valor]) => (
          <div key={nombre} className="ficha-datos__fila">
            <dt>{nombre}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      {animal.notas && (
        <section className="ficha-datos__notas" aria-labelledby="ficha-notas">
          <h2 id="ficha-notas">Notas</h2>
          <p>{animal.notas}</p>
        </section>
      )}
    </div>
  )
}

function Proximamente() {
  return (
    <EstadoVacio icono={Clock} titulo="Próximamente">
      Esta sección llegará en una próxima versión.
    </EstadoVacio>
  )
}

/*
 * "Modificada por {nombre} · dd/mm/aaaa". Si el usuario ya no existe, solo
 * la fecha.
 */
function PieModificacion({ animal }) {
  const fecha = formatearFecha(animal.updated_at)
  const autor = animal.modificado_por?.nombre

  return (
    <p className="ficha__pie">
      {autor ? `Modificada por ${autor} · ${fecha}` : `Modificada el ${fecha}`}
    </p>
  )
}

export default FichaAnimal
