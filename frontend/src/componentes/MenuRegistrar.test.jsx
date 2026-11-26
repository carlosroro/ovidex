import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import BarraNavegacion from './BarraNavegacion.jsx'

function Direccion() {
  const { pathname } = useLocation()
  return <p data-testid="direccion">{pathname}</p>
}

// Barra de navegación real (con su botón "Registrar" y su menú)
function pintar() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="/rebano/nuevo" element={<h1>Alta de animal</h1>} />
      </Routes>
      <BarraNavegacion />
      <Direccion />
    </MemoryRouter>,
  )
}

const direccion = () => screen.getByTestId('direccion').textContent
const botonRegistrar = () => screen.getByRole('button', { name: 'Registrar' })
const menu = () => screen.queryByRole('dialog', { name: 'Registrar' })

async function abrirMenu() {
  await userEvent.click(botonRegistrar())
  return menu()
}

describe('Menú Registrar', () => {
  it('muestra las siete acciones', async () => {
    pintar()

    const abierto = await abrirMenu()

    expect(within(abierto).getAllByRole('listitem')).toHaveLength(7)
  })

  it('"Alta" es un enlace al formulario de alta, sin "Próximamente"', async () => {
    pintar()

    const alta = within(await abrirMenu()).getByRole('link', { name: 'Alta' })

    expect(alta).toHaveAttribute('href', '/rebano/nuevo')
    expect(alta).not.toHaveTextContent('Próximamente')
    expect(alta).not.toHaveAttribute('aria-disabled')
  })

  it('las demás acciones siguen marcadas como "Próximamente"', async () => {
    pintar()

    const abierto = await abrirMenu()

    for (const nombre of [
      'Conteo',
      'Parto',
      'Tratamiento',
      'Baja',
      'Foto',
      'Compra de alimento',
    ]) {
      const accion = within(abierto).getByRole('button', {
        name: `${nombre}, Próximamente`,
      })
      expect(accion).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('pulsar "Alta" cierra el menú y abre el formulario', async () => {
    pintar()

    await userEvent.click(
      within(await abrirMenu()).getByRole('link', { name: 'Alta' }),
    )

    expect(menu()).not.toBeInTheDocument()
    expect(direccion()).toBe('/rebano/nuevo')
    expect(
      screen.getByRole('heading', { name: 'Alta de animal' }),
    ).toBeInTheDocument()
    // Se ha ido a otra pantalla: el foco no vuelve al botón "Registrar"
    expect(botonRegistrar()).not.toHaveFocus()
  })

  it('pulsar "Parto" no hace nada', async () => {
    pintar()

    const abierto = await abrirMenu()
    await userEvent.click(
      within(abierto).getByRole('button', { name: 'Parto, Próximamente' }),
    )

    expect(menu()).toBeInTheDocument()
    expect(direccion()).toBe('/')
  })

  it('"Cerrar" cierra el menú y devuelve el foco a "Registrar"', async () => {
    pintar()

    await userEvent.click(
      within(await abrirMenu()).getByRole('button', { name: 'Cerrar' }),
    )

    expect(menu()).not.toBeInTheDocument()
    expect(botonRegistrar()).toHaveFocus()
  })

  it('tras ir a "Alta", al volver a abrir y cerrar, el foco vuelve a "Registrar"', async () => {
    pintar()
    await userEvent.click(
      within(await abrirMenu()).getByRole('link', { name: 'Alta' }),
    )

    await userEvent.click(
      within(await abrirMenu()).getByRole('button', { name: 'Cerrar' }),
    )

    expect(botonRegistrar()).toHaveFocus()
  })
})
