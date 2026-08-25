import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const fileMock = path.resolve(__dirname, 'src/test/mocks/file-mock.ts')

function mockStaticAssets() {
  return {
    name: 'mock-static-assets',
    resolveId(id: string) {
      if (/\.(webp|png|jpg|jpeg|gif|svg)(\?.*)?$/i.test(id)) {
        return fileMock
      }
      return null
    },
  }
}

/**
 * Configuración del registro de defectos.
 * Estas pruebas expresan el comportamiento correcto esperado y fallan
 * mientras el defecto siga abierto. No forman parte de la suite de requisitos.
 */
export default defineConfig({
  plugins: [react(), mockStaticAssets()],
  test: {
    execArgv: ['--no-experimental-webstorage'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/defects/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    globals: false,
  },
})
