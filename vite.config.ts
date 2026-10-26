import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
    // El Chrome de Healenium corre en Docker y abre el front como host.docker.internal.
    // Sin este host, Vite responde 403 y la prueba no llega al login.
    allowedHosts: ['host.docker.internal'],
    // Los reportes y descargas de las pruebas E2E se escriben mientras corre el front:
    // si Vite los vigila, recarga la página en mitad de un escenario.
    watch: { ignored: ['**/reports/**', '**/e2e/**', '**/screenplay/**', '**/screenplay-selenium/**', '**/stagehand/**', '**/healenium/**', '**/coverage/**'] },
  },
  // En producción se eliminan los logs de depuración; console.warn y console.error se conservan.
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug', 'console.info'] } : undefined,
}))
