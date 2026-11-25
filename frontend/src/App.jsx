import { useEffect, useState } from 'react'

// Tiempo máximo de espera de la API antes de darla por caída
const ESPERA_MAXIMA_MS = 8000

const MENSAJES = {
  comprobando: {
    titulo: 'Comprobando la conexión…',
    detalle: 'Consultando el servidor.',
  },
  ok: {
    titulo: 'Conexión correcta',
    detalle: 'La API y la base de datos funcionan.',
  },
  'sin-api': {
    titulo: 'No se puede conectar con la API',
    detalle: 'Comprueba que el servidor de Laravel está arrancado.',
  },
  'sin-base-datos': {
    titulo: 'La base de datos no responde',
    detalle: 'La API funciona, pero no llega a la base de datos.',
  },
}

// Llama a /api/estado y traduce la respuesta a uno de los estados de MENSAJES
async function consultarEstado(signal) {
  try {
    const respuesta = await fetch('/api/estado', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(ESPERA_MAXIMA_MS)]),
    })
    const datos = await respuesta.json()

    if (datos.api === 'ok' && datos.base_datos === 'ok') return 'ok'
    if (datos.api === 'ok' && datos.base_datos === 'error') {
      return 'sin-base-datos'
    }
    return 'sin-api'
  } catch {
    // Error de red, tiempo agotado o respuesta que no es JSON
    return 'sin-api'
  }
}

function App() {
  const [estado, setEstado] = useState('comprobando')
  const [intento, setIntento] = useState(0)

  // Se ejecuta al abrir la página y cada vez que cambia "intento"
  useEffect(() => {
    const controlador = new AbortController()

    consultarEstado(controlador.signal).then((nuevoEstado) => {
      // Si la petición se canceló, su resultado ya no interesa
      if (!controlador.signal.aborted) setEstado(nuevoEstado)
    })

    return () => controlador.abort()
  }, [intento])

  function volverAComprobar() {
    setEstado('comprobando')
    setIntento((n) => n + 1)
  }

  const mensaje = MENSAJES[estado]

  return (
    <main className="pagina">
      <h1>Ovidex</h1>

      <section className={`estado estado--${estado}`} role="status">
        <h2>{mensaje.titulo}</h2>
        <p>{mensaje.detalle}</p>
      </section>

      <button
        type="button"
        onClick={volverAComprobar}
        disabled={estado === 'comprobando'}
      >
        Volver a comprobar
      </button>
    </main>
  )
}

export default App
