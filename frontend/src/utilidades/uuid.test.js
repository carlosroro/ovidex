import { afterEach, describe, expect, it, vi } from 'vitest'
import { nuevoUuid } from './uuid.js'

// Formato de un UUID v4: el 13.º carácter es "4" y el 17.º, 8, 9, a o b
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('nuevoUuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve un UUID v4 con crypto.randomUUID', () => {
    expect(nuevoUuid()).toMatch(UUID_V4)
  })

  it('sin crypto.randomUUID (HTTP fuera de localhost) también da un UUID v4', () => {
    const real = globalThis.crypto
    // Un "crypto" como el de un contexto no seguro: sin randomUUID
    vi.stubGlobal('crypto', {
      getRandomValues: (array) => real.getRandomValues(array),
    })

    const generados = Array.from({ length: 50 }, () => nuevoUuid())

    generados.forEach((uuid) => expect(uuid).toMatch(UUID_V4))
    // Todos distintos
    expect(new Set(generados).size).toBe(50)
  })
})
