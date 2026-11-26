import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { SesionContext } from './contexto.js'
import RutaProtegida from './RutaProtegida.jsx'

// Login falso que muestra desde qué dirección se llegó
function LoginFalso() {
  const { state } = useLocation()
  return <h1>Login (desde {state?.desde?.pathname ?? 'ninguna'})</h1>
}

function pintar(
  estado,
  { reintentar = vi.fn(), cerradaPorUsuario = false } = {},
) {
  const valor = {
    estado,
    usuario: null,
    cerradaPorUsuario,
    iniciarSesion: vi.fn(),
    cerrarSesion: vi.fn(),
    reintentar,
  }

  render(
    <SesionContext value={valor}>
      <MemoryRouter initialEntries={['/rebano']}>
        <Routes>
          <Route path="/login" element={<LoginFalso />} />
          <Route element={<RutaProtegida />}>
            <Route path="/rebano" element={<h1>Pantalla de Rebaño</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </SesionContext>,
  )

  return { reintentar }
}

describe('RutaProtegida', () => {
  it('sin sesión lleva al login recordando la dirección pedida', () => {
    pintar('sin-sesion')

    expect(
      screen.getByRole('heading', { name: 'Login (desde /rebano)' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Pantalla de Rebaño')).not.toBeInTheDocument()
  })

  it('si el usuario cerró la sesión, lleva al login sin recordar la dirección', () => {
    pintar('sin-sesion', { cerradaPorUsuario: true })

    expect(
      screen.getByRole('heading', { name: 'Login (desde ninguna)' }),
    ).toBeInTheDocument()
  })

  it('con sesión muestra la pantalla pedida', () => {
    pintar('iniciada')

    expect(
      screen.getByRole('heading', { name: 'Pantalla de Rebaño' }),
    ).toBeInTheDocument()
  })

  it('mientras se comprueba muestra la pantalla de carga, no el login', () => {
    pintar('comprobando')

    expect(screen.getByRole('status')).toHaveTextContent(
      'Comprobando la sesión…',
    )
    expect(screen.queryByText(/Login/)).not.toBeInTheDocument()
  })

  it('sin servidor muestra el error y permite reintentar', async () => {
    const { reintentar } = pintar('error')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se puede conectar con el servidor',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(reintentar).toHaveBeenCalledOnce()
  })
})
