/*
 * Genera un UUID v4 nuevo (identificador único) en el navegador.
 *
 * crypto.randomUUID() solo existe en "contextos seguros": HTTPS o localhost.
 * Al probar desde el móvil en desarrollo, la app se abre por
 * http://<IP del PC>:5173 y esa función no está. Por eso, si falta, el UUID se
 * construye con crypto.getRandomValues(), que existe en cualquier contexto y
 * da números aleatorios igual de seguros.
 */
export function nuevoUuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))

  // Marcas que exige el formato UUID v4:
  // - versión 4 en los 4 bits altos del byte 6;
  // - variante "10xx" en los 2 bits altos del byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}
