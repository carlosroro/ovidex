import { useEffect, useRef, useState } from 'react'
import { CircleAlert, RefreshCw, Save } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import {
  actualizarAnimal,
  crearAnimal,
  obtenerAnimal,
} from '../api/animales.js'
import { ErrorApi } from '../api/cliente.js'
import AreaTexto from '../componentes/AreaTexto.jsx'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import CabeceraPantalla from '../componentes/CabeceraPantalla.jsx'
import CampoTexto from '../componentes/CampoTexto.jsx'
import Casilla from '../componentes/Casilla.jsx'
import GrupoOpciones from '../componentes/GrupoOpciones.jsx'
import BuscadorAnimal from '../censo/BuscadorAnimal.jsx'
import { useCenso } from '../censo/contexto.js'
import { agruparDigitos, extraerDigitos } from '../utilidades/crotal.js'
import { nuevoUuid } from '../utilidades/uuid.js'
import './FormularioAnimal.css'

const OPCIONES_TIPO = [
  { valor: 'bolo', texto: 'Bolo ruminal' },
  { valor: 'crotal_electronico', texto: 'Crotal electrónico' },
  { valor: 'ninguno', texto: 'Ninguno' },
]

const OPCIONES_SEXO = [
  { valor: 'hembra', texto: 'Hembra' },
  { valor: 'macho', texto: 'Macho' },
]

const OPCIONES_PRECISION = [
  { valor: 'exacta', texto: 'Fecha exacta' },
  { valor: 'mes', texto: 'Mes y año' },
  { valor: 'anio', texto: 'Solo el año' },
  { valor: 'desconocida', texto: 'Desconocida' },
]

const OPCIONES_ORIGEN = [
  { valor: 'nacida', texto: 'Nacida en la explotación' },
  { valor: 'comprada', texto: 'Comprada' },
]

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

// Mensaje de error común al mes y al año
const ID_ERROR_MES_ANIO = 'formulario-animal-error-mes-anio'

// Orden de los campos en pantalla: el foco va al primero que tenga error
const ORDEN_CAMPOS = [
  'codigo_oficial',
  'tipo_electronico',
  'nombre_o_numero',
  'sexo',
  'reproductor',
  'raza',
  'precision_nacimiento',
  'fecha_nacimiento',
  'origen',
  'madre_id',
  'padre_id',
  'notas',
]

// Datos de un formulario de alta vacío
const VACIO = {
  digitos: '', // los 12 dígitos del código oficial, sin "ES" ni espacios
  tipo_electronico: '', // sin valor: se elige a conciencia
  nombre_o_numero: '',
  sexo: '',
  reproductor: false,
  raza: '',
  precision_nacimiento: 'exacta',
  fecha: '', // fecha exacta "AAAA-MM-DD"
  mes: '', // "01"…"12", para la precisión de mes
  anio: '', // "AAAA", para las precisiones de mes y de año
  origen: 'nacida',
  madre: null, // { id, codigo_oficial, nombre_o_numero }
  padre: null,
  notas: '',
}

/*
 * Convierte un animal de la API en los datos del formulario.
 */
function datosDesdeAnimal(animal) {
  const [anio = '', mes = ''] = (animal.fecha_nacimiento ?? '').split('-')

  return {
    digitos: extraerDigitos(animal.codigo_oficial),
    tipo_electronico: animal.tipo_electronico,
    nombre_o_numero: animal.nombre_o_numero ?? '',
    sexo: animal.sexo,
    reproductor: animal.reproductor,
    raza: animal.raza ?? '',
    precision_nacimiento: animal.precision_nacimiento,
    fecha:
      animal.precision_nacimiento === 'exacta' ? animal.fecha_nacimiento : '',
    mes,
    anio,
    origen: animal.origen,
    madre: animal.madre ?? null,
    padre: animal.padre ?? null,
    notas: animal.notas ?? '',
  }
}

/*
 * Fecha que se envía a la API, según la precisión: la exacta tal cual, la de
 * mes con el día 1, la de año con el 1 de enero y, si es desconocida, ninguna.
 */
function fechaParaEnviar(datos) {
  switch (datos.precision_nacimiento) {
    case 'exacta':
      return datos.fecha || null
    case 'mes':
      return datos.anio && datos.mes ? `${datos.anio}-${datos.mes}-01` : null
    case 'anio':
      return datos.anio ? `${datos.anio}-01-01` : null
    default:
      return null
  }
}

