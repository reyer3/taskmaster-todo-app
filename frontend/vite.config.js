import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // Abre el navegador automáticamente
    port: 5173  // Puerto específico
  },
  build: {
    outDir: 'dist', // Directorio de salida para la construcción
    minify: 'terser', // Optimizador
    sourcemap: true // Generar sourcemaps para debuggear
  },
  resolve: {
    alias: {
      // Podemos añadir alias para rutas (opcional)
      '@': '/src'
    }
  }
}) 