import { useCallback, useEffect, useMemo, useState } from 'react'
import { alPerderSesion, ErrorApi, peticion } from '../api/cliente.js'
import { SesionContext } from './contexto.js'

/*
 * Guarda si hay sesión y quién la tiene, y lo comparte con toda la app.
 * Al arrancar pregunta al servidor (GET /api/usuario) si hay sesión.
 */
function SesionProvider({ children }) {
  const [estado, setEstado] = useState('comprobando')
  const [usuario, setUsuario] = useState(null)
  // true si la sesión la ha cerrado el propio usuario (botón "Cerrar sesión"):
  // entonces el login no recuerda la pantalla en la que estaba
  const [cerradaPorUsuario, setCerradaPorUsuario] = useState(false)
  // Cambiar este número vuelve a lanzar la comprobación (botón "Reintentar")
  const [intento, setIntento] = useState(0)

  // Comprobación inicial: ¿hay sesión en el servidor?
  useEffect(() => {
    let cancelada = false

    peticion('/api/usuario', { avisarSiCaduca: false })
      .then((datos) => {
        if (cancelada) return
        setUsuario(datos)
        setEstado('iniciada')
      })
      .catch((error) => {
        if (cancelada) return
        setUsuario(null)
        // 401 = no hay sesión. Cualquier otro fallo (red, 5xx) = no se sabe.
        setEstado(
          error instanceof ErrorApi && error.estado === 401
            ? 'sin-sesion'
            : 'error',
        )
      })

    // Si el componente se desmonta (o se reintenta) antes de la respuesta,
    // esa respuesta ya no interesa
    return () => {
      cancelada = true
    }
  }, [intento])

  // Si el servidor dice que la sesión ha caducado, se vuelve al login
  useEffect(
    () =>
      alPerderSesion(() => {
        setUsuario(null)
        setCerradaPorUsuario(false)
        setEstado('sin-sesion')
      }),
    [],
  )

  const iniciarSesion = useCallback(async ({ usuario, password, recordar }) => {
    const datos = await peticion('/api/login', {
      metodo: 'POST',
      cuerpo: { usuario, password, recordar },
      avisarSiCaduca: false,
    })
    setUsuario(datos)
    setCerradaPorUsuario(false)
    setEstado('iniciada')
    return datos
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await peticion('/api/logout', { metodo: 'POST', avisarSiCaduca: false })
    } catch (error) {
      // 401: la sesión ya no existía en el servidor; el resultado es el mismo.
      // Cualquier otro fallo (por ejemplo, sin conexión) se pasa a la pantalla
      // y la sesión sigue abierta.
      if (!(error instanceof ErrorApi && error.estado === 401)) throw error
    }
    setUsuario(null)
    setCerradaPorUsuario(true)
    setEstado('sin-sesion')
  }, [])

  const reintentar = useCallback(() => {
    setEstado('comprobando')
    setIntento((n) => n + 1)
  }, [])

  // useMemo: el valor solo cambia cuando cambia algo, así los componentes
  // que usan la sesión no se vuelven a pintar sin motivo
  const valor = useMemo(
    () => ({
      estado,
      usuario,
      cerradaPorUsuario,
      iniciarSesion,
      cerrarSesion,
      reintentar,
    }),
    [
      estado,
      usuario,
      cerradaPorUsuario,
      iniciarSesion,
      cerrarSesion,
      reintentar,
    ],
  )

  return <SesionContext value={valor}>{children}</SesionContext>
}

export default SesionProvider
