import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ErrorApi } from '../api/cliente.js'
import { SesionContext } from '../sesion/contexto.js'
import Mas from './Mas.jsx'

function pintarMas(cerrarSesion = vi.fn().mockResolvedValue()) {
  const valor = {
    estado: 'iniciada',
    usuario: { id: '1', nombre: 'Usuario de Prueba', usuario: 'prueba1' },
    iniciarSesion: vi.fn(),
    cerrarSesion,
    reintentar: vi.fn(),
  }

  render(
    <SesionContext value={valor}>
      {/* Más contiene enlaces, que necesitan un router */}
      <MemoryRouter>
        <Mas />
      </MemoryRouter>
    </SesionContext>,
  )

  return { cerrarSesion }
}

describe('Más', () => {
  it('muestra con qué usuario se ha iniciado sesión', () => {
    pintarMas()

    expect(
      screen.getByText('Sesión iniciada como Usuario de Prueba (prueba1)'),
    ).toBeInTheDocument()
  })

  // Que después se muestre el login lo comprueba flujoSesion.test.jsx,
  // con la sesión y las rutas reales
  it('"Cerrar sesión" cierra la sesión sin mostrar errores', async () => {
    const { cerrarSesion } = pintarMas()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(cerrarSesion).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si falla, muestra un aviso y la sesión sigue abierta', async () => {
    pintarMas(vi.fn().mockRejectedValue(new ErrorApi({ tipo: 'red' })))

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se ha podido cerrar la sesión',
    )
    expect(screen.getByRole('heading', { name: 'Más' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeEnabled()
  })

  it('mientras cierra, el botón se desactiva', async () => {
    pintarMas(vi.fn(() => new Promise(() => {})))

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(
      screen.getByRole('button', { name: 'Cerrando sesión…' }),
    ).toBeDisabled()
  })
})
