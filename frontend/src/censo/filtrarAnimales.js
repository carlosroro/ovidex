import { normalizarCrotal } from '../utilidades/crotal.js'

/*
 * Busca y filtra en la lista completa del censo.
 *
 * Es una función "pura": no usa React ni la red, solo recibe la lista y los
 * filtros y devuelve otra lista. Por eso es fácil de probar y en la fase 2
 * servirá igual cuando la lista salga de la copia local del móvil.
 *
 * Filtros:
 * - buscar: texto escrito en el buscador.
 *   · Solo dígitos (se ignoran espacios): crotales que TERMINAN en esos
 *     dígitos, o nombres que los contienen ("47" → …0047 y "Nº 47").
 *   · Con letras: nombres que contienen el texto (sin distinguir mayúsculas
 *     ni tildes) o crotales que contienen el texto normalizado (permite
 *     pegar un crotal entero "ES 0000 0000 0001").
 * - sexo: 'hembra', 'macho' o 'todos'.
 * - estado: 'activa', 'baja' o 'todos'.
 * - excluir: id de un animal que no debe aparecer.
 * El orden de la lista se conserva.
 */
export function filtrarAnimales(
  animales,
  { buscar = '', sexo = 'todos', estado = 'activa', excluir = null } = {},
) {
  const coincideTexto = criterioDeBusqueda(buscar)

  return animales.filter(
    (animal) =>
      (sexo === 'todos' || animal.sexo === sexo) &&
      (estado === 'todos' || animal.estado === estado) &&
      animal.id !== excluir &&
      coincideTexto(animal),
  )
}

/*
 * Devuelve la función que decide si un animal coincide con el texto buscado.
 * Se prepara una vez por búsqueda, no una vez por animal.
 */
function criterioDeBusqueda(buscar) {
  const sinEspacios = (buscar ?? '').replace(/\s+/g, '')

  if (sinEspacios === '') return () => true

  if (/^\d+$/.test(sinEspacios)) {
    return (animal) =>
      animal.codigo_oficial.endsWith(sinEspacios) ||
      sinTildes(animal.nombre_o_numero).includes(sinEspacios)
  }

  const texto = sinTildes(buscar.trim())
  const crotal = normalizarCrotal(buscar)

  return (animal) =>
    sinTildes(animal.nombre_o_numero).includes(texto) ||
    animal.codigo_oficial.includes(crotal)
}

/*
 * Minúsculas y sin tildes: "Lucía" → "lucia". normalize('NFD') separa cada
 * letra de su tilde y la expresión borra las tildes sueltas.
 */
function sinTildes(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
