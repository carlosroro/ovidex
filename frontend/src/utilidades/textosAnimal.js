import { formatearCrotal, ultimosDigitos } from './crotal.js'

/*
 * Textos que se muestran en pantalla para cada valor que guarda la API.
 * La API usa valores cortos sin tildes ("crotal_electronico"); la pantalla,
 * frases legibles ("Crotal electrónico").
 */

export const TEXTOS_SEXO = {
  hembra: 'Hembra',
  macho: 'Macho',
}

export const TEXTOS_TIPO_ELECTRONICO = {
  bolo: 'Bolo ruminal',
  crotal_electronico: 'Crotal electrónico',
  ninguno: 'Sin identificador electrónico',
}

export const TEXTOS_ORIGEN = {
  nacida: 'Nacida en la explotación',
  comprada: 'Comprada',
}

export const TEXTOS_ESTADO = {
  activa: 'Activa',
  baja: 'Baja',
}

/*
 * Qué es el animal, en una palabra: "Oveja", "Carnero reproductor" o "Macho".
 */
export function tipoDeAnimal(animal) {
  if (animal.sexo === 'hembra') return 'Oveja'
  return animal.reproductor ? 'Carnero reproductor' : 'Macho'
}

/*
 * Cómo se llama al animal en un título: su nombre o número y, si no tiene,
 * los últimos 4 dígitos del crotal ("…0123").
 */
export function tituloAnimal(animal) {
  return animal.nombre_o_numero || `…${ultimosDigitos(animal.codigo_oficial)}`
}

/*
 * Texto corto para enlazar a un animal (por ejemplo, la madre en la ficha):
 * "Prueba 5 · …0005" o, si no tiene nombre, el crotal agrupado.
 */
export function textoEnlaceAnimal(animal) {
  if (!animal.nombre_o_numero) return formatearCrotal(animal.codigo_oficial)
  return `${animal.nombre_o_numero} · …${ultimosDigitos(animal.codigo_oficial)}`
}
