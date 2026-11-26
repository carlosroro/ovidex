import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarAnimal,
  crearAnimal,
  obtenerAnimal,
} from '../api/animales.js'
import { ErrorApi } from '../api/cliente.js'
import { CensoContext } from '../censo/contexto.js'
import FormularioAnimal from './FormularioAnimal.jsx'

vi.mock('../api/animales.js', () => ({
  obtenerAnimal: vi.fn(),
  crearAnimal: vi.fn(),
  actualizarAnimal: vi.fn(),
}))

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// Censo para el buscador de madre y padre
const CENSO = [
  {
    id: 'id-1',
    codigo_oficial: 'ES000000000001',
    nombre_o_numero: 'Carnero Prueba',
    sexo: 'macho',
    estado: 'activa',
  },
  {
    id: 'id-5',
    codigo_oficial: 'ES000000000005',
    nombre_o_numero: 'Prueba 5',
    sexo: 'hembra',
    estado: 'activa',
  },
]

// Respuesta de la API para un animal guardado
function animalGuardado(cambios = {}) {
  return {
    id: 'id-15',
    codigo_oficial: 'ES000000000015',
    tipo_electronico: 'bolo',
    nombre_o_numero: 'Prueba 15',
    sexo: 'hembra',
    reproductor: false,
    raza: 'Raza de prueba A',
    fecha_nacimiento: '2021-03-14',
    precision_nacimiento: 'exacta',
    origen: 'nacida',
    estado: 'activa',
    notas: null,
    madre_id: 'id-5',
    padre_id: null,
    madre: {
      id: 'id-5',
      codigo_oficial: 'ES000000000005',
      nombre_o_numero: 'Prueba 5',
    },
    padre: null,
    ...cambios,
  }
}

function Direccion() {
  const { pathname } = useLocation()
  return <p data-testid="direccion">{pathname}</p>
}

function pintar(ruta = '/rebano/nuevo') {
  const censo = {
    animales: CENSO,
    estado: 'listo',
    recargar: vi.fn(),
    guardarEnCenso: vi.fn(),
  }

  render(
    <CensoContext value={censo}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/rebano" element={<h1>Lista</h1>} />
          <Route path="/rebano/nuevo" element={<FormularioAnimal />} />
          <Route path="/rebano/:id" element={<h1>Ficha</h1>} />
          <Route path="/rebano/:id/editar" element={<FormularioAnimal />} />
        </Routes>
        <Direccion />
      </MemoryRouter>
    </CensoContext>,
  )

  return censo
}

const direccion = () => screen.getByTestId('direccion').textContent
const campoCrotal = () => screen.getByLabelText('Código oficial (obligatorio)')
const guardar = () =>
  userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

// Rellena los campos obligatorios (la fecha exacta incluida)
async function rellenarObligatorios() {
  await userEvent.type(campoCrotal(), '000000000001')
  await userEvent.click(screen.getByRole('radio', { name: 'Bolo ruminal' }))
  await userEvent.click(screen.getByRole('radio', { name: 'Hembra' }))
  fireEvent.change(screen.getByLabelText('Fecha'), {
    target: { value: '2021-03-14' },
  })
}

// Cuerpo enviado a crearAnimal en la última llamada
const enviado = () => crearAnimal.mock.lastCall[0]