// Texto opcional: sin espacios sobrantes y null si queda vacío
const textoOpcional = (texto) => texto.trim() || null

/*
 * Datos que se envían a la API (POST o PUT).
 */
function datosParaEnviar(datos) {
  return {
    codigo_oficial: `ES${datos.digitos}`,
    tipo_electronico: datos.tipo_electronico,
    nombre_o_numero: textoOpcional(datos.nombre_o_numero),
    sexo: datos.sexo,
    // Solo un macho puede ser reproductor
    reproductor: datos.sexo === 'macho' && datos.reproductor,
    raza: textoOpcional(datos.raza),
    precision_nacimiento: datos.precision_nacimiento,
    fecha_nacimiento: fechaParaEnviar(datos),
    origen: datos.origen,
    madre_id: datos.madre?.id ?? null,
    padre_id: datos.padre?.id ?? null,
    notas: textoOpcional(datos.notas),
  }
}

/*
 * Comprobación antes de enviar: obligatorios y formato. Lo demás (crotal
 * repetido, sexo de la madre, fecha futura…) lo comprueba la API.
 * Devuelve { campo: mensaje } con los errores encontrados.
 */
function validar(datos) {
  const errores = {}

  if (!datos.digitos) errores.codigo_oficial = 'Escribe el código oficial.'
  else if (datos.digitos.length !== 12)
    errores.codigo_oficial =
      'El código oficial debe ser ES seguido de 12 dígitos.'

  if (!datos.tipo_electronico)
    errores.tipo_electronico = 'Elige el identificador electrónico.'

  if (!datos.sexo) errores.sexo = 'Elige el sexo.'

  const anioValido = /^\d{4}$/.test(datos.anio)
  if (datos.precision_nacimiento === 'exacta' && !datos.fecha)
    errores.fecha_nacimiento = 'Indica la fecha de nacimiento.'
  if (datos.precision_nacimiento === 'mes' && (!datos.mes || !anioValido))
    errores.fecha_nacimiento = 'Indica el mes y el año de nacimiento.'
  if (datos.precision_nacimiento === 'anio' && !anioValido)
    errores.fecha_nacimiento = 'Indica el año de nacimiento (4 cifras).'

  return errores
}

/*
 * Errores de la API (422) por campo: { campo: 'primer mensaje' }.
 */
function erroresDeApi(error) {
  const lista = error?.datos?.errors ?? {}
  return Object.fromEntries(
    Object.entries(lista).map(([campo, mensajes]) => [campo, mensajes[0]]),
  )
}

/*
 * Formulario de alta (/rebano/nuevo) y de edición (/rebano/:id/editar).
 * El contenido lleva key: al pasar de un animal a otro empieza de cero.
 */
function FormularioAnimal() {
  const { id } = useParams()
  return <ContenidoFormulario key={id ?? 'nuevo'} id={id ?? null} />
}

