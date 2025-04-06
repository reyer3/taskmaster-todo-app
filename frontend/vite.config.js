import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      open: true, // Abre el navegador automáticamente
      port: 5173,  // Puerto específico
      proxy: {
        // Configuración de proxy para desarrollo
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist', // Directorio de salida para la construcción
      minify: 'terser', // Optimizador
      sourcemap: mode !== 'production', // Generar sourcemaps solo en desarrollo
      emptyOutDir: true, // Limpiar el directorio de salida
    },
    resolve: {
      alias: {
        // Alias para rutas
        '@': '/src'
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    // Definir variables de entorno que estarán disponibles en el cliente
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '/api'),
    }
  }
})