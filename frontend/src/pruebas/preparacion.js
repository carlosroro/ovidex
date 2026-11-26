/*
 * Preparación común de todas las pruebas (se carga desde vite.config.js).
 */
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Añade comprobaciones pensadas para el DOM: toBeInTheDocument(),
// toBeChecked(), toHaveAttribute()…
import '@testing-library/jest-dom/vitest'

// Tras cada prueba se retira lo que se haya pintado, para que una prueba
// no vea los restos de la anterior.
afterEach(() => {
  cleanup()
})
