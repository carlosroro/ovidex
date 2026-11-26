import { useCallback, useMemo, useRef, useState } from 'react'
import { listarAnimales } from '../api/animales.js'
import { CensoContext } from './contexto.js'

/*
 * Guarda en memoria la lista completa del censo y la comparte con las
 * pantallas (Rebaño, el buscador de madre y padre…).
 *
 * Es el ÚNICO sitio que sabe de dónde salen los datos del censo. En la fase 2
 * se cambiará su interior para leer de la copia local del móvil (Dexie) en
 * lugar de la API, y las pantallas no tendrán que cambiar.
 *
 * Se coloca dentro de las rutas protegidas: al cerrarse la sesión desaparece
 * y, con él, la lista guardada.
 */
function CensoProvider({ children }) {
  const [animales, setAnimales] = useState([])
  const [estado, setEstado] = useState('inicial')

  // Número de la última petición lanzada. Si llega la respuesta de una
  // petición más antigua (o anterior a un guardarEnCenso), se descarta,
  // para que unos datos viejos no pisen otros más nuevos.
  const ultimaPeticion = useRef(0)

  // ¿Se ha cargado ya la lista alguna vez? ¿Hay una petición en curso?
  // (useRef: guardan un valor sin volver a pintar al cambiarlo)
  const cargada = useRef(false)
  const enCurso = useRef(false)

  const recargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current
    enCurso.current = true

    // Solo la primera vez se muestra "cargando"; después la lista sigue
    // visible mientras se actualiza
    if (!cargada.current) setEstado('cargando')

    try {
      const lista = await listarAnimales()
      if (numero !== ultimaPeticion.current) return

      cargada.current = true
      setAnimales(lista)
      setEstado('listo')
    } catch {
      if (numero !== ultimaPeticion.current) return

      // Si ya había lista, se conserva: mejor datos de hace un rato que
      // una pantalla vacía. Si no había, se muestra el error.
      // (Un 401 lo gestiona el cliente de API: lleva al login.)
      if (!cargada.current) setEstado('error')
    } finally {
      if (numero === ultimaPeticion.current) enCurso.current = false
    }
  }, [])

  const guardarEnCenso = useCallback(
    (animal) => {
      setAnimales((lista) =>
        [...lista.filter((otro) => otro.id !== animal.id), animal].sort(
          (a, b) => a.codigo_oficial.localeCompare(b.codigo_oficial),
        ),
      )

      // Una petición que ya estuviera en curso traería la lista de antes de
      // este cambio. Se lanza otra, que la sustituye y ya lo incluye.
      if (enCurso.current) recargar()
    },
    [recargar],
  )

  const valor = useMemo(
    () => ({ animales, estado, recargar, guardarEnCenso }),
    [animales, estado, recargar, guardarEnCenso],
  )

  return <CensoContext value={valor}>{children}</CensoContext>
}

export default CensoProvider
