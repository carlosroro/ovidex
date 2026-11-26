import { peticion } from './cliente.js'

/*
 * Llamadas a la API del censo.
 *
 * Las pantallas usan estas funciones y nunca llaman a peticion() directamente.
 * Así, en la fase 2 (sin conexión) bastará con cambiar lo que hacen por dentro
 * (leer de la copia local, dejar los cambios como pendientes) sin tocar las
 * pantallas.
 *
 * La API responde dentro de "data"; aquí se quita ese envoltorio.
 * Si algo falla, lanzan el ErrorApi del cliente (con los errores de
 * validación en error.datos.errors cuando es un 422).
 */

const RUTA = '/api/animales'

// Ruta de un animal concreto (el id se codifica por si acaso)
const rutaDe = (id) => `${RUTA}/${encodeURIComponent(id)}`

/* Todo el censo (activos y de baja), ordenado por código oficial. */
export async function listarAnimales() {
  const respuesta = await peticion(RUTA)
  return respuesta.data
}

/* Un animal, con su madre, su padre y quién lo creó y modificó. */
export async function obtenerAnimal(id) {
  const respuesta = await peticion(rutaDe(id))
  return respuesta.data
}

/* Alta. "datos" incluye el id (UUID) generado en el navegador. */
export async function crearAnimal(datos) {
  const respuesta = await peticion(RUTA, { metodo: 'POST', cuerpo: datos })
  return respuesta.data
}

/* Edición de un animal existente. */
export async function actualizarAnimal(id, datos) {
  const respuesta = await peticion(rutaDe(id), { metodo: 'PUT', cuerpo: datos })
  return respuesta.data
}
