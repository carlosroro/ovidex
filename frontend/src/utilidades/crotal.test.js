import { describe, expect, it } from 'vitest'
import {
  agruparDigitos,
  esCrotalValido,
  extraerDigitos,
  formatearCrotal,
  normalizarCrotal,
  ultimosDigitos,
} from './crotal.js'

describe('normalizarCrotal', () => {
  it.each([
    ['ES000000000001', 'ES000000000001'],
    ['ES 0000 0000 0001', 'ES000000000001'],
    ['es 0000 0000 0001', 'ES000000000001'],
    ['  ES000000000001  ', 'ES000000000001'],
    ['ES 0000 0000 0001', 'ES000000000001'],
  ])('"%s" → "%s"', (escrito, esperado) => {
    expect(normalizarCrotal(escrito)).toBe(esperado)
  })

  it('un valor vacío da un texto vacío', () => {
    expect(normalizarCrotal(null)).toBe('')
    expect(normalizarCrotal(undefined)).toBe('')
  })
})

describe('esCrotalValido', () => {
  it('acepta ES + 12 dígitos, también escrito con espacios o en minúsculas', () => {
    expect(esCrotalValido('ES000000000001')).toBe(true)
    expect(esCrotalValido('es 0000 0000 0001')).toBe(true)
  })

  it.each(['ES 0000 0001', 'ES0000000000012', 'FR000000000001', '', null])(
    'rechaza "%s"',
    (codigo) => {
      expect(esCrotalValido(codigo)).toBe(false)
    },
  )
})

describe('formatearCrotal', () => {
  it('agrupa el código en bloques de 4', () => {
    expect(formatearCrotal('ES000000000001')).toBe('ES 0000 0000 0001')
  })

  it('agrupa también un código escrito de otra forma', () => {
    expect(formatearCrotal('es000000000123')).toBe('ES 0000 0000 0123')
  })

  it('devuelve tal cual lo que no tiene el formato esperado', () => {
    expect(formatearCrotal('FR12')).toBe('FR12')
    expect(formatearCrotal(null)).toBe('')
  })
})

describe('ultimosDigitos', () => {
  it('devuelve los 4 últimos por defecto', () => {
    expect(ultimosDigitos('ES000000000123')).toBe('0123')
  })

  it('permite pedir otra cantidad', () => {
    expect(ultimosDigitos('ES000000000123', 2)).toBe('23')
  })
})

describe('extraerDigitos', () => {
  it.each([
    ['ES 0000 0000 0001', '000000000001'],
    ['es000000000001', '000000000001'],
    ['0000 0000', '00000000'],
    ['12a3-4', '1234'],
    // Más de 12 dígitos: se queda con los 12 primeros
    ['0000000000012345', '000000000001'],
  ])('"%s" → "%s"', (escrito, esperado) => {
    expect(extraerDigitos(escrito)).toBe(esperado)
  })
})

describe('agruparDigitos', () => {
  it.each([
    ['000000000001', '0000 0000 0001'],
    ['000000', '0000 00'],
    ['12', '12'],
    ['', ''],
  ])('"%s" → "%s"', (digitos, esperado) => {
    expect(agruparDigitos(digitos)).toBe(esperado)
  })
})
