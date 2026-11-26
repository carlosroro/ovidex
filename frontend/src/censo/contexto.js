import { createContext, useContext } from 'react'

/*
 * Contexto del censo: lo rellena <CensoProvider> y lo lee cualquier pantalla
 * con useCenso(). Se exporta también para que las pruebas puedan dar un
 * valor falso sin llamar a la API.
 *
 * Valor:
 * - animales: lista completa del censo (activos y de baja), ordenada por
 *   código oficial. Vacía hasta que se carga por primera vez.
 * - estado: 'inicial' (aún no se ha pedido) | 'cargando' (primera carga) |
 *   'listo' | 'error' (la primera carga falló).
 * - recargar(): pide la lista al servidor. La primera vez pasa por
 *   'cargando'; después se actualiza en segundo plano, sin vaciar la lista.
 * - guardarEnCenso(animal): añade o sustituye un animal en la lista (tras
 *   crearlo o editarlo), sin volver a descargarla.
 */
export const CensoContext = createContext(null)

export function useCenso() {
  const censo = useContext(CensoContext)

  if (!censo) {
    throw new Error('useCenso() debe usarse dentro de <CensoProvider>')
  }

  return censo
}
