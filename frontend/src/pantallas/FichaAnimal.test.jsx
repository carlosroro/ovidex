import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerAnimal } from '../api/animales.js'
import { ErrorApi } from '../api/cliente.js'
import FichaAnimal from './FichaAnimal.jsx'

vi.mock('../api/animales.js', () => ({ obtenerAnimal: vi.fn() }))

// Datos inventados con la forma de la respuesta de GET /api/animales/{id}
function animal(cambios = {}) {
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
    padre_id: 'id-1',
    madre: {
      id: 'id-5',
      codigo_oficial: 'ES000000000005',
      nombre_o_numero: 'Prueba 5',
    },
    padre: {
      id: 'id-1',
      codigo_oficial: 'ES000000000001',
      nombre_o_numero: null,
    },
    creado_por: { id: 'u1', nombre: 'Usuario de Prueba Uno' },
    modificado_por: { id: 'u2', nombre: 'Usuario de Prueba Dos' },
    created_at: '2026-11-01T10:00:00+01:00',
    updated_at: '2026-11-20T10:00:00+01:00',
    ...cambios,
  }
}

// Muestra la dirección actual (para comprobar adónde llevan los enlaces)
function Direccion() {
  const { pathname, search } = useLocation()
  return (
    <p data-testid="direccion">
      {pathname}
      {search}
    </p>
  )
}

function pintar({ ruta = '/rebano/id-15', estado } = {}) {
  render(
    <MemoryRouter initialEntries={[{ pathname: ruta, state: estado }]}>
      <Routes>
        <Route path="/rebano" element={<h1>Lista</h1>} />
        <Route path="/rebano/:id" element={<FichaAnimal />} />
        <Route path="/rebano/:id/editar" element={<h1>Editar</h1>} />
      </Routes>
      <Direccion />
    </MemoryRouter>,
  )
}

const direccion = () => screen.getByTestId('direccion').textContent
const titulo = () => screen.findByRole('heading', { level: 1 })

// Valor de una fila de la pestaña Datos ("Raza" → "Raza de prueba A")
function dato(nombre) {
  const termino = screen.getByText(nombre, { selector: 'dt' })
  return termino.nextElementSibling
}