function ContenidoFormulario({ id }) {
  const edicion = id !== null
  const navigate = useNavigate()
  const { state } = useLocation()
  const { guardarEnCenso } = useCenso()

  // La búsqueda de Rebaño viaja con la navegación (ver la ficha)
  const busquedaRebano = state?.busquedaRebano ?? ''
  const estadoNavegacion = { busquedaRebano }
  const volverA = edicion
    ? `/rebano/${id}`
    : busquedaRebano
      ? `/rebano?${busquedaRebano}`
      : '/rebano'

  // UUID del animal nuevo: se genera una sola vez por formulario, así un
  // reintento tras un fallo de red envía el mismo (y no duplica el animal)
  const [idNuevo] = useState(() => nuevoUuid())

  // carga: 'cargando' | 'listo' | 'no-existe' | 'error' (solo en edición)
  const [carga, setCarga] = useState(edicion ? 'cargando' : 'listo')
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Elementos a los que se puede llevar el foco, por campo
  const campos = useRef({})
  const refCampo = (nombre) => (elemento) => {
    campos.current[nombre] = elemento
  }
  // Se pone a true al detectar errores: tras pintarlos, se enfoca el primero
  const enfocarError = useRef(false)

  // Edición: carga los datos actuales del animal
  useEffect(() => {
    if (!edicion) return
    let cancelada = false

    obtenerAnimal(id)
      .then((animal) => {
        if (cancelada) return
        setDatos(datosDesdeAnimal(animal))
        setCarga('listo')
      })
      .catch((error) => {
        if (cancelada) return
        const noExiste = error instanceof ErrorApi && error.estado === 404
        setCarga(noExiste ? 'no-existe' : 'error')
      })

    return () => {
      cancelada = true
    }
  }, [edicion, id, intento])

  // Después de pintar los errores, el foco va al primer campo con error
  // (así el lector de pantalla lee también el mensaje, ya presente)
  useEffect(() => {
    if (!enfocarError.current) return
    enfocarError.current = false
    const primero = ORDEN_CAMPOS.find((campo) => errores[campo])
    campos.current[primero]?.focus()
  }, [errores])

  // Cambia un dato y quita el error que tuviera ese campo
  function cambiar(cambios, campoError) {
    setDatos((actuales) => ({ ...actuales, ...cambios }))
    if (campoError && errores[campoError]) {
      setErrores(({ [campoError]: _quitado, ...resto }) => resto)
    }
  }

  // Fecha exacta: se guardan también año y mes, para conservarlos si
  // después se cambia a "Mes y año" o "Solo el año"
  function cambiarFechaExacta(fecha) {
    const [anio = '', mes = ''] = fecha.split('-')
    cambiar({ fecha, anio, mes }, 'fecha_nacimiento')
  }

  function mostrarErrores(nuevos) {
    enfocarError.current = true
    setErrores(nuevos)
  }

  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return
    setErrorGeneral(null)

    const locales = validar(datos)
    if (Object.keys(locales).length > 0) {
      mostrarErrores(locales)
      return
    }

    setErrores({})
    setGuardando(true)

    try {
      const cuerpo = datosParaEnviar(datos)
      const animal = edicion
        ? await actualizarAnimal(id, cuerpo)
        : await crearAnimal({ id: idNuevo, ...cuerpo })

      guardarEnCenso(animal)
      // replace: el botón atrás desde la ficha no vuelve al formulario
      navigate(`/rebano/${animal.id}`, {
        replace: true,
        state: estadoNavegacion,
      })
    } catch (error) {
      setGuardando(false)

      if (error instanceof ErrorApi && error.estado === 422) {
        const porCampo = erroresDeApi(error)
        const visibles = Object.fromEntries(
          Object.entries(porCampo).filter(([c]) => ORDEN_CAMPOS.includes(c)),
        )
        const otros = Object.entries(porCampo).filter(
          ([c]) => !ORDEN_CAMPOS.includes(c),
        )
        if (otros.length > 0) setErrorGeneral(otros[0][1])
        if (Object.keys(visibles).length > 0) mostrarErrores(visibles)
        return
      }

      setErrorGeneral(
        error instanceof ErrorApi && error.tipo === 'red'
          ? 'No se puede conectar con el servidor. Lo escrito sigue aquí: vuelve a intentarlo.'
          : 'No se ha podido guardar. Vuelve a intentarlo.',
      )
    }
  }

  const titulo = edicion ? 'Editar animal' : 'Alta de animal'
  const cabecera = (
    <CabeceraPantalla
      titulo={titulo}
      volverA={volverA}
      textoVolver={edicion ? 'Ficha' : 'Rebaño'}
      estadoVolver={estadoNavegacion}
    />
  )

  if (carga === 'cargando') {
    return (
      <>
        {cabecera}
        <p role="status" className="formulario-animal__aviso">
          Cargando los datos…
        </p>
      </>
    )
  }

  if (carga === 'no-existe' || carga === 'error') {
    return (
      <>
        {cabecera}
        {carga === 'no-existe' ? (
          <Aviso variante="error" titulo="Este animal no existe" />
        ) : (
          <>
            <Aviso variante="error" titulo="No se pueden cargar los datos">
              Comprueba que estás en la wifi de casa y que el servidor está
              encendido.
            </Aviso>
            <Boton
              variante="secundario"
              icono={RefreshCw}
              bloque
              onClick={() => {
                setCarga('cargando')
                setIntento((n) => n + 1)
              }}
            >
              Reintentar
            </Boton>
          </>
        )}
      </>
    )
  }

  const precision = datos.precision_nacimiento
  const errorFecha = errores.fecha_nacimiento

  return (
    <>
      {cabecera}

      {/* noValidate: los errores los muestra la app, no el navegador */}
      <form className="formulario-animal" onSubmit={guardar} noValidate>
        <CampoTexto
          ref={refCampo('codigo_oficial')}
          etiqueta="Código oficial (obligatorio)"
          ayuda="Los 12 dígitos del crotal, después de ES."
          icono={PrefijoEs}
          className="formulario-animal__crotal"
          inputMode="numeric"
          autoComplete="off"
          value={agruparDigitos(datos.digitos)}
          onChange={(e) =>
            cambiar(
              { digitos: extraerDigitos(e.target.value) },
              'codigo_oficial',
            )
          }
          error={errores.codigo_oficial}
        />

        <GrupoOpciones
          ref={refCampo('tipo_electronico')}
          leyenda="Identificador electrónico (obligatorio)"
          opciones={OPCIONES_TIPO}
          valor={datos.tipo_electronico}
          alCambiar={(valor) =>
            cambiar({ tipo_electronico: valor }, 'tipo_electronico')
          }
          error={errores.tipo_electronico}
        />

        <CampoTexto
          ref={refCampo('nombre_o_numero')}
          etiqueta="Nombre o número"
          ayuda="Opcional. El nombre o número que se usa en el día a día."
          maxLength={40}
          value={datos.nombre_o_numero}
          onChange={(e) =>
            cambiar({ nombre_o_numero: e.target.value }, 'nombre_o_numero')
          }
          error={errores.nombre_o_numero}
        />

        <GrupoOpciones
          ref={refCampo('sexo')}
          leyenda="Sexo (obligatorio)"
          opciones={OPCIONES_SEXO}
          valor={datos.sexo}
          alCambiar={(valor) => cambiar({ sexo: valor }, 'sexo')}
          error={errores.sexo}
        />

        {datos.sexo === 'macho' && (
          <div className="formulario-animal__casilla">
            <Casilla
              ref={refCampo('reproductor')}
              checked={datos.reproductor}
              onChange={(e) =>
                cambiar({ reproductor: e.target.checked }, 'reproductor')
              }
            >
              Carnero reproductor
            </Casilla>
            {errores.reproductor && (
              <p className="formulario-animal__error" role="alert">
                <CircleAlert size={18} aria-hidden="true" />
                {errores.reproductor}
              </p>
            )}
          </div>
        )}

        <CampoTexto
          ref={refCampo('raza')}
          etiqueta="Raza"
          ayuda="Opcional."
          maxLength={50}
          value={datos.raza}
          onChange={(e) => cambiar({ raza: e.target.value }, 'raza')}
          error={errores.raza}
        />

        <div className="formulario-animal__fecha">
          <GrupoOpciones
            ref={refCampo('precision_nacimiento')}
            leyenda="Fecha de nacimiento"
            opciones={OPCIONES_PRECISION}
            valor={precision}
            alCambiar={(valor) =>
              cambiar({ precision_nacimiento: valor }, 'fecha_nacimiento')
            }
            error={errores.precision_nacimiento}
          />

          {precision === 'exacta' && (
            <CampoTexto
              ref={refCampo('fecha_nacimiento')}
              etiqueta="Fecha"
              type="date"
              max={hoy()}
              value={datos.fecha}
              onChange={(e) => cambiarFechaExacta(e.target.value)}
              error={errorFecha}
            />
          )}

          {precision === 'mes' && (
            <div className="formulario-animal__mes-anio-bloque">
              <div className="formulario-animal__mes-anio">
                <Selector
                  ref={refCampo('fecha_nacimiento')}
                  etiqueta="Mes"
                  value={datos.mes}
                  onChange={(e) =>
                    cambiar({ mes: e.target.value }, 'fecha_nacimiento')
                  }
                  invalido={Boolean(errorFecha)}
                  aria-describedby={errorFecha ? ID_ERROR_MES_ANIO : undefined}
                >
                  <option value="">Elige…</option>
                  {MESES.map((mes, i) => (
                    <option key={mes} value={String(i + 1).padStart(2, '0')}>
                      {mes}
                    </option>
                  ))}
                </Selector>
                {/* El error va debajo de los dos campos (en la columna del
                    año no cabe); los dos se marcan y lo enlazan */}
                <CampoAnio
                  valor={datos.anio}
                  alCambiar={(anio) => cambiar({ anio }, 'fecha_nacimiento')}
                  className={errorFecha ? 'campo--error' : ''}
                  aria-invalid={errorFecha ? true : undefined}
                  aria-describedby={errorFecha ? ID_ERROR_MES_ANIO : undefined}
                />
              </div>
              {errorFecha && (
                <p id={ID_ERROR_MES_ANIO} className="formulario-animal__error">
                  <CircleAlert size={18} aria-hidden="true" />
                  {errorFecha}
                </p>
              )}
            </div>
          )}

          {precision === 'anio' && (
            <CampoAnio
              ref={refCampo('fecha_nacimiento')}
              valor={datos.anio}
              alCambiar={(anio) => cambiar({ anio }, 'fecha_nacimiento')}
              error={errorFecha}
            />
          )}
        </div>

        <GrupoOpciones
          ref={refCampo('origen')}
          leyenda="Origen (obligatorio)"
          variante="vertical"
          opciones={OPCIONES_ORIGEN}
          valor={datos.origen}
          alCambiar={(valor) => cambiar({ origen: valor }, 'origen')}
          error={errores.origen}
        />

        <BuscadorAnimal
          ref={refCampo('madre_id')}
          etiqueta="Madre"
          sexo="hembra"
          valor={datos.madre}
          alCambiar={(madre) => cambiar({ madre }, 'madre_id')}
          excluir={edicion ? id : null}
          error={errores.madre_id}
        />

        <BuscadorAnimal
          ref={refCampo('padre_id')}
          etiqueta="Padre"
          sexo="macho"
          valor={datos.padre}
          alCambiar={(padre) => cambiar({ padre }, 'padre_id')}
          excluir={edicion ? id : null}
          error={errores.padre_id}
        />

        <AreaTexto
          ref={refCampo('notas')}
          etiqueta="Notas"
          ayuda="Opcional."
          maxLength={2000}
          value={datos.notas}
          onChange={(e) => cambiar({ notas: e.target.value }, 'notas')}
          error={errores.notas}
        />

        {errorGeneral && (
          <Aviso variante="error" titulo="No se ha guardado">
            {errorGeneral}
          </Aviso>
        )}

        <div className="formulario-animal__acciones">
          <Boton type="submit" icono={Save} bloque disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Boton>
          <Boton
            variante="secundario"
            to={volverA}
            state={estadoNavegacion}
            bloque
          >
            Cancelar
          </Boton>
        </div>
      </form>
    </>
  )
}

