import { useState } from 'react'

// Clave en localStorage. Debe coincidir con la del script de index.html
const CLAVE = 'ovidex-tema'

export const TEMAS = ['auto', 'claro', 'oscuro']

// Lee la preferencia guardada. Si no hay o no se puede leer: automático
function leerTema() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return TEMAS.includes(guardado) ? guardado : 'auto'
  } catch {
    return 'auto'
  }
}

// Pone o quita el atributo data-tema en <html>; tema.css hace el resto
function aplicarTema(tema) {
  const raiz = document.documentElement
  if (tema === 'auto') {
    delete raiz.dataset.tema
  } else {
    raiz.dataset.tema = tema
  }
}

function guardarTema(tema) {
  try {
    if (tema === 'auto') {
      localStorage.removeItem(CLAVE)
    } else {
      localStorage.setItem(CLAVE, tema)
    }
  } catch {
    // Sin almacenamiento: el cambio se aplica, pero no se recordará al recargar
  }
}

// Devuelve [temaActual, cambiarTema], igual que useState
export function useTema() {
  const [tema, setTema] = useState(leerTema)

  function cambiarTema(nuevoTema) {
    aplicarTema(nuevoTema)
    guardarTema(nuevoTema)
    setTema(nuevoTema)
  }

  return [tema, cambiarTema]
}