describe('Ficha del animal', () => {
  beforeEach(() => {
    obtenerAnimal.mockReset()
  })

  it('pide el animal de la dirección y lo indica mientras carga', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando la ficha…')
    expect(obtenerAnimal).toHaveBeenCalledWith('id-15')
    expect(await titulo()).toHaveTextContent('Prueba 15')
  })

  it('muestra la tarjeta DNI: tipo, estado, código agrupado y etiquetas', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()

    const tarjeta = (await titulo()).closest('section')
    expect(tarjeta).toHaveTextContent('Oveja')
    expect(within(tarjeta).getByText('Activa')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Código oficial')).toBeInTheDocument()
    expect(within(tarjeta).getByText('ES 0000 0000 0015')).toBeInTheDocument()

    const etiquetas = within(tarjeta).getByRole('list', { name: 'Resumen' })
    expect(etiquetas).toHaveTextContent('Hembra')
    expect(etiquetas).toHaveTextContent('años')
    expect(etiquetas).toHaveTextContent('Bolo ruminal')
  })

  it('los huecos de foto están vacíos', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    expect(
      screen.getByText('Foto de cara:', { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Foto de costado:', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Sin foto')).toHaveLength(2)
  })

  it('sin nombre, el título son los últimos 4 dígitos del crotal', async () => {
    obtenerAnimal.mockResolvedValue(
      animal({ nombre_o_numero: null, codigo_oficial: 'ES000000000123' }),
    )
    pintar()

    expect(await titulo()).toHaveTextContent('…0123')
  })

  it('un carnero reproductor de baja', async () => {
    obtenerAnimal.mockResolvedValue(
      animal({ sexo: 'macho', reproductor: true, estado: 'baja' }),
    )
    pintar()

    const tarjeta = (await titulo()).closest('section')
    expect(tarjeta).toHaveTextContent('Carnero reproductor')
    expect(within(tarjeta).getByText('Baja')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Reproductor')).toBeInTheDocument()
  })

  it('con la fecha desconocida no hay etiqueta de edad', async () => {
    obtenerAnimal.mockResolvedValue(
      animal({ fecha_nacimiento: null, precision_nacimiento: 'desconocida' }),
    )
    pintar()
    await titulo()

    const etiquetas = screen.getByRole('list', { name: 'Resumen' })
    expect(within(etiquetas).getAllByRole('listitem')).toHaveLength(2)
    expect(dato('Nacimiento')).toHaveTextContent('Desconocida')
  })

  it.each([
    ['exacta', '2021-03-14', '14/03/2021', /^\d+ años$/],
    ['mes', '2021-03-01', '03/2021 (aprox.)', /^≈ \d+ años$/],
    ['anio', '2021-01-01', '2021 (aprox.)', /^≈ \d+ años$/],
  ])(
    'nacimiento con precisión %s',
    async (precision, fecha, textoNacimiento, textoEdad) => {
      obtenerAnimal.mockResolvedValue(
        animal({ fecha_nacimiento: fecha, precision_nacimiento: precision }),
      )
      pintar()
      await titulo()

      expect(dato('Nacimiento')).toHaveTextContent(textoNacimiento)
      const etiquetas = screen.getByRole('list', { name: 'Resumen' })
      expect(within(etiquetas).getByText(textoEdad)).toBeInTheDocument()
    },
  )

  it('la pestaña Datos muestra raza, origen, madre, padre y notas', async () => {
    obtenerAnimal.mockResolvedValue(animal({ notas: 'Nota inventada.' }))
    pintar()
    await titulo()

    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(dato('Raza')).toHaveTextContent('Raza de prueba A')
    expect(dato('Origen')).toHaveTextContent('Nacida en la explotación')
    expect(dato('Madre')).toHaveTextContent('Prueba 5 · …0005')
    // El padre no tiene nombre: se muestra su crotal agrupado
    expect(dato('Padre')).toHaveTextContent('ES 0000 0000 0001')
    expect(screen.getByRole('heading', { name: 'Notas' })).toBeInTheDocument()
    expect(screen.getByText('Nota inventada.')).toBeInTheDocument()
  })

  it('sin raza, padre ni notas muestra guiones y no muestra Notas', async () => {
    obtenerAnimal.mockResolvedValue(
      animal({ raza: null, padre: null, padre_id: null }),
    )
    pintar()
    await titulo()

    expect(dato('Raza')).toHaveTextContent('—')
    expect(dato('Padre')).toHaveTextContent('—')
    expect(
      screen.queryByRole('heading', { name: 'Notas' }),
    ).not.toBeInTheDocument()
  })

  it('el enlace a la madre abre su ficha y vuelve a la pestaña Datos', async () => {
    obtenerAnimal.mockResolvedValueOnce(animal()).mockResolvedValueOnce(
      animal({
        id: 'id-5',
        codigo_oficial: 'ES000000000005',
        nombre_o_numero: 'Prueba 5',
        madre: null,
        padre: null,
      }),
    )
    pintar()
    await titulo()
    await userEvent.click(screen.getByRole('tab', { name: 'Sanidad' }))

    // La pestaña Sanidad oculta Datos: se vuelve a Datos para usar el enlace
    await userEvent.click(screen.getByRole('tab', { name: 'Datos' }))
    await userEvent.click(
      screen.getByRole('link', { name: 'Prueba 5 · …0005' }),
    )

    expect(direccion()).toBe('/rebano/id-5')
    expect(obtenerAnimal).toHaveBeenLastCalledWith('id-5')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Prueba 5' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('al cambiar de ficha con otra pestaña elegida, vuelve a Datos', async () => {
    obtenerAnimal
      .mockResolvedValueOnce(animal())
      .mockResolvedValueOnce(
        animal({ id: 'id-5', nombre_o_numero: 'Prueba 5' }),
      )
    pintar()
    await titulo()

    await userEvent.click(screen.getByRole('tab', { name: 'Historial' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Datos' }))
    await userEvent.click(screen.getByRole('link', { name: /Prueba 5/ }))

    await screen.findByRole('heading', { level: 1, name: 'Prueba 5' })
    expect(screen.getByRole('tab', { name: 'Datos' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('las demás pestañas dicen "Próximamente"', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    for (const nombre of ['Reproducción', 'Sanidad', 'Historial']) {
      await userEvent.click(screen.getByRole('tab', { name: nombre }))
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Próximamente')
    }
  })

  it('las pestañas se recorren con las flechas', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    screen.getByRole('tab', { name: 'Datos' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('tab', { name: 'Reproducción' })).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Reproducción' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('el pie dice quién la modificó y cuándo', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    expect(
      screen.getByText('Modificada por Usuario de Prueba Dos · 20/11/2026'),
    ).toBeInTheDocument()
  })

  it('si el usuario ya no existe, el pie solo dice la fecha', async () => {
    obtenerAnimal.mockResolvedValue(animal({ modificado_por: null }))
    pintar()
    await titulo()

    expect(screen.getByText('Modificada el 20/11/2026')).toBeInTheDocument()
  })

  it('"Editar" lleva al formulario de edición', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    await userEvent.click(screen.getByRole('link', { name: 'Editar' }))

    expect(direccion()).toBe('/rebano/id-15/editar')
  })

  it('"Rebaño" vuelve a la lista con la búsqueda que tenía', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar({ estado: { busquedaRebano: 'buscar=15&sexo=hembra' } })
    await titulo()

    await userEvent.click(screen.getByRole('link', { name: 'Rebaño' }))

    expect(direccion()).toBe('/rebano?buscar=15&sexo=hembra')
  })

  it('abierta directamente, "Rebaño" vuelve a la lista sin filtros', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar()
    await titulo()

    expect(screen.getByRole('link', { name: 'Rebaño' })).toHaveAttribute(
      'href',
      '/rebano',
    )
  })

  it('la búsqueda de la lista se conserva al ir a la madre', async () => {
    obtenerAnimal.mockResolvedValue(animal())
    pintar({ estado: { busquedaRebano: 'buscar=15' } })
    await titulo()

    await userEvent.click(
      screen.getByRole('link', { name: 'Prueba 5 · …0005' }),
    )
    await titulo()

    expect(screen.getByRole('link', { name: 'Rebaño' })).toHaveAttribute(
      'href',
      '/rebano?buscar=15',
    )
  })

  it('si el animal no existe, lo dice y ofrece ir a Rebaño', async () => {
    obtenerAnimal.mockRejectedValue(
      new ErrorApi({ tipo: 'http', estado: 404, datos: null }),
    )
    pintar()

    expect(await screen.findByText('Este animal no existe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Rebaño' })).toHaveAttribute(
      'href',
      '/rebano',
    )
    expect(
      screen.queryByRole('link', { name: 'Editar' }),
    ).not.toBeInTheDocument()
  })

  it('sin conexión muestra el error y permite reintentar', async () => {
    obtenerAnimal
      .mockRejectedValueOnce(new ErrorApi({ tipo: 'red' }))
      .mockResolvedValueOnce(animal())
    pintar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede cargar la ficha',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await titulo()).toHaveTextContent('Prueba 15')
    expect(obtenerAnimal).toHaveBeenCalledTimes(2)
  })
})