describe('Formulario de alta', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('muestra los campos con sus valores iniciales', () => {
    pintar()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Alta de animal' }),
    ).toBeInTheDocument()
    expect(campoCrotal()).toHaveValue('')
    expect(campoCrotal()).toHaveAttribute('inputmode', 'numeric')
    const identificador = screen.getByRole('group', {
      name: 'Identificador electrónico (obligatorio)',
    })
    within(identificador)
      .getAllByRole('radio')
      .forEach((opcion) => expect(opcion).not.toBeChecked())
    expect(screen.getByRole('radio', { name: 'Fecha exacta' })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'Nacida en la explotación' }),
    ).toBeChecked()
    expect(
      screen.getByRole('button', { name: 'Elegir madre' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Elegir padre' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Notas')).toBeInTheDocument()
  })

  it('sin rellenar, marca los errores, enfoca el primero y no llama a la API', async () => {
    pintar()

    await guardar()

    expect(campoCrotal()).toHaveAccessibleDescription(
      expect.stringContaining('Escribe el código oficial.'),
    )
    expect(
      screen.getByRole('group', {
        name: 'Identificador electrónico (obligatorio)',
      }),
    ).toHaveAccessibleDescription('Elige el identificador electrónico.')
    expect(
      screen.getByRole('group', { name: 'Sexo (obligatorio)' }),
    ).toHaveAccessibleDescription('Elige el sexo.')
    expect(screen.getByLabelText('Fecha')).toHaveAccessibleDescription(
      'Indica la fecha de nacimiento.',
    )
    expect(campoCrotal()).toHaveFocus()
    expect(crearAnimal).not.toHaveBeenCalled()
  })

  it('el foco va al primer campo con error aunque no sea el crotal', async () => {
    pintar()
    await userEvent.type(campoCrotal(), '000000000001')

    await guardar()

    expect(screen.getByRole('radio', { name: 'Bolo ruminal' })).toHaveFocus()
  })

  it('al corregir un campo, desaparece su error', async () => {
    pintar()
    await guardar()

    await userEvent.click(screen.getByRole('radio', { name: 'Hembra' }))

    expect(screen.queryByText('Elige el sexo.')).not.toBeInTheDocument()
  })

  it('el crotal se muestra agrupado y admite pegar el código completo', async () => {
    pintar()

    await userEvent.click(campoCrotal())
    await userEvent.paste('ES 0000 0000 0001')

    expect(campoCrotal()).toHaveValue('0000 0000 0001')
  })

  it('un crotal con menos de 12 dígitos da error sin llamar a la API', async () => {
    pintar()
    await rellenarObligatorios()
    await userEvent.clear(campoCrotal())
    await userEvent.type(campoCrotal(), '12345678')

    await guardar()

    expect(
      screen.getByText('El código oficial debe ser ES seguido de 12 dígitos.'),
    ).toBeInTheDocument()
    expect(crearAnimal).not.toHaveBeenCalled()
  })

  it('la casilla de reproductor solo aparece con Macho', async () => {
    pintar()

    expect(
      screen.queryByRole('checkbox', { name: 'Carnero reproductor' }),
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Macho' }))
    expect(
      screen.getByRole('checkbox', { name: 'Carnero reproductor' }),
    ).toBeInTheDocument()
  })

  it('marcar reproductor y volver a Hembra lo guarda como no reproductor', async () => {
    crearAnimal.mockResolvedValue(animalGuardado())
    pintar()
    await rellenarObligatorios()

    await userEvent.click(screen.getByRole('radio', { name: 'Macho' }))
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Carnero reproductor' }),
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Hembra' }))
    await guardar()

    expect(
      screen.queryByRole('checkbox', { name: 'Carnero reproductor' }),
    ).not.toBeInTheDocument()
    expect(enviado()).toMatchObject({ sexo: 'hembra', reproductor: false })
  })

  it('alta correcta: UUID nuevo, crotal normalizado, censo actualizado y ficha', async () => {
    const guardado = animalGuardado({ id: 'id-nuevo' })
    crearAnimal.mockResolvedValue(guardado)
    const censo = pintar()
    await rellenarObligatorios()

    await guardar()

    expect(enviado()).toEqual({
      id: expect.stringMatching(UUID_V4),
      codigo_oficial: 'ES000000000001',
      tipo_electronico: 'bolo',
      nombre_o_numero: null,
      sexo: 'hembra',
      reproductor: false,
      raza: null,
      precision_nacimiento: 'exacta',
      fecha_nacimiento: '2021-03-14',
      origen: 'nacida',
      madre_id: null,
      padre_id: null,
      notas: null,
    })
    expect(censo.guardarEnCenso).toHaveBeenCalledWith(guardado)
    expect(direccion()).toBe('/rebano/id-nuevo')
  })

  it('envía los textos opcionales sin espacios sobrantes y la madre elegida', async () => {
    crearAnimal.mockResolvedValue(animalGuardado())
    pintar()
    await rellenarObligatorios()

    await userEvent.type(
      screen.getByLabelText('Nombre o número'),
      '  Prueba 9 ',
    )
    await userEvent.type(screen.getByLabelText('Notas'), 'Nota inventada.')
    await userEvent.click(screen.getByRole('button', { name: 'Elegir madre' }))
    await userEvent.click(screen.getByRole('button', { name: /Prueba 5/ }))
    await guardar()

    expect(enviado()).toMatchObject({
      nombre_o_numero: 'Prueba 9',
      notas: 'Nota inventada.',
      madre_id: 'id-5',
    })
  })

  it('mientras guarda, el botón se desactiva y dice "Guardando…"', async () => {
    crearAnimal.mockReturnValue(new Promise(() => {}))
    pintar()
    await rellenarObligatorios()

    await guardar()

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })

  describe('fecha de nacimiento', () => {
    beforeEach(() => {
      crearAnimal.mockResolvedValue(animalGuardado())
    })

    it('desconocida: sin campos de fecha y se envía sin fecha', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Desconocida' }))
      expect(screen.queryByLabelText('Fecha')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Año')).not.toBeInTheDocument()
      await guardar()

      expect(enviado()).toMatchObject({
        precision_nacimiento: 'desconocida',
        fecha_nacimiento: null,
      })
    })

    it('mes y año: se envía el día 1', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Mes y año' }))
      await userEvent.selectOptions(screen.getByLabelText('Mes'), 'mayo')
      await userEvent.clear(screen.getByLabelText('Año'))
      await userEvent.type(screen.getByLabelText('Año'), '2022')
      await guardar()

      expect(enviado()).toMatchObject({
        precision_nacimiento: 'mes',
        fecha_nacimiento: '2022-05-01',
      })
    })

    it('solo el año: se envía el 1 de enero', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Solo el año' }))
      expect(screen.queryByLabelText('Mes')).not.toBeInTheDocument()
      await userEvent.clear(screen.getByLabelText('Año'))
      await userEvent.type(screen.getByLabelText('Año'), '2020')
      await guardar()

      expect(enviado()).toMatchObject({
        precision_nacimiento: 'anio',
        fecha_nacimiento: '2020-01-01',
      })
    })

    it('al pasar de fecha exacta a mes y año, conserva el mes y el año', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Mes y año' }))

      expect(screen.getByLabelText('Mes')).toHaveDisplayValue('marzo')
      expect(screen.getByLabelText('Año')).toHaveValue('2021')
    })

    it('el año solo admite cifras', async () => {
      pintar()

      await userEvent.click(screen.getByRole('radio', { name: 'Solo el año' }))
      await userEvent.type(screen.getByLabelText('Año'), '20a2')

      expect(screen.getByLabelText('Año')).toHaveValue('202')
    })

    it('mes y año sin rellenar: un solo error, asociado a los dos campos', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Mes y año' }))
      await userEvent.selectOptions(screen.getByLabelText('Mes'), 'Elige…')
      await guardar()

      const mensaje = 'Indica el mes y el año de nacimiento.'
      expect(screen.getAllByText(mensaje)).toHaveLength(1)
      expect(screen.getByLabelText('Mes')).toHaveAccessibleDescription(mensaje)
      expect(screen.getByLabelText('Mes')).toBeInvalid()
      expect(screen.getByLabelText('Año')).toHaveAccessibleDescription(mensaje)
      expect(screen.getByLabelText('Año')).toBeInvalid()
      expect(screen.getByLabelText('Mes')).toHaveFocus()
      expect(crearAnimal).not.toHaveBeenCalled()
    })

    it('un año incompleto da error sin llamar a la API', async () => {
      pintar()
      await rellenarObligatorios()

      await userEvent.click(screen.getByRole('radio', { name: 'Solo el año' }))
      await userEvent.clear(screen.getByLabelText('Año'))
      await userEvent.type(screen.getByLabelText('Año'), '20')
      await guardar()

      expect(screen.getByLabelText('Año')).toHaveAccessibleDescription(
        'Indica el año de nacimiento (4 cifras).',
      )
      expect(screen.getByLabelText('Año')).toHaveFocus()
      expect(crearAnimal).not.toHaveBeenCalled()
    })
  })

  describe('errores al guardar', () => {
    it('un error 422 se muestra en su campo y se enfoca', async () => {
      crearAnimal.mockRejectedValue(
        new ErrorApi({
          tipo: 'http',
          estado: 422,
          datos: {
            message: 'Ya existe un animal con ese código oficial.',
            errors: {
              codigo_oficial: ['Ya existe un animal con ese código oficial.'],
            },
          },
        }),
      )
      pintar()
      await rellenarObligatorios()

      await guardar()

      expect(campoCrotal()).toHaveAccessibleDescription(
        expect.stringContaining('Ya existe un animal con ese código oficial.'),
      )
      expect(campoCrotal()).toHaveFocus()
      expect(direccion()).toBe('/rebano/nuevo')
    })

    it('un error 422 de un campo que no se ve sale en el aviso', async () => {
      crearAnimal.mockRejectedValue(
        new ErrorApi({
          tipo: 'http',
          estado: 422,
          datos: {
            errors: { id: ['Ya existe un animal con ese identificador.'] },
          },
        }),
      )
      pintar()
      await rellenarObligatorios()

      await guardar()

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ya existe un animal con ese identificador.',
      )
    })

    it('sin conexión: aviso, se conservan los datos y se reintenta con el mismo UUID', async () => {
      crearAnimal
        .mockRejectedValueOnce(new ErrorApi({ tipo: 'red' }))
        .mockResolvedValueOnce(animalGuardado({ id: 'id-nuevo' }))
      pintar()
      await rellenarObligatorios()

      await guardar()

      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se puede conectar con el servidor',
      )
      expect(campoCrotal()).toHaveValue('0000 0000 0001')
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()

      await guardar()

      const [primero, segundo] = crearAnimal.mock.calls.map(([d]) => d.id)
      expect(segundo).toBe(primero)
      expect(direccion()).toBe('/rebano/id-nuevo')
    })
  })

  it('"Cancelar" vuelve a Rebaño sin guardar', async () => {
    pintar()

    await userEvent.click(screen.getByRole('link', { name: 'Cancelar' }))

    expect(direccion()).toBe('/rebano')
    expect(crearAnimal).not.toHaveBeenCalled()
  })
})

