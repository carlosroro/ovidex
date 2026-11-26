import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alPerderSesion, ErrorApi, peticion } from './cliente.js'

/*
 * Las pruebas sustituyen fetch por una función falsa (vi.fn) que devuelve
 * las respuestas que cada prueba necesita. Así no hace falta el servidor.
 */

// Crea una respuesta falsa con un código y, opcionalmente, un JSON
function respuesta(estado, datos) {
  return new Response(datos === undefined ? null : JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ponerCookie(valor) {
  document.cookie = `XSRF-TOKEN=${valor}; path=/`
}

function borrarCookie() {
  document.cookie = 'XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

// Rutas que se han pedido a fetch, en orden
function rutasPedidas() {
  return fetch.mock.calls.map(([ruta]) => ruta)
}

let sesionPerdida
let dejarDeAvisar

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  sesionPerdida = vi.fn()
  dejarDeAvisar = alPerderSesion(sesionPerdida)
})

afterEach(() => {
  dejarDeAvisar()
  borrarCookie()
  vi.unstubAllGlobals()
})

describe('peticion', () => {
  it('devuelve el JSON de una respuesta correcta', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, { usuario: 'prueba1' }))

    await expect(peticion('/api/usuario')).resolves.toEqual({
      usuario: 'prueba1',
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/usuario',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('devuelve null en una respuesta sin contenido (204)', async () => {
    ponerCookie('token')
    fetch.mockResolvedValueOnce(respuesta(204))

    await expect(peticion('/api/logout', { metodo: 'POST' })).resolves.toBe(
      null,
    )
  })

  it('envía el token CSRF de la cookie en la cabecera X-XSRF-TOKEN', async () => {
    // Laravel envía la cookie codificada ("=" pasa a ser "%3D")
    ponerCookie('token%3D')
    fetch.mockResolvedValueOnce(respuesta(200, {}))

    await peticion('/api/login', { metodo: 'POST', cuerpo: { usuario: 'a' } })

    const [, opciones] = fetch.mock.calls[0]
    expect(opciones.headers['X-XSRF-TOKEN']).toBe('token=')
    expect(opciones.headers['Content-Type']).toBe('application/json')
    expect(opciones.body).toBe('{"usuario":"a"}')
  })

  it('si no hay cookie CSRF, la pide antes de enviar', async () => {
    fetch
      .mockImplementationOnce(async () => {
        ponerCookie('nuevo')
        return respuesta(204)
      })
      .mockResolvedValueOnce(respuesta(200, {}))

    await peticion('/api/login', { metodo: 'POST', cuerpo: {} })

    expect(rutasPedidas()).toEqual(['/api/sanctum/csrf-cookie', '/api/login'])
    expect(fetch.mock.calls[1][1].headers['X-XSRF-TOKEN']).toBe('nuevo')
  })

  it('las peticiones GET no piden ni envían token CSRF', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, {}))

    await peticion('/api/usuario')

    expect(rutasPedidas()).toEqual(['/api/usuario'])
    expect(fetch.mock.calls[0][1].headers['X-XSRF-TOKEN']).toBeUndefined()
  })
})

describe('sesión caducada: solo si el servidor lo dice', () => {
  it('un 401 avisa de sesión perdida y lanza un error http', async () => {
    fetch.mockResolvedValueOnce(respuesta(401, { message: 'Unauthenticated.' }))

    const error = await peticion('/api/usuario').catch((e) => e)

    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ tipo: 'http', estado: 401 })
    expect(sesionPerdida).toHaveBeenCalledOnce()
  })

  it('un 401 no avisa si se pide avisarSiCaduca: false', async () => {
    fetch.mockResolvedValueOnce(respuesta(401))

    await expect(
      peticion('/api/usuario', { avisarSiCaduca: false }),
    ).rejects.toMatchObject({ estado: 401 })
    expect(sesionPerdida).not.toHaveBeenCalled()
  })

  it('un 419 renueva el token y repite la petición una vez, sin avisar', async () => {
    ponerCookie('viejo')
    fetch
      .mockResolvedValueOnce(respuesta(419))
      .mockImplementationOnce(async () => {
        ponerCookie('nuevo')
        return respuesta(204)
      })
      .mockResolvedValueOnce(respuesta(200, { ok: true }))

    await expect(peticion('/api/algo', { metodo: 'POST' })).resolves.toEqual({
      ok: true,
    })

    expect(rutasPedidas()).toEqual([
      '/api/algo',
      '/api/sanctum/csrf-cookie',
      '/api/algo',
    ])
    expect(fetch.mock.calls[2][1].headers['X-XSRF-TOKEN']).toBe('nuevo')
    expect(sesionPerdida).not.toHaveBeenCalled()
  })

  it('si el 419 se repite, avisa de sesión perdida', async () => {
    ponerCookie('token')
    fetch
      .mockResolvedValueOnce(respuesta(419))
      .mockResolvedValueOnce(respuesta(204))
      .mockResolvedValueOnce(respuesta(419))

    await expect(
      peticion('/api/algo', { metodo: 'POST' }),
    ).rejects.toMatchObject({ tipo: 'http', estado: 419 })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(sesionPerdida).toHaveBeenCalledOnce()
  })

  it('un fallo de red lanza un error de red sin avisar', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(peticion('/api/usuario')).rejects.toMatchObject({
      tipo: 'red',
      message: 'No se puede conectar con el servidor',
    })
    expect(sesionPerdida).not.toHaveBeenCalled()
  })

  it('un tiempo de espera agotado lanza un error de red sin avisar', async () => {
    // Es lo que hace fetch cuando vence AbortSignal.timeout()
    fetch.mockRejectedValueOnce(
      new DOMException('Tiempo agotado', 'TimeoutError'),
    )

    await expect(peticion('/api/usuario')).rejects.toMatchObject({
      tipo: 'red',
    })
    expect(sesionPerdida).not.toHaveBeenCalled()
  })

  it('un fallo de red al pedir el token CSRF tampoco avisa', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(
      peticion('/api/login', { metodo: 'POST' }),
    ).rejects.toMatchObject({ tipo: 'red' })
    expect(sesionPerdida).not.toHaveBeenCalled()
  })

  it('un error 500 lanza un error http sin avisar', async () => {
    fetch.mockResolvedValueOnce(respuesta(500, { message: 'Server Error' }))

    await expect(peticion('/api/usuario')).rejects.toMatchObject({
      tipo: 'http',
      estado: 500,
    })
    expect(sesionPerdida).not.toHaveBeenCalled()
  })
})

describe('ErrorApi', () => {
  it('usa el mensaje del servidor si lo hay', async () => {
    fetch.mockResolvedValueOnce(
      respuesta(422, { message: 'Usuario o contraseña incorrectos.' }),
    )
    ponerCookie('token')

    await expect(
      peticion('/api/login', { metodo: 'POST', avisarSiCaduca: false }),
    ).rejects.toMatchObject({
      estado: 422,
      message: 'Usuario o contraseña incorrectos.',
      datos: { message: 'Usuario o contraseña incorrectos.' },
    })
  })
})
