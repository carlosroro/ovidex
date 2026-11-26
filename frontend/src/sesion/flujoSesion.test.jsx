import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import SesionProvider from './SesionProvider.jsx'

/*
 * Pruebas del flujo completo con la sesión, las rutas y las pantallas reales.
 * Solo se simula fetch (las respuestas del servidor, en orden).
 */

const USUARIO = { id: '1', nombre: 'Usuario de Prueba', usuario: 'prueba1' }

function respuesta(estado, datos) {
  return new Response(datos ? JSON.stringify(datos) : null, { status: estado })
}

function pintarApp(ruta, ...respuestas) {
  // Con la cookie CSRF ya puesta, el cliente no la pide antes de cada POST
  document.cookie = 'XSRF-TOKEN=token-de-prueba; path=/'
  const falso = vi.fn()
  respuestas.forEach((r) => falso.mockResolvedValueOnce(r))
  vi.stubGlobal('fetch', falso)

  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <App />
      </SesionProvider>
    </MemoryRouter>,
  )
}

// Peticiones hechas a la API, como "POST /api/login"
const peticionesHechas = () =>
  fetch.mock.calls.map(([ruta, opciones]) => `${opciones.method} ${ruta}`)

async function entrar() {
  const usuarioReal = userEvent.setup()
  await usuarioReal.type(await screen.findByLabelText('Usuario'), 'prueba1')
  await usuarioReal.type(screen.getByLabelText('Contraseña'), 'clave')
  await usuarioReal.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('flujo de sesión', () => {
  it('sin sesión, abrir una sección lleva al login y, tras entrar, a esa sección', async () => {
    pintarApp('/rebano', respuesta(401), respuesta(200, USUARIO))

    await entrar()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rebaño' }),
    ).toBeInTheDocument()
  })

  it('cerrar sesión lleva al login y, al volver a entrar, a Inicio (no a Más)', async () => {
    pintarApp(
      '/mas',
      respuesta(200, USUARIO), // GET /api/usuario al arrancar
      respuesta(204), //          POST /api/logout
      respuesta(200, USUARIO), // POST /api/login
    )

    await userEvent.click(
      await screen.findByRole('button', { name: 'Cerrar sesión' }),
    )
    await entrar()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inicio' }),
    ).toBeInTheDocument()
    expect(peticionesHechas()).toEqual([
      'GET /api/usuario',
      'POST /api/logout',
      'POST /api/login',
    ])
  })
})
