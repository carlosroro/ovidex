/*
 * Utilidades del código oficial (crotal).
 *
 * El servidor guarda el código normalizado: "ES" + 12 dígitos, sin espacios
 * ("ES000000000001"). En pantalla se muestra agrupado: "ES 0000 0000 0001".
 */

// "ES" seguido de exactamente 12 dígitos
const FORMATO_CODIGO = /^ES\d{12}$/

// Espacios de cualquier tipo, incluido el "espacio duro" que a veces
// aparece al copiar y pegar
const ESPACIOS = /[\s ]+/g

/*
 * Mayúsculas y sin espacios, como lo guarda el servidor:
 * "es 0000 0000 0001" → "ES000000000001".
 */
export function normalizarCrotal(texto) {
  return (texto ?? '').replace(ESPACIOS, '').toUpperCase()
}

/*
 * ¿Tiene el formato válido (ES + 12 dígitos), una vez normalizado?
 */
export function esCrotalValido(texto) {
  return FORMATO_CODIGO.test(normalizarCrotal(texto))
}

/*
 * Agrupado para mostrarlo: "ES000000000001" → "ES 0000 0000 0001".
 * Si no tiene el formato esperado, se devuelve tal cual.
 */
export function formatearCrotal(codigo) {
  const normalizado = normalizarCrotal(codigo)

  if (!FORMATO_CODIGO.test(normalizado)) return codigo ?? ''

  const digitos = normalizado.slice(2)
  return `ES ${agruparDigitos(digitos)}`
}

/*
 * Los últimos dígitos del código (4 por defecto): "ES000000000123" → "0123".
 * Es lo que se usa en el día a día para referirse a un animal.
 */
export function ultimosDigitos(codigo, cuantos = 4) {
  return normalizarCrotal(codigo).slice(-cuantos)
}

/*
 * Para el campo del formulario: de lo que se escribe o se pega, se queda
 * solo con los dígitos (sin el "ES" inicial ni espacios), como mucho 12.
 * "ES 0000 0000 0001" → "000000000001".
 */
export function extraerDigitos(texto) {
  return normalizarCrotal(texto)
    .replace(/^ES/, '')
    .replace(/\D/g, '')
    .slice(0, 12)
}

/*
 * Dígitos agrupados de 4 en 4: "000000000001" → "0000 0000 0001".
 * Funciona también con grupos incompletos: "000000" → "0000 00".
 */
export function agruparDigitos(digitos) {
  return (digitos.match(/\d{1,4}/g) ?? []).join(' ')
}
