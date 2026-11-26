import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CampoTexto from './CampoTexto.jsx'

/*
 * Primera prueba del frontend: comprueba que la configuración de Vitest
 * funciona y, de paso, el comportamiento accesible de CampoTexto.
 */
describe('CampoTexto', () => {
  it('asocia la etiqueta al campo', async () => {
    render(<CampoTexto etiqueta="Usuario" />)

    // getByLabelText solo encuentra el campo si <label> e <input> están unidos
    const campo = screen.getByLabelText('Usuario')
    await userEvent.type(campo, 'prueba1')

    expect(campo).toHaveValue('prueba1')
  })

  it('enlaza la ayuda y el error para que se lean al enfocar el campo', () => {
    render(
      <CampoTexto
        etiqueta="Usuario"
        ayuda="Con este nombre se inicia sesión"
        error="Escribe tu usuario."
      />,
    )

    const campo = screen.getByLabelText('Usuario')
    expect(campo).toHaveAccessibleDescription(
      'Con este nombre se inicia sesión Escribe tu usuario.',
    )
    expect(campo).toHaveAttribute('aria-invalid', 'true')
  })

  it('sin error no marca el campo como no válido', () => {
    render(<CampoTexto etiqueta="Usuario" />)

    expect(screen.getByLabelText('Usuario')).not.toHaveAttribute('aria-invalid')
  })
})
