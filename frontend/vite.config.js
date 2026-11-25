import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Lee las variables del archivo .env de esta carpeta
  const env = loadEnv(mode, process.cwd())

  // El proxy solo se usa con el servidor de desarrollo (npm run dev)
  if (command === 'serve' && !env.VITE_API_PROXY_TARGET) {
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
          changeOrigin: true,
        },
      },
    },
  }
})