describe('Formulario de edición', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('carga los datos actuales del animal', async () => {
    obtenerAnimal.mockResolvedValue(animalGuardado())
    pintar('/rebano/id-15/editar')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Editar animal' }),
    ).toBeInTheDocument()
    expect(obtenerAnimal).toHaveBeenCalledWith('id-15')
    expect(await screen.findByDisplayValue('0000 0000 0015')).toBe(
      campoCrotal(),
    )
    expect(screen.getByRole('radio', { name: 'Bolo ruminal' })).toBeChecked()
    expect(screen.getByLabelText('Nombre o número')).toHaveValue('Prueba 15')
    expect(screen.getByLabelText('Fecha')).toHaveValue('2021-03-14')
    expect(screen.getByRole('group', { name: 'Madre' })).toHaveTextContent(
      'Prueba 5',
    )
  })

  it('carga una fecha con precisión de mes en sus campos', async () => {
    obtenerAnimal.mockResolvedValue(
      animalGuardado({
        precision_nacimiento: 'mes',
        fecha_nacimiento: '2021-03-01',
      }),
    )
    pintar('/rebano/id-15/editar')

    expect(await screen.findByLabelText('Mes')).toHaveDisplayValue('marzo')
    expect(screen.getByLabelText('Año')).toHaveValue('2021')
  })

  it('guarda los cambios con actualizarAnimal y abre la ficha', async () => {
    obtenerAnimal.mockResolvedValue(animalGuardado())
    const editado = animalGuardado({ raza: 'Raza de prueba B' })
    actualizarAnimal.mockResolvedValue(editado)
    const censo = pintar('/rebano/id-15/editar')
    const raza = await screen.findByLabelText('Raza')

    await userEvent.clear(raza)
    await userEvent.type(raza, 'Raza de prueba B')
    await guardar()

    expect(actualizarAnimal).toHaveBeenCalledWith(
      'id-15',
      expect.objectContaining({
        codigo_oficial: 'ES000000000015',
        raza: 'Raza de prueba B',
        madre_id: 'id-5',
      }),
    )
    // En la edición no se envía id en el cuerpo
    expect(actualizarAnimal.mock.lastCall[1]).not.toHaveProperty('id')
    expect(crearAnimal).not.toHaveBeenCalled()
    expect(censo.guardarEnCenso).toHaveBeenCalledWith(editado)
    expect(direccion()).toBe('/rebano/id-15')
  })

  it('"Cancelar" vuelve a la ficha', async () => {
    obtenerAnimal.mockResolvedValue(animalGuardado())
    pintar('/rebano/id-15/editar')

    expect(
      await screen.findByRole('link', { name: 'Cancelar' }),
    ).toHaveAttribute('href', '/rebano/id-15')
  })

  it('si el animal no existe, lo dice', async () => {
    obtenerAnimal.mockRejectedValue(
      new ErrorApi({ tipo: 'http', estado: 404, datos: null }),
    )
    pintar('/rebano/id-15/editar')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Este animal no existe',
    )
    expect(
      screen.queryByRole('button', { name: 'Guardar' }),
    ).not.toBeInTheDocument()
  })

  it('sin conexión al cargar, permite reintentar', async () => {
    obtenerAnimal
      .mockRejectedValueOnce(new ErrorApi({ tipo: 'red' }))
      .mockResolvedValueOnce(animalGuardado())
    pintar('/rebano/id-15/editar')

    await userEvent.click(
      await screen.findByRole('button', { name: 'Reintentar' }),
    )

    expect(await screen.findByLabelText('Raza')).toHaveValue('Raza de prueba A')
  })
})
