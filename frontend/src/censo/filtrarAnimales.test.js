import { describe, expect, it } from 'vitest'
import { filtrarAnimales } from './filtrarAnimales.js'

// Animal de prueba con valores por defecto; cada caso cambia lo que necesita
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

// Crotales de los resultados, para comparar fácilmente
const crotales = (lista) => lista.map((a) => a.codigo_oficial)

describe('filtrarAnimales', () => {
  const censo = [
    animal(1, { sexo: 'macho', nombre_o_numero: 'Carnero Prueba' }),
    animal(2, { estado: 'baja' }),
    animal(47),
    animal(4712, { nombre_o_numero: 'Prueba Siete' }),
    animal(100, { nombre_o_numero: 'Nº 47' }),
    animal(101, { nombre_o_numero: 'Lucía' }),
    animal(102, { sexo: 'macho', estado: 'baja' }),
  ]

  it('sin filtros muestra solo los activos, de los dos sexos', () => {
    expect(crotales(filtrarAnimales(censo))).toEqual([
      'ES000000000001',
      'ES000000000047',
      'ES000000004712',
      'ES000000000100',
      'ES000000000101',
    ])
  })

  it('filtra por sexo', () => {
    expect(crotales(filtrarAnimales(censo, { sexo: 'macho' }))).toEqual([
      'ES000000000001',
    ])
  })

  it('filtra por estado', () => {
    expect(crotales(filtrarAnimales(censo, { estado: 'baja' }))).toEqual([
      'ES000000000002',
      'ES000000000102',
    ])
  })

  it('sexo y estado "todos"', () => {
    expect(
      filtrarAnimales(censo, { sexo: 'todos', estado: 'todos' }),
    ).toHaveLength(censo.length)
  })

  it('por los últimos dígitos del crotal, no por dígitos del medio', () => {
    const resultado = crotales(filtrarAnimales(censo, { buscar: '47' }))

    expect(resultado).toContain('ES000000000047')
    expect(resultado).not.toContain('ES000000004712')
  })

  it('unos dígitos encuentran también el nombre o número que los contiene', () => {
    expect(crotales(filtrarAnimales(censo, { buscar: '47' }))).toEqual([
      'ES000000000047',
      'ES000000000100',
    ])
  })

  it('ignora los espacios en una búsqueda de dígitos', () => {
    expect(crotales(filtrarAnimales(censo, { buscar: ' 4 7 ' }))).toContain(
      'ES000000000047',
    )
  })

  it('por nombre, sin distinguir mayúsculas', () => {
    expect(crotales(filtrarAnimales(censo, { buscar: 'SIETE' }))).toEqual([
      'ES000000004712',
    ])
  })

  it('por nombre, sin distinguir tildes en ningún sentido', () => {
    expect(crotales(filtrarAnimales(censo, { buscar: 'lucia' }))).toEqual([
      'ES000000000101',
    ])
    expect(crotales(filtrarAnimales(censo, { buscar: 'Lucía' }))).toEqual([
      'ES000000000101',
    ])
  })

  it('un crotal completo con espacios', () => {
    expect(
      crotales(filtrarAnimales(censo, { buscar: 'es 0000 0000 0001' })),
    ).toEqual(['ES000000000001'])
  })

  it('combina la búsqueda con los filtros', () => {
    expect(
      crotales(filtrarAnimales(censo, { buscar: 'prueba', sexo: 'hembra' })),
    ).toEqual(['ES000000004712'])
  })

  it('excluye el animal indicado', () => {
    expect(
      crotales(filtrarAnimales(censo, { sexo: 'macho', excluir: 'id-1' })),
    ).toEqual([])
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filtrarAnimales(censo, { buscar: '9999' })).toEqual([])
  })

  it('conserva el orden de la lista', () => {
    const desordenado = [animal(3), animal(1), animal(2)]

    expect(crotales(filtrarAnimales(desordenado))).toEqual([
      'ES000000000003',
      'ES000000000001',
      'ES000000000002',
    ])
  })
})
