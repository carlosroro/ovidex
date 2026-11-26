/*
 * Cliente de la API de Ovidex. Todas las pantallas hablan con Laravel a
 * través de peticion(), que se encarga de:
 * - enviar y recibir JSON;
 * - la protección CSRF (cookie XSRF-TOKEN → cabecera X-XSRF-TOKEN);
 * - un tiempo máximo de espera;
 * - avisar cuando el servidor dice que la sesión ha caducado.
 *
 * Regla importante (pensando en el uso sin conexión de la fase 2): la sesión
 * solo se da por caducada si el servidor responde 401 o 419. Un fallo de red,
 * un tiempo agotado o un error del servidor (5xx) NUNCA sacan al usuario.
 */

export const ESPERA_MAXIMA_MS = 15000

const RUTA_TOKEN_CSRF = '/api/sanctum/csrf-cookie'
const METODOS_QUE_MODIFICAN = ['POST', 'PUT', 'PATCH', 'DELETE']

/*
 * Error de una petición a la API.
 * - tipo: 'red' (no hubo respuesta: sin conexión o tiempo agotado) o 'http'
 *   (el servidor respondió con un código de error).
 * - estado: código HTTP (solo en 'http').
 * - datos: JSON de la respuesta, si lo había (por ejemplo { message }).
 */
export class ErrorApi extends Error {
  constructor({ tipo, estado = null, datos = null, causa }) {
    super(
      tipo === 'red'
        ? 'No se puede conectar con el servidor'
        : (datos?.message ?? `Error ${estado} del servidor`),
      { cause: causa },
    )
    this.name = 'ErrorApi'
    this.tipo = tipo
    this.estado = estado
    this.datos = datos
  }
}

// Función a la que se avisa cuando la sesión caduca (la registra la sesión)
let avisarSesionPerdida = null

/*
 * Registra la función que se llama cuando el servidor dice que la sesión
 * ha caducado. Devuelve una función para dejar de recibir el aviso.
 */
export function alPerderSesion(funcion) {
  avisarSesionPerdida = funcion
  return () => {
    if (avisarSesionPerdida === funcion) avisarSesionPerdida = null
  }
}

/*
 * Hace una petición a la API y devuelve el JSON de la respuesta
 * (o null si no tiene contenido). Si algo va mal, lanza un ErrorApi.
 * - metodo: 'GET' (por defecto), 'POST', 'PUT', 'PATCH' o 'DELETE'.
 * - cuerpo: datos que se envían como JSON (opcional).
 * - avisarSiCaduca: false para no avisar de sesión perdida ante un 401
 *   (por ejemplo, en el propio login o al comprobar si hay sesión).
 */
export async function peticion(
  ruta,
  { metodo = 'GET', cuerpo, avisarSiCaduca = true } = {},
) {
  let respuesta = await enviar(ruta, metodo, cuerpo)

  // 419: el token CSRF ha caducado. Se pide uno nuevo y se repite una vez.
  // Pasa, por ejemplo, cuando la sesión normal caducó y la cookie
  // "recordarme" ha creado otra: el usuario sigue identificado.
  if (respuesta.status === 419) {
    await pedirTokenCsrf()
    respuesta = await enviar(ruta, metodo, cuerpo)
  }

  if (respuesta.ok) {
    return respuesta.status === 204 ? null : leerJson(respuesta)
  }

  // Solo el servidor puede decir que la sesión ha caducado: 401, o un 419
  // que se repite tras renovar el token.
  const sesionCaducada = respuesta.status === 401 || respuesta.status === 419
  if (sesionCaducada && avisarSiCaduca) avisarSesionPerdida?.()

  throw new ErrorApi({
    tipo: 'http',
    estado: respuesta.status,
    datos: await leerJson(respuesta),
  })
}

// Envía una petición. Un fallo de red o un tiempo agotado se convierten
// en un ErrorApi de tipo 'red' (y no avisan de sesión perdida).
async function enviar(ruta, metodo, cuerpo) {
  const cabeceras = { Accept: 'application/json' }

  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'

  if (METODOS_QUE_MODIFICAN.includes(metodo)) {
    if (!leerCookie('XSRF-TOKEN')) await pedirTokenCsrf()
    const token = leerCookie('XSRF-TOKEN')
    if (token) cabeceras['X-XSRF-TOKEN'] = token
  }

  return conTiempoMaximo(ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  })
}

// Pide a Laravel la cookie XSRF-TOKEN (llega en la respuesta)
async function pedirTokenCsrf() {
  await conTiempoMaximo(RUTA_TOKEN_CSRF, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
}

async function conTiempoMaximo(ruta, opciones) {
  try {
    return await fetch(ruta, {
      ...opciones,
      // Envía las cookies (sesión, XSRF-TOKEN) a nuestro propio origen
      credentials: 'same-origin',
      signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
    })
  } catch (error) {
    throw new ErrorApi({ tipo: 'red', causa: error })
  }
}

// Lee el JSON de una respuesta; si no es JSON, devuelve null
async function leerJson(respuesta) {
  try {
    return await respuesta.json()
  } catch {
    return null
  }
}

// Valor de una cookie del navegador (Laravel la envía codificada)
function leerCookie(nombre) {
  const cookie = document.cookie
    .split('; ')
    .find((parte) => parte.startsWith(`${nombre}=`))

  return cookie ? decodeURIComponent(cookie.slice(nombre.length + 1)) : null
}