/*
 * "ES" fijo delante de los dígitos. Se pasa a CampoTexto como su "icono":
 * recibe las mismas props que un icono (className, size, aria-hidden).
 */
function PrefijoEs({ className }) {
  return (
    <span
      className={`${className} formulario-animal__prefijo`}
      aria-hidden="true"
    >
      ES
    </span>
  )
}

/*
 * Campo del año (4 cifras, teclado numérico). El resto de props (className,
 * aria-…) van a CampoTexto.
 */
function CampoAnio({ valor, alCambiar, ...resto }) {
  return (
    <CampoTexto
      etiqueta="Año"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      placeholder="AAAA"
      value={valor}
      onChange={(e) => alCambiar(e.target.value.replace(/\D/g, ''))}
      {...resto}
    />
  )
}

/*
 * Lista desplegable (<select>) con el aspecto de CampoTexto.
 */
function Selector({ etiqueta, invalido, children, ref, ...resto }) {
  const id = `selector-${etiqueta.toLowerCase()}`
  return (
    <div className={invalido ? 'campo campo--error' : 'campo'}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <select
        ref={ref}
        id={id}
        className="campo__entrada formulario-animal__selector"
        aria-invalid={invalido || undefined}
        {...resto}
      >
        {children}
      </select>
    </div>
  )
}

// Fecha de hoy "AAAA-MM-DD" (en la zona horaria del móvil)
function hoy() {
  const ahora = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
}

export default FormularioAnimal
