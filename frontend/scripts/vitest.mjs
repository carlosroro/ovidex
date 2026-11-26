/*
 * Arranca Vitest (lo usan "npm test" y "npm run test:vigilar").
 *
 * Motivo: en Windows, si la terminal abre la carpeta como "c:\…" (unidad en
 * minúscula), Vitest carga algunos archivos dos veces, una como "c:" y otra
 * como "C:", y todas las pruebas fallan con "Vitest failed to find the
 * current suite". Este script lanza Vitest desde la misma carpeta con la
 * unidad en mayúscula. En otros sistemas no cambia nada.
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const carpeta = process
  .cwd()
  .replace(/^[a-z]:/, (unidad) => unidad.toUpperCase())
const vitest = join(carpeta, 'node_modules', 'vitest', 'vitest.mjs')

const resultado = spawnSync(
  process.execPath,
  [vitest, ...process.argv.slice(2)],
  {
    cwd: carpeta,
    stdio: 'inherit',
  },
)

process.exit(resultado.status ?? 1)
