import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /\.webp$/,
        replacement: path.resolve(__dirname, 'src/test/mocks/file-mock.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/unit/**/*.test.{ts,tsx}', 'src/test/integration/**/*.test.{ts,tsx}'],
    globals: false,
  },
})
