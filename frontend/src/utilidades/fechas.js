/*
 * Utilidades de fechas.
 *
 * La API envía las fechas sin hora como "AAAA-MM-DD". Se leen a mano (año,
 * mes y día) en lugar de con new Date("AAAA-MM-DD"), porque eso interpreta
 * la fecha en UTC y, según la zona horaria, puede mostrar el día anterior.
 */

// Partes de una fecha "AAAA-MM-DD" (o del principio de "AAAA-MM-DDThh:mm…")
function partesDeFecha(texto) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto ?? '')
  if (!coincidencia) return null

  const [, anio, mes, dia] = coincidencia
  return { anio: Number(anio), mes: Number(mes), dia: Number(dia) }
}

const dosCifras = (numero) => String(numero).padStart(2, '0')

/*
 * Fecha para mostrar: "2021-03-14" → "14/03/2021".
 * Acepta también una fecha con hora (como updated_at, "2026-11-20T10:30:00+01:00"),
 * que se muestra con el día de la zona horaria del móvil.
 */
export function formatearFecha(texto) {
  if (!texto) return ''

  const partes = partesDeFecha(texto)
  if (partes) {
    return `${dosCifras(partes.dia)}/${dosCifras(partes.mes)}/${partes.anio}`
  }

  const fecha = new Date(texto)
  if (Number.isNaN(fecha.getTime())) return ''

  return `${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)}/${fecha.getFullYear()}`
}

/*
 * Nacimiento según lo que se sabe de la fecha:
 * - exacta: "14/03/2021"
 * - mes: "03/2021 (aprox.)"
 * - anio: "2021 (aprox.)"
 * - desconocida (o sin fecha): "Desconocida"
 */
export function formatearNacimiento(fecha, precision) {
  const partes = partesDeFecha(fecha)

  if (!partes || precision === 'desconocida') return 'Desconocida'

  if (precision === 'mes') {
    return `${dosCifras(partes.mes)}/${partes.anio} (aprox.)`
  }

  if (precision === 'anio') return `${partes.anio} (aprox.)`

  return formatearFecha(fecha)
}

/*
 * Edad a partir de la fecha de nacimiento, o null si no se conoce:
 * - desde 1 año: "1 año", "5 años";
 * - por debajo: "1 mes", "8 meses" o "Menos de 1 mes".
 * Con precisión de mes o de año va precedida de "≈" ("≈ 5 años").
 * "hoy" se puede indicar para las pruebas.
 */
export function calcularEdad(fecha, precision, hoy = new Date()) {
  const partes = partesDeFecha(fecha)

  if (!partes || precision === 'desconocida') return null

  // Meses cumplidos: no cuenta el mes en curso si aún no se ha llegado al día
  let meses =
    (hoy.getFullYear() - partes.anio) * 12 + (hoy.getMonth() + 1 - partes.mes)
  if (hoy.getDate() < partes.dia) meses -= 1
  meses = Math.max(meses, 0)

  const aproximada = precision === 'mes' || precision === 'anio'
  const prefijo = aproximada ? '≈ ' : ''

  if (meses >= 12) {
    const anios = Math.floor(meses / 12)
    return `${prefijo}${anios} ${anios === 1 ? 'año' : 'años'}`
  }

  if (meses >= 1) {
    return `${prefijo}${meses} ${meses === 1 ? 'mes' : 'meses'}`
  }

  return aproximada ? '≈ menos de 1 mes' : 'Menos de 1 mes'
}
