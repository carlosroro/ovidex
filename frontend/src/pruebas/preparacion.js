/*
 * Preparación común de todas las pruebas (se carga desde vite.config.js).
 */
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Añade comprobaciones pensadas para el DOM: toBeInTheDocument(),
// toBeChecked(), toHaveAttribute()…
import '@testing-library/jest-dom/vitest'

// jsdom (el navegador simulado de las pruebas) no sabe abrir un <dialog> con
// showModal(). Esta versión mínima solo pone o quita el atributo "open", que
// es lo que lo muestra u oculta. (No simula el bloqueo del resto de la
// pantalla ni el foco atrapado: eso lo hace el navegador real.)
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// Tras cada prueba se retira lo que se haya pintado, para que una prueba
// no vea los restos de la anterior.
afterEach(() => {
  cleanup()
})
