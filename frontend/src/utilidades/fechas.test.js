import { describe, expect, it } from 'vitest'
import { calcularEdad, formatearFecha, formatearNacimiento } from './fechas.js'

// "Hoy" fijo para que las pruebas no dependan del día en que se ejecutan
// (mes 10 = noviembre: en JavaScript los meses empiezan en 0)
const HOY = new Date(2026, 10, 26)

describe('formatearFecha', () => {
  it('muestra una fecha AAAA-MM-DD como dd/mm/aaaa', () => {
    expect(formatearFecha('2021-03-14')).toBe('14/03/2021')
  })

  it('no se desplaza un día por la zona horaria', () => {
    expect(formatearFecha('2021-01-01')).toBe('01/01/2021')
  })

  it('muestra una fecha con hora con el día local', () => {
    const conHora = new Date(2026, 10, 20, 10, 30).toISOString()
    expect(formatearFecha(conHora)).toBe('20/11/2026')
  })

  it('un valor vacío o no válido da un texto vacío', () => {
    expect(formatearFecha(null)).toBe('')
    expect(formatearFecha('no es una fecha')).toBe('')
  })
})

describe('formatearNacimiento', () => {
  it.each([
    ['2021-03-14', 'exacta', '14/03/2021'],
    ['2021-03-01', 'mes', '03/2021 (aprox.)'],
    ['2021-01-01', 'anio', '2021 (aprox.)'],
    [null, 'desconocida', 'Desconocida'],
    [null, 'exacta', 'Desconocida'],
  ])('%s con precisión %s → "%s"', (fecha, precision, esperado) => {
    expect(formatearNacimiento(fecha, precision)).toBe(esperado)
  })
})

describe('calcularEdad', () => {
  it('en años desde que cumple 1 año', () => {
    expect(calcularEdad('2021-03-14', 'exacta', HOY)).toBe('5 años')
    expect(calcularEdad('2025-11-26', 'exacta', HOY)).toBe('1 año')
  })

  it('no cuenta el año hasta el día del cumpleaños', () => {
    expect(calcularEdad('2021-11-27', 'exacta', HOY)).toBe('4 años')
    expect(calcularEdad('2021-11-26', 'exacta', HOY)).toBe('5 años')
  })

  it('en meses por debajo del año', () => {
    expect(calcularEdad('2026-03-10', 'exacta', HOY)).toBe('8 meses')
    expect(calcularEdad('2026-10-20', 'exacta', HOY)).toBe('1 mes')
    expect(calcularEdad('2026-11-10', 'exacta', HOY)).toBe('Menos de 1 mes')
  })

  it('con precisión de mes o de año lleva "≈"', () => {
    expect(calcularEdad('2021-03-01', 'mes', HOY)).toBe('≈ 5 años')
    expect(calcularEdad('2021-01-01', 'anio', HOY)).toBe('≈ 5 años')
    expect(calcularEdad('2026-03-01', 'mes', HOY)).toBe('≈ 8 meses')
    expect(calcularEdad('2026-11-01', 'mes', HOY)).toBe('≈ menos de 1 mes')
  })

  it('sin fecha conocida no hay edad', () => {
    expect(calcularEdad(null, 'desconocida', HOY)).toBeNull()
    expect(calcularEdad('2021-03-14', 'desconocida', HOY)).toBeNull()
  })

  it('una fecha futura no da una edad negativa', () => {
    expect(calcularEdad('2026-12-01', 'exacta', HOY)).toBe('Menos de 1 mes')
  })
})
