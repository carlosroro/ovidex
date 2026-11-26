import { createContext, useContext } from 'react'

/*
 * Contexto de la sesión: lo rellena <SesionProvider> y lo lee cualquier
 * componente con useSesion(). Se exporta también para que las pruebas
 * puedan dar un valor falso sin llamar a la API.
 *
 * Valor:
 * - estado: 'comprobando' | 'iniciada' | 'sin-sesion' | 'error'
 *   ('error' = no se pudo contactar con el servidor al comprobar la sesión)
 * - usuario: { id, nombre, usuario } o null
 * - cerradaPorUsuario: true si la cerró el usuario con "Cerrar sesión"
 *   (el login no recuerda entonces la pantalla en la que estaba)
 * - iniciarSesion({ usuario, password, recordar }): lanza ErrorApi si falla
 * - cerrarSesion(): lanza ErrorApi si falla
 * - reintentar(): vuelve a comprobar la sesión
 */
export const SesionContext = createContext(null)

export function useSesion() {
  const sesion = useContext(SesionContext)

  if (!sesion) {
    throw new Error('useSesion() debe usarse dentro de <SesionProvider>')
  }

  return sesion
}
