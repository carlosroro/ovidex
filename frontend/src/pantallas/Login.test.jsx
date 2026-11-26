import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ErrorApi } from '../api/cliente.js'
import { SesionContext } from '../sesion/contexto.js'
import Login from './Login.jsx'

/*
 * Pinta el login con una sesión falsa (sin API). Cuando iniciarSesion va
 * bien, la sesión pasa a "iniciada", como hace la de verdad.
 * - iniciarSesion: función falsa que decide si el login va bien o mal.
 * - estado: estado inicial de la sesión.
 * - desde: dirección que se quería abrir antes de ir al login.
 */
function pintarLogin({
  iniciarSesion = vi.fn().mockResolvedValue({}),
  estado = 'sin-sesion',
  desde,
} = {}) {
  function SesionFalsa({ children }) {
    const [estadoActual, setEstado] = useState(estado)
    const valor = {
      estado: estadoActual,
      usuario: null,
      iniciarSesion: async (datos) => {
        await iniciarSesion(datos)
        setEstado('iniciada')
      },
      cerrarSesion: vi.fn(),
      reintentar: vi.fn(),
    }
    return <SesionContext value={valor}>{children}</SesionContext>
  }

  const entrada = desde
    ? { pathname: '/login', state: { desde: { pathname: desde } } }
    : '/login'

  render(
    <MemoryRouter initialEntries={[entrada]}>
      <SesionFalsa>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<h1>Pantalla de Inicio</h1>} />
          <Route path="/rebano" element={<h1>Pantalla de Rebaño</h1>} />
        </Routes>
      </SesionFalsa>
    </MemoryRouter>,
  )

  return { iniciarSesion }
}

const campoUsuario = () => screen.getByLabelText('Usuario')
const campoPassword = () => screen.getByLabelText('Contraseña')
// El botón dice "Entrar" o, mientras envía, "Entrando…"
const botonEntrar = () =>
  screen.getByRole('button', { name: /^(Entrar|Entrando…)$/ })

async function rellenarYEntrar(usuario = 'prueba1', password = 'clave') {
  const usuarioReal = userEvent.setup()
  await usuarioReal.type(campoUsuario(), usuario)
  await usuarioReal.type(campoPassword(), password)
  await usuarioReal.click(botonEntrar())
  return usuarioReal
}

