import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAnimales } from '../api/animales.js'
import BarraNavegacion from '../componentes/BarraNavegacion.jsx'
import CensoProvider from '../censo/CensoProvider.jsx'
import { CensoContext } from '../censo/contexto.js'
import Rebano from './Rebano.jsx'

vi.mock('../api/animales.js', () => ({ listarAnimales: vi.fn() }))

// Animal de prueba (crotales ES 0000 0000 00NN); cada caso cambia lo que necesita
function animal(numero, cambios = {}) {
  return {
    id: `id-${numero}`,
    codigo_oficial: `ES${String(numero).padStart(12, '0')}`,
    nombre_o_numero: null,
    sexo: 'hembra',
    reproductor: false,
    fecha_nacimiento: null,
    precision_nacimiento: 'desconocida',
    estado: 'activa',
    ...cambios,
  }
}

const CENSO = [
  animal(1, {
    sexo: 'macho',
    reproductor: true,
    nombre_o_numero: 'Carnero Prueba',
  }),
  animal(2, { estado: 'baja', nombre_o_numero: 'Prueba Baja' }),
  animal(12, { nombre_o_numero: 'Prueba Doce' }),
  animal(47, {
    fecha_nacimiento: '2021-03-14',
    precision_nacimiento: 'exacta',
  }),
  animal(4712, { nombre_o_numero: 'Prueba Siete' }),
]

// Muestra la dirección actual, para comprobar los filtros guardados en ella
function Direccion() {
  const { pathname, search, state } = useLocation()
  return (
    <p data-testid="direccion" data-estado={JSON.stringify(state)}>
      {pathname}
      {search}
    </p>
  )
}

function rutas() {
  return (
    <Routes>
      <Route path="/rebano" element={<Rebano />} />
      <Route path="/rebano/:id" element={<h1>Ficha</h1>} />
      <Route path="/rebano/nuevo" element={<h1>Alta</h1>} />
    </Routes>
  )
}

// Rebaño con un censo falso (sin CensoProvider ni API)
function pintar({ animales = CENSO, estado = 'listo', ruta = '/rebano' } = {}) {
  const censo = {
    animales,
    estado,
    recargar: vi.fn(),
    guardarEnCenso: vi.fn(),
  }

  render(
    <CensoContext value={censo}>
      <MemoryRouter initialEntries={[ruta]}>
        {rutas()}
        <Direccion />
      </MemoryRouter>
    </CensoContext>,
  )

  return censo
}

const direccion = () => screen.getByTestId('direccion').textContent
const tarjetas = () => screen.queryAllByRole('listitem')
const buscador = () => screen.getByLabelText('Buscar por crotal o nombre')

