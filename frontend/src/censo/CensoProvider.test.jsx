import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAnimales } from '../api/animales.js'
import { ErrorApi } from '../api/cliente.js'
import CensoProvider from './CensoProvider.jsx'
import { useCenso } from './contexto.js'

// La API se sustituye por una función falsa: no se llama al servidor
vi.mock('../api/animales.js', () => ({ listarAnimales: vi.fn() }))

const animal = (numero, cambios = {}) => ({
  id: `id-${numero}`,
  codigo_oficial: `ES${String(numero).padStart(12, '0')}`,
  ...cambios,
})

/*
 * Promesa que se resuelve o rechaza cuando la prueba lo decide, para poder
 * comprobar qué pasa MIENTRAS una petición está en curso.
 */
function diferida() {
  let resolver, rechazar
  const promesa = new Promise((res, rec) => {
    resolver = res
    rechazar = rec
  })
  return { promesa, resolver, rechazar }
}

// Usa useCenso() dentro de un CensoProvider y devuelve su valor actual
function usarCenso() {
  return renderHook(() => useCenso(), { wrapper: CensoProvider })
}

describe('CensoProvider', () => {
  beforeEach(() => {
    listarAnimales.mockReset()
  })

  it('empieza sin pedir nada', () => {
    const { result } = usarCenso()

    expect(result.current.estado).toBe('inicial')
    expect(result.current.animales).toEqual([])
    expect(listarAnimales).not.toHaveBeenCalled()
  })

  it('la primera carga pasa por "cargando" y después muestra la lista', async () => {
    const peticion = diferida()
    listarAnimales.mockReturnValue(peticion.promesa)
    const { result } = usarCenso()

    act(() => {
      result.current.recargar()
    })
    expect(result.current.estado).toBe('cargando')

    await act(async () => peticion.resolver([animal(1), animal(2)]))

    expect(result.current.estado).toBe('listo')
    expect(result.current.animales).toHaveLength(2)
    expect(listarAnimales).toHaveBeenCalledTimes(1)
  })

  it('al recargar, la lista sigue visible mientras llega la nueva', async () => {
    listarAnimales.mockResolvedValueOnce([animal(1)])
    const { result } = usarCenso()
    await act(() => result.current.recargar())

    const segunda = diferida()
    listarAnimales.mockReturnValueOnce(segunda.promesa)
    act(() => {
      result.current.recargar()
    })

    // En segundo plano: ni "cargando" ni lista vacía
    expect(result.current.estado).toBe('listo')
    expect(result.current.animales).toHaveLength(1)

    await act(async () => segunda.resolver([animal(1), animal(2)]))
    expect(result.current.animales).toHaveLength(2)
  })

  it('una respuesta antigua no pisa a una más nueva', async () => {
    const antigua = diferida()
    const nueva = diferida()
    listarAnimales
      .mockReturnValueOnce(antigua.promesa)
      .mockReturnValueOnce(nueva.promesa)
    const { result } = usarCenso()

    act(() => {
      result.current.recargar()
      result.current.recargar()
    })
    await act(async () => nueva.resolver([animal(1), animal(2)]))
    await act(async () => antigua.resolver([animal(1)]))

    expect(result.current.animales).toHaveLength(2)
  })

  it('guardarEnCenso añade un animal nuevo en su sitio por crotal', async () => {
    listarAnimales.mockResolvedValue([animal(1), animal(3)])
    const { result } = usarCenso()
    await act(() => result.current.recargar())

    act(() => result.current.guardarEnCenso(animal(2)))

    expect(result.current.animales.map((a) => a.id)).toEqual([
      'id-1',
      'id-2',
      'id-3',
    ])
    // Sin volver a pedir la lista
    expect(listarAnimales).toHaveBeenCalledTimes(1)
  })

  it('guardarEnCenso sustituye un animal que ya estaba', async () => {
    listarAnimales.mockResolvedValue([animal(1, { raza: null }), animal(2)])
    const { result } = usarCenso()
    await act(() => result.current.recargar())

    act(() => result.current.guardarEnCenso(animal(1, { raza: 'Raza B' })))

    expect(result.current.animales).toHaveLength(2)
    expect(result.current.animales[0].raza).toBe('Raza B')
  })

  it('guardar durante una recarga lanza otra, que ya incluye el cambio', async () => {
    listarAnimales.mockResolvedValueOnce([animal(1)])
    const { result } = usarCenso()
    await act(() => result.current.recargar())

    const enCurso = diferida()
    listarAnimales
      .mockReturnValueOnce(enCurso.promesa)
      .mockResolvedValueOnce([animal(1), animal(2)])
    act(() => {
      result.current.recargar()
    })

    await act(async () => result.current.guardarEnCenso(animal(2)))
    // La recarga antigua (sin el animal 2) llega tarde y se descarta
    await act(async () => enCurso.resolver([animal(1)]))

    expect(listarAnimales).toHaveBeenCalledTimes(3)
    expect(result.current.animales.map((a) => a.id)).toEqual(['id-1', 'id-2'])
  })

  it('guardar durante la primera carga no la deja en "cargando"', async () => {
    const primera = diferida()
    listarAnimales
      .mockReturnValueOnce(primera.promesa)
      .mockResolvedValueOnce([animal(1), animal(2)])
    const { result } = usarCenso()

    act(() => {
      result.current.recargar()
    })
    await act(async () => result.current.guardarEnCenso(animal(2)))
    await act(async () => primera.resolver([animal(1)]))

    await waitFor(() => expect(result.current.estado).toBe('listo'))
    expect(result.current.animales).toHaveLength(2)
  })

  it('si la primera carga falla por red, el estado es "error"', async () => {
    listarAnimales.mockRejectedValue(new ErrorApi({ tipo: 'red' }))
    const { result } = usarCenso()

    await act(() => result.current.recargar())

    expect(result.current.estado).toBe('error')
  })

  it('tras un error se puede reintentar', async () => {
    listarAnimales
      .mockRejectedValueOnce(new ErrorApi({ tipo: 'red' }))
      .mockResolvedValueOnce([animal(1)])
    const { result } = usarCenso()

    await act(() => result.current.recargar())
    await act(() => result.current.recargar())

    expect(result.current.estado).toBe('listo')
    expect(result.current.animales).toHaveLength(1)
  })

  it('si falla una recarga en segundo plano, se conserva la lista', async () => {
    listarAnimales
      .mockResolvedValueOnce([animal(1)])
      .mockRejectedValueOnce(new ErrorApi({ tipo: 'red' }))
    const { result } = usarCenso()

    await act(() => result.current.recargar())
    await act(() => result.current.recargar())

    expect(result.current.estado).toBe('listo')
    expect(result.current.animales).toHaveLength(1)
  })

  it('useCenso fuera del provider avisa del error', () => {
    // React escribe el error en la consola; se silencia en esta prueba
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useCenso())).toThrow(/CensoProvider/)

    console.error.mockRestore()
  })
})
