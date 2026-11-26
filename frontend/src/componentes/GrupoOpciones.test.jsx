import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import GrupoOpciones from './GrupoOpciones.jsx'

const OPCIONES = [
  { valor: 'hembra', texto: 'Hembra' },
  { valor: 'macho', texto: 'Macho' },
]

function Sexo({ inicial = '', error }) {
  const [valor, setValor] = useState(inicial)
  return (
    <GrupoOpciones
      leyenda="Sexo"
      opciones={OPCIONES}
      valor={valor}
      alCambiar={setValor}
      error={error}
    />
  )
}

describe('GrupoOpciones', () => {
  it('se anuncia como grupo con su título y sus opciones', () => {
    render(<Sexo />)

    const grupo = screen.getByRole('group', { name: 'Sexo' })
    expect(grupo).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('sin valor no hay ninguna opción elegida', () => {
    render(<Sexo />)

    screen
      .getAllByRole('radio')
      .forEach((opcion) => expect(opcion).not.toBeChecked())
  })

  it('pulsar el texto de una opción la elige', async () => {
    render(<Sexo />)

    await userEvent.click(screen.getByText('Macho'))

    expect(screen.getByRole('radio', { name: 'Macho' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Hembra' })).not.toBeChecked()
  })

  it('las flechas del teclado cambian la opción', async () => {
    render(<Sexo inicial="hembra" />)

    screen.getByRole('radio', { name: 'Hembra' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Macho' })).toBeChecked()
  })

  it('el error se asocia al grupo', () => {
    render(<Sexo error="Elige el sexo." />)

    expect(
      screen.getByRole('group', { name: 'Sexo' }),
    ).toHaveAccessibleDescription('Elige el sexo.')
    expect(screen.getByRole('radio', { name: 'Hembra' })).toBeInvalid()
  })
})