describe('Rebaño', () => {
  beforeEach(() => {
    listarAnimales.mockReset()
  })

  it('al entrar pide el censo', () => {
    const censo = pintar()

    expect(censo.recargar).toHaveBeenCalledTimes(1)
  })

  it('por defecto muestra solo los activos, con el total', () => {
    pintar()

    expect(tarjetas()).toHaveLength(4)
    expect(screen.queryByText('Prueba Baja')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('4 animales')
    expect(screen.getByRole('radio', { name: 'Activas' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Todos' })).toBeChecked()
  })

  it('cada tarjeta muestra nombre, crotal agrupado y etiquetas, y lleva a la ficha', async () => {
    pintar()

    const carnero = screen.getByRole('link', { name: /Carnero Prueba/ })
    expect(carnero).toHaveTextContent('ES 0000 0000 0001')
    expect(within(carnero).getByText('0001').tagName).toBe('STRONG')
    expect(carnero).toHaveTextContent('Macho')
    expect(carnero).toHaveTextContent('Reproductor')

    const sinNombre = screen.getByRole('link', { name: /0047/ })
    expect(sinNombre).toHaveTextContent('Sin nombre')
    expect(sinNombre).toHaveTextContent('años')

    await userEvent.click(carnero)
    expect(direccion()).toBe('/rebano/id-1')
  })

  it('el botón "Alta" lleva al formulario', async () => {
    pintar()

    await userEvent.click(screen.getByRole('link', { name: 'Alta' }))

    expect(direccion()).toBe('/rebano/nuevo')
  })

  it('el buscador usa el teclado numérico y puede cambiar al de letras', async () => {
    pintar()

    expect(buscador()).toHaveAttribute('inputmode', 'numeric')
    await userEvent.click(
      screen.getByRole('button', { name: 'Usar teclado de letras' }),
    )
    expect(buscador()).toHaveAttribute('inputmode', 'text')
  })

  it('filtra al escribir, en el navegador, sin volver a pedir el censo', async () => {
    listarAnimales.mockResolvedValue(CENSO)
    render(
      <MemoryRouter initialEntries={['/rebano']}>
        <CensoProvider>
          {rutas()}
          <Direccion />
        </CensoProvider>
      </MemoryRouter>,
    )
    // Espera a que llegue el censo (antes, el aviso es "Cargando el rebaño…")
    await screen.findByText('Carnero Prueba')
    expect(screen.getByRole('status')).toHaveTextContent('4 animales')

    await userEvent.type(buscador(), '47')

    // Últimos dígitos: …0047 sí, …4712 no
    expect(tarjetas()).toHaveLength(1)
    expect(screen.getByRole('link', { name: /0047/ })).toBeInTheDocument()
    expect(direccion()).toBe('/rebano?buscar=47')
    expect(listarAnimales).toHaveBeenCalledTimes(1)
  })

  it('busca por nombre con el teclado de letras', async () => {
    pintar()

    await userEvent.click(
      screen.getByRole('button', { name: 'Usar teclado de letras' }),
    )
    await userEvent.type(buscador(), 'siete')

    expect(tarjetas()).toHaveLength(1)
    expect(screen.getByText('Prueba Siete')).toBeInTheDocument()
  })

  it('los filtros cambian la lista y quedan en la dirección', async () => {
    pintar()

    await userEvent.click(screen.getByRole('radio', { name: 'Machos' }))
    expect(tarjetas()).toHaveLength(1)
    expect(direccion()).toBe('/rebano?sexo=macho')

    await userEvent.click(screen.getByRole('radio', { name: 'Todos' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Bajas' }))
    expect(tarjetas()).toHaveLength(1)
    expect(screen.getByText('Prueba Baja')).toBeInTheDocument()
    expect(direccion()).toBe('/rebano?estado=baja')
  })

  it('al volver con la dirección guardada, recupera la búsqueda y los filtros', () => {
    pintar({ ruta: '/rebano?buscar=12&sexo=hembra' })

    expect(buscador()).toHaveValue('12')
    expect(screen.getByRole('radio', { name: 'Hembras' })).toBeChecked()
    // Crotales hembra que terminan en 12: …0012 y …4712
    expect(tarjetas()).toHaveLength(2)
    expect(screen.getByText('Prueba Doce')).toBeInTheDocument()
    expect(screen.getByText('Prueba Siete')).toBeInTheDocument()
  })

  it('un filtro desconocido en la dirección usa el valor por defecto', () => {
    pintar({ ruta: '/rebano?sexo=otro' })

    expect(screen.getByRole('radio', { name: 'Todos' })).toBeChecked()
  })

  it('la ficha recibe la búsqueda de la lista para poder volver a ella', async () => {
    pintar({ ruta: '/rebano?buscar=12' })

    await userEvent.click(screen.getByRole('link', { name: /Prueba Doce/ }))

    expect(JSON.parse(screen.getByTestId('direccion').dataset.estado)).toEqual({
      busquedaRebano: 'buscar=12',
    })
  })

  it('borrar la búsqueda vuelve a mostrar todos', async () => {
    pintar({ ruta: '/rebano?buscar=47' })

    await userEvent.click(
      screen.getByRole('button', { name: 'Borrar búsqueda' }),
    )

    expect(tarjetas()).toHaveLength(4)
    expect(direccion()).toBe('/rebano')
  })

  it('pinta de 100 en 100 con "Ver más"', async () => {
    const muchos = Array.from({ length: 150 }, (_, i) => animal(i + 1))
    pintar({ animales: muchos })

    expect(tarjetas()).toHaveLength(100)
    // El total cuenta todos los resultados, no solo los pintados
    expect(screen.getByRole('status')).toHaveTextContent('150 animales')

    await userEvent.click(
      screen.getByRole('button', { name: 'Ver más (50 animales más)' }),
    )

    expect(tarjetas()).toHaveLength(150)
    expect(
      screen.queryByRole('button', { name: /Ver más/ }),
    ).not.toBeInTheDocument()
  })

  it('al cambiar la búsqueda vuelve al primer tramo', async () => {
    const muchos = Array.from({ length: 250 }, (_, i) => animal(i + 1))
    pintar({ animales: muchos })

    await userEvent.click(screen.getByRole('button', { name: /Ver más/ }))
    expect(tarjetas()).toHaveLength(200)

    await userEvent.type(buscador(), '1')
    // Crotales que terminan en 1: 25 (menos de un tramo)
    expect(tarjetas()).toHaveLength(25)

    await userEvent.clear(buscador())
    expect(tarjetas()).toHaveLength(100)
  })

  it('mientras carga por primera vez lo indica', () => {
    pintar({ animales: [], estado: 'cargando' })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando el rebaño…')
  })

  it('con el censo vacío invita a dar de alta', () => {
    pintar({ animales: [] })

    expect(screen.getByText('Todavía no hay animales')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dar de alta' })).toHaveAttribute(
      'href',
      '/rebano/nuevo',
    )
  })

  it('sin resultados lo dice', async () => {
    pintar()

    await userEvent.type(buscador(), '9999')

    expect(
      screen.getByText('Ningún animal coincide con la búsqueda'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 animales')
  })

  it('si no se puede cargar, muestra el error y permite reintentar', async () => {
    const censo = pintar({ animales: [], estado: 'error' })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se puede cargar el rebaño',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    // Una vez al entrar y otra al reintentar
    expect(censo.recargar).toHaveBeenCalledTimes(2)
  })
})

describe('Rutas del rebaño', () => {
  it.each(['/rebano/id-1', '/rebano/nuevo', '/rebano/id-1/editar'])(
    'en %s, "Rebaño" aparece destacado en la barra',
    (ruta) => {
      render(
        <MemoryRouter initialEntries={[ruta]}>
          <BarraNavegacion />
        </MemoryRouter>,
      )

      expect(screen.getByRole('link', { name: 'Rebaño' })).toHaveAttribute(
        'aria-current',
        'page',
      )
    },
  )
})
