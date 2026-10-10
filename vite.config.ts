import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
    // Los reportes y descargas de las pruebas E2E se escriben mientras corre el front:
    // si Vite los vigila, recarga la página en mitad de un escenario.
    watch: { ignored: ['**/reports/**', '**/e2e/**', '**/screenplay/**', '**/coverage/**'] },
  },
  // En producción se eliminan los logs de depuración; console.warn y console.error se conservan.
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug', 'console.info'] } : undefined,
}))
