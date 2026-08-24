import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const fileMock = path.resolve(__dirname, 'src/test/mocks/file-mock.ts')

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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/test/unit/**/*.test.{ts,tsx}',
      'src/test/integration/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'src/test/e2e/**',
    ],
    globals: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
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
