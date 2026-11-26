import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Pestanas from './Pestanas.jsx'

const PESTANAS = [
  { id: 'datos', texto: 'Datos', contenido: <p>Contenido de datos</p> },
  {
    id: 'reproduccion',
    texto: 'Reproducción',
    textoCorto: 'Reproduc.',
    contenido: <p>Contenido de reproducción</p>,
  },
  { id: 'sanidad', texto: 'Sanidad', contenido: <p>Contenido de sanidad</p> },
]

// Pestañas con su propio estado, como las usará la ficha
function ConPestanas() {
  const [seleccionada, setSeleccionada] = useState('datos')
  return (
    <Pestanas
      etiqueta="Secciones de la ficha"
      pestanas={PESTANAS}
      seleccionada={seleccionada}
      alCambiar={setSeleccionada}
    />
  )
}

describe('Pestanas', () => {
  it('muestra la fila de pestañas con la elegida y su panel', () => {
    render(<ConPestanas />)

    expect(
      screen.getByRole('tablist', { name: 'Secciones de la ficha' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel', { name: 'Datos' })).toHaveTextContent(
      'Contenido de datos',
    )
  })

  it('al pulsar otra pestaña, cambia el panel', async () => {
    render(<ConPestanas />)

    await userEvent.click(screen.getByRole('tab', { name: 'Sanidad' }))

    expect(screen.getByRole('tab', { name: 'Sanidad' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Contenido de sanidad',
    )
  })

  it('solo la pestaña elegida está en el orden del tabulador', () => {
    render(<ConPestanas />)

    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(screen.getByRole('tab', { name: 'Sanidad' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('las flechas mueven el foco y eligen la pestaña, dando la vuelta', async () => {
    render(<ConPestanas />)
    const datos = screen.getByRole('tab', { name: 'Datos' })

    datos.focus()
    await userEvent.keyboard('{ArrowRight}')

    const reproduccion = screen.getByRole('tab', { name: 'Reproducción' })
    expect(reproduccion).toHaveFocus()
    expect(reproduccion).toHaveAttribute('aria-selected', 'true')

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Sanidad' })).toHaveFocus()
  })

  it('Inicio y Fin van a la primera y a la última', async () => {
    render(<ConPestanas />)

    screen.getByRole('tab', { name: 'Datos' }).focus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Sanidad' })).toHaveFocus()

    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveFocus()
  })

  it('con texto corto, el nombre accesible es el texto completo', () => {
    render(<ConPestanas />)

    expect(
      screen.getByRole('tab', { name: 'Reproducción' }),
    ).toBeInTheDocument()
  })
})
