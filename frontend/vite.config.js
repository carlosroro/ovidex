import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Lee las variables del archivo .env de esta carpeta
  const env = loadEnv(mode, process.cwd())

  // El proxy solo se usa con el servidor de desarrollo (npm run dev).
  // Las pruebas (Vitest usa el modo "test") no lo necesitan.
  if (command === 'serve' && mode !== 'test' && !env.VITE_API_PROXY_TARGET) {
    throw new Error(
      'Falta VITE_API_PROXY_TARGET en frontend/.env (copia .env.example a .env)',
    )
  }

  return {
    plugins: [react()],
    server: {
      // Redirige /api/* a Laravel: el navegador ve un solo origen y no hace falta CORS
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          // false: Laravel recibe el mismo host que ve el navegador
          // (localhost:5173), como pasará en producción detrás de Caddy.
          // Así las cookies de sesión y las direcciones que genera Laravel
          // corresponden a la dirección real de la app.
          changeOrigin: false,
        },
      },
    },
    // Pruebas con Vitest (npm test)
    test: {
      // Navegador simulado: las pruebas pueden pintar componentes de React
      environment: 'jsdom',
      // Se ejecuta antes de cada archivo de pruebas
      setupFiles: './src/pruebas/preparacion.js',
    },
  }
})
