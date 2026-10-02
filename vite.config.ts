import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
  },
  // En producción se eliminan los logs de depuración; console.warn y console.error se conservan.
  esbuild: command === 'build' ? { pure: ['console.log', 'console.debug', 'console.info'] } : undefined,
}))
