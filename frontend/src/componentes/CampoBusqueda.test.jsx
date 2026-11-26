import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import CampoBusqueda from './CampoBusqueda.jsx'

// Buscador con su propio estado, como lo usará una pantalla
function Buscador(props) {
  const [texto, setTexto] = useState('')
  return (
    <CampoBusqueda
      etiqueta="Buscar por crotal o nombre"
      valor={texto}
      alCambiar={setTexto}
      {...props}
    />
  )
}

describe('CampoBusqueda', () => {
  it('tiene nombre accesible aunque la etiqueta no se vea', () => {
    render(<Buscador />)

    expect(screen.getByLabelText('Buscar por crotal o nombre')).toBeVisible()
    expect(screen.getByText('Buscar por crotal o nombre')).toHaveClass(
      'solo-lectores',
    )
  })

  it('con cambio de teclado, empieza con el teclado numérico', () => {
    render(<Buscador cambioTeclado />)

    expect(screen.getByLabelText('Buscar por crotal o nombre')).toHaveAttribute(
      'inputmode',
      'numeric',
    )
  })

  it('el botón cambia al teclado de letras y vuelve al numérico', async () => {
    render(<Buscador cambioTeclado />)
    const campo = screen.getByLabelText('Buscar por crotal o nombre')

    await userEvent.click(
      screen.getByRole('button', { name: 'Usar teclado de letras' }),
    )
    expect(campo).toHaveAttribute('inputmode', 'text')

    await userEvent.click(
      screen.getByRole('button', { name: 'Usar teclado numérico' }),
    )
    expect(campo).toHaveAttribute('inputmode', 'numeric')
  })

  it('sin cambio de teclado, usa el de letras y no muestra el botón', () => {
    render(<Buscador />)

    expect(screen.getByLabelText('Buscar por crotal o nombre')).toHaveAttribute(
      'inputmode',
      'text',
    )
    expect(
      screen.queryByRole('button', { name: /Usar teclado/ }),
    ).not.toBeInTheDocument()
  })

  it('el botón de borrar solo aparece con texto, vacía el campo y deja el foco en él', async () => {
    render(<Buscador />)
    const campo = screen.getByLabelText('Buscar por crotal o nombre')

    expect(
      screen.queryByRole('button', { name: 'Borrar búsqueda' }),
    ).not.toBeInTheDocument()

    await userEvent.type(campo, '47')
    await userEvent.click(
      screen.getByRole('button', { name: 'Borrar búsqueda' }),
    )

    expect(campo).toHaveValue('')
    expect(campo).toHaveFocus()
  })
})