describe('Login', () => {
  it('muestra los campos vacíos, la casilla marcada y el botón Entrar', () => {
    pintarLogin()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ovidex' }),
    ).toBeInTheDocument()
    expect(campoUsuario()).toHaveValue('')
    expect(campoPassword()).toHaveValue('')
    expect(campoPassword()).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('checkbox', {
        name: 'Mantener la sesión en este móvil',
      }),
    ).toBeChecked()
    expect(botonEntrar()).toBeEnabled()
  })

  it('el campo de usuario no pone mayúsculas ni corrige, y permite autocompletar', () => {
    pintarLogin()

    expect(campoUsuario()).toHaveAttribute('autocapitalize', 'none')
    expect(campoUsuario()).toHaveAttribute('autocorrect', 'off')
    expect(campoUsuario()).toHaveAttribute('spellcheck', 'false')
    expect(campoUsuario()).toHaveAttribute('autocomplete', 'username')
    expect(campoPassword()).toHaveAttribute('autocomplete', 'current-password')
  })

  it('el botón del ojo muestra y oculta la contraseña', async () => {
    const usuarioReal = userEvent.setup()
    pintarLogin()
    await usuarioReal.type(campoPassword(), 'secreta')

    await usuarioReal.click(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    )
    expect(campoPassword()).toHaveAttribute('type', 'text')
    const ocultar = screen.getByRole('button', { name: 'Ocultar contraseña' })
    expect(ocultar).toHaveAttribute('aria-pressed', 'true')

    await usuarioReal.click(ocultar)
    expect(campoPassword()).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('con campos vacíos muestra los errores y no envía nada', async () => {
    const { iniciarSesion } = pintarLogin()

    await userEvent.click(botonEntrar())

    expect(screen.getByText('Escribe tu usuario.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(campoUsuario()).toHaveAttribute('aria-invalid', 'true')
    expect(campoUsuario()).toHaveFocus()
    expect(iniciarSesion).not.toHaveBeenCalled()
  })

  it('envía usuario, contraseña y recordar: true por defecto', async () => {
    const { iniciarSesion } = pintarLogin()

    await rellenarYEntrar('  prueba1 ', 'clave-de-prueba')

    expect(iniciarSesion).toHaveBeenCalledWith({
      usuario: 'prueba1',
      password: 'clave-de-prueba',
      recordar: true,
    })
  })

  it('desmarcando la casilla envía recordar: false', async () => {
    const usuarioReal = userEvent.setup()
    const { iniciarSesion } = pintarLogin()

    await usuarioReal.click(
      screen.getByText('Mantener la sesión en este móvil'),
    )
    await rellenarYEntrar()

    expect(iniciarSesion).toHaveBeenCalledWith(
      expect.objectContaining({ recordar: false }),
    )
  })

  it('tras entrar va a Inicio si no se pedía otra pantalla', async () => {
    pintarLogin()

    await rellenarYEntrar()

    expect(
      await screen.findByRole('heading', { name: 'Pantalla de Inicio' }),
    ).toBeInTheDocument()
  })

  it('tras entrar va a la pantalla que se quería abrir', async () => {
    pintarLogin({ desde: '/rebano' })

    await rellenarYEntrar()

    expect(
      await screen.findByRole('heading', { name: 'Pantalla de Rebaño' }),
    ).toBeInTheDocument()
  })

  it('con credenciales incorrectas muestra el mensaje genérico, vacía la contraseña y le da el foco', async () => {
    const iniciarSesion = vi.fn().mockRejectedValue(
      new ErrorApi({
        tipo: 'http',
        estado: 422,
        datos: { message: 'Usuario o contraseña incorrectos.' },
      }),
    )
    pintarLogin({ iniciarSesion })

    await rellenarYEntrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuario o contraseña incorrectos.',
    )
    expect(campoPassword()).toHaveValue('')
    expect(campoPassword()).toHaveFocus()
    expect(campoUsuario()).toHaveValue('prueba1')
    expect(botonEntrar()).toBeEnabled()
  })

  it('con demasiados intentos muestra el tiempo de espera', async () => {
    const iniciarSesion = vi.fn().mockRejectedValue(
      new ErrorApi({
        tipo: 'http',
        estado: 429,
        datos: {
          message: 'Demasiados intentos. Vuelve a intentarlo en 42 segundos.',
        },
      }),
    )
    pintarLogin({ iniciarSesion })

    await rellenarYEntrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Vuelve a intentarlo en 42 segundos.',
    )
  })

  it('sin conexión con el servidor muestra que no se puede conectar', async () => {
    const iniciarSesion = vi
      .fn()
      .mockRejectedValue(new ErrorApi({ tipo: 'red' }))
    pintarLogin({ iniciarSesion })

    await rellenarYEntrar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede conectar con el servidor',
    )
  })

  it('mientras se envía, el botón se desactiva y dice "Entrando…"', async () => {
    // Una promesa que no termina hasta que la prueba lo decide
    let terminar
    const iniciarSesion = vi.fn(
      () => new Promise((resolver) => (terminar = resolver)),
    )
    pintarLogin({ iniciarSesion })

    await rellenarYEntrar()

    expect(botonEntrar()).toBeDisabled()
    expect(botonEntrar()).toHaveTextContent('Entrando…')

    terminar({})
    expect(
      await screen.findByRole('heading', { name: 'Pantalla de Inicio' }),
    ).toBeInTheDocument()
  })

  it('si ya hay sesión, abrir el login lleva a Inicio', () => {
    pintarLogin({ estado: 'iniciada' })

    expect(
      screen.getByRole('heading', { name: 'Pantalla de Inicio' }),
    ).toBeInTheDocument()
  })

  it('mientras se comprueba la sesión no muestra el formulario', () => {
    pintarLogin({ estado: 'comprobando' })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Comprobando la sesión…',
    )
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
  })
})
