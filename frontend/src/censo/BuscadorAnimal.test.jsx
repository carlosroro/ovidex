import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BuscadorAnimal from './BuscadorAnimal.jsx'
import { CensoContext } from './contexto.js'

function animal(numero, cambios = {}) {
  return {
    id: `id-${numero}`,
    codigo_oficial: `ES${String(numero).padStart(12, '0')}`,
    nombre_o_numero: null,
    sexo: 'hembra',
    estado: 'activa',
    ...cambios,
  }
}

const CENSO = [
  animal(1, { sexo: 'macho', nombre_o_numero: 'Carnero Prueba' }),
  animal(5, { nombre_o_numero: 'Prueba 5' }),
  animal(9, { estado: 'baja', nombre_o_numero: 'Prueba 9' }),
  animal(12, { nombre_o_numero: 'Prueba 12' }),
  animal(15, { nombre_o_numero: 'Prueba 15' }),
]

// Buscador con su propio estado, como en el formulario
function Campo({ inicial = null, alCambiar = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial)
  return (
    <BuscadorAnimal
      etiqueta="Madre"
      sexo="hembra"
      valor={valor}
      alCambiar={(nuevo) => {
        setValor(nuevo)
        alCambiar(nuevo)
      }}
      {...props}
    />
  )
}

function pintar({ animales = CENSO, estado = 'listo', ...props } = {}) {
  const censo = { animales, estado, recargar: vi.fn(), guardarEnCenso: vi.fn() }
  render(
    <CensoContext value={censo}>
      <Campo {...props} />
    </CensoContext>,
  )
  return censo
}

const dialogo = () => screen.getByRole('dialog', { name: 'Elegir madre' })
const resultados = () =>
  within(dialogo()).queryAllByRole('button', { name: /ES 0000/ })

describe('BuscadorAnimal', () => {
  it('sin elección muestra el botón para elegir', () => {
    pintar()

    expect(screen.getByRole('group', { name: 'Madre' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Elegir madre' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('al abrir, pide el censo y pone el foco en el buscador', async () => {
    const censo = pintar()

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))

    expect(censo.recargar).toHaveBeenCalled()
    expect(
      within(dialogo()).getByLabelText('Buscar por crotal o nombre'),
    ).toHaveFocus()
  })

  it('ofrece solo hembras, también las de baja (marcadas)', async () => {
    pintar()

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))

    expect(resultados()).toHaveLength(4)
    expect(
      within(dialogo()).queryByText('Carnero Prueba'),
    ).not.toBeInTheDocument()
    const deBaja = within(dialogo()).getByRole('button', { name: /Prueba 9/ })
    expect(deBaja).toHaveTextContent('Baja')
  })

  it('el padre ofrece solo machos', async () => {
    pintar({ etiqueta: 'Padre', sexo: 'macho' })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir padre' }))

    const lista = screen.getByRole('dialog', { name: 'Elegir padre' })
    expect(
      within(lista).getAllByRole('button', { name: /ES 0000/ }),
    ).toHaveLength(1)
    expect(within(lista).getByText('Carnero Prueba')).toBeInTheDocument()
  })

  it('no ofrece el propio animal', async () => {
    pintar({ excluir: 'id-15' })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))

    expect(within(dialogo()).queryByText('Prueba 15')).not.toBeInTheDocument()
  })

  it('busca por los últimos dígitos del crotal', async () => {
    pintar()

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))
    await userEvent.type(
      within(dialogo()).getByLabelText('Buscar por crotal o nombre'),
      '12',
    )

    expect(resultados()).toHaveLength(1)
    expect(resultados()[0]).toHaveTextContent('Prueba 12')
  })

  it('elegir un animal lo muestra, cierra el buscador y deja el foco en "Cambiar"', async () => {
    const alCambiar = vi.fn()
    pintar({ alCambiar })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))
    await userEvent.click(
      within(dialogo()).getByRole('button', { name: /Prueba 5/ }),
    )

    expect(alCambiar).toHaveBeenCalledWith({
      id: 'id-5',
      codigo_oficial: 'ES000000000005',
      nombre_o_numero: 'Prueba 5',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const grupo = screen.getByRole('group', { name: 'Madre' })
    expect(grupo).toHaveTextContent('Prueba 5')
    expect(grupo).toHaveTextContent('ES 0000 0000 0005')
    expect(screen.getByRole('button', { name: 'Cambiar madre' })).toHaveFocus()
  })

  it('"Cambiar" vuelve a abrir el buscador', async () => {
    pintar({ inicial: CENSO[1] })

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar madre' }))

    expect(dialogo()).toBeInTheDocument()
  })

  it('"Quitar" deja el campo vacío y el foco en "Elegir"', async () => {
    const alCambiar = vi.fn()
    pintar({ inicial: CENSO[1], alCambiar })

    await userEvent.click(screen.getByRole('button', { name: 'Quitar madre' }))

    expect(alCambiar).toHaveBeenCalledWith(null)
    expect(screen.getByRole('button', { name: 'Elegir madre' })).toHaveFocus()
  })

  it('"Cerrar" cierra el buscador sin elegir', async () => {
    const alCambiar = vi.fn()
    pintar({ alCambiar })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))
    await userEvent.click(
      within(dialogo()).getByRole('button', { name: 'Cerrar' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alCambiar).not.toHaveBeenCalled()
  })

  it('sin candidatos lo dice', async () => {
    pintar({ etiqueta: 'Padre', sexo: 'macho', animales: [animal(5)] })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir padre' }))

    expect(screen.getByText('No hay machos en el censo.')).toBeInTheDocument()
  })

  it('mientras carga el censo lo indica', async () => {
    pintar({ animales: [], estado: 'cargando' })

    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))

    expect(within(dialogo()).getByRole('status')).toHaveTextContent(
      'Cargando el rebaño…',
    )
  })

  it('muestra el error que recibe', () => {
    pintar({ error: 'La madre tiene que ser una hembra.' })

    expect(
      screen.getByRole('group', { name: 'Madre' }),
    ).toHaveAccessibleDescription('La madre tiene que ser una hembra.')
  })
})
