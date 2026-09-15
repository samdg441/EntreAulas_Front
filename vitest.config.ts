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
      all: false,
      include: [
        'src/features/evaluations/qr-entrada.ts',
        'src/features/auth/dashboard-path.ts',
        'src/lib/calificaciones.ts',
        'src/features/dashboard-coordinator/docentes.ts',
        'src/utils/reporte-exportacion.ts',
        'src/features/dashboard-student/estudiante-materias.ts',
        'src/features/auth/Login.tsx',
        'src/features/auth/ForgotPassword.tsx',
        'src/context/AuthContext.tsx',
        'src/api/auth.ts',
        'src/api/passwordReset.ts',
        'src/api/client.ts',
        'src/features/dashboard-admin/AdminUsersPage.tsx',
        'src/api/users.ts',
        'src/routes/ProtectedRoute.tsx',
        'src/lib/validation.ts',
        'src/lib/apiError.ts',
        'src/lib/storage.ts',
        'src/features/auth/login-flow.ts',
        'src/features/auth/password-reset-flow.ts',
        'src/features/auth/errors.ts',
        'src/features/dashboard-admin/gestionar-usuarios.ts',
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
