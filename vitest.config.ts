import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const fileMock = path.resolve(__dirname, 'src/test/mocks/file-mock.ts')
const framerMotionMock = path.resolve(__dirname, 'src/test/mocks/framer-motion.tsx')

/** Resuelve imágenes estáticas a mock (new URL(...webp) e imports). */
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

export default defineConfig({
  plugins: [react(), mockStaticAssets()],
  resolve: {
    alias: {
      // framer-motion → passthrough sin animaciones en las pruebas
      'framer-motion': framerMotionMock,
    },
  },
  test: {
    // Equivale a NODE_OPTIONS=--no-experimental-webstorage (sin cross-env en Windows)
    execArgv: ['--no-experimental-webstorage'],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/unit/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'src/test/e2e/**',
      'src/test/defects/**',
      'src/test/integration/**',
    ],
    globals: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      all: true,
      include: [
        'src/features/auth/dashboard-path.ts',
        'src/features/evaluations/qr-entrada.ts',
      ],
      reporter: ['text', 'lcov'],
      reportOnFailure: true,
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'src/test/**',
        '**/*.{test,spec}.{ts,tsx}',
      ],
    },
  },
})
