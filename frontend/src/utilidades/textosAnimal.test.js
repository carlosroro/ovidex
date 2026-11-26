import { describe, expect, it } from 'vitest'
import {
  textoEnlaceAnimal,
  tipoDeAnimal,
  tituloAnimal,
} from './textosAnimal.js'

describe('tipoDeAnimal', () => {
  it.each([
    [{ sexo: 'hembra', reproductor: false }, 'Oveja'],
    [{ sexo: 'macho', reproductor: true }, 'Carnero reproductor'],
    [{ sexo: 'macho', reproductor: false }, 'Macho'],
  ])('%o → "%s"', (animal, esperado) => {
    expect(tipoDeAnimal(animal)).toBe(esperado)
  })
})

describe('tituloAnimal', () => {
  it('usa el nombre o número', () => {
    expect(
      tituloAnimal({
        nombre_o_numero: 'Prueba 7',
        codigo_oficial: 'ES000000000007',
      }),
    ).toBe('Prueba 7')
  })

  it('sin nombre, los últimos 4 dígitos del crotal', () => {
    expect(
      tituloAnimal({ nombre_o_numero: null, codigo_oficial: 'ES000000000123' }),
    ).toBe('…0123')
  })
})

describe('textoEnlaceAnimal', () => {
  it('nombre y últimos dígitos', () => {
    expect(
      textoEnlaceAnimal({
        nombre_o_numero: 'Prueba 5',
        codigo_oficial: 'ES000000000005',
      }),
    ).toBe('Prueba 5 · …0005')
  })

  it('sin nombre, el crotal agrupado', () => {
    expect(
      textoEnlaceAnimal({
        nombre_o_numero: null,
        codigo_oficial: 'ES000000000002',
      }),
    ).toBe('ES 0000 0000 0002')
  })
})
