import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const webpMock = path.resolve(__dirname, 'src/test/mocks/file-mock.ts')

export default defineConfig({
  plugins: [
    {
      name: 'mock-webp-assets',
      enforce: 'pre',
      transform(code, id) {
        if (!/\.(t|j)sx?$/.test(id) || !code.includes('.webp')) return null
        const next = code
          .replace(
            /new URL\((['"`])([^'"`]+\.webp)\1\s*,\s*import\.meta\.url\)(?:\.href)?/g,
            "'test-file.webp'"
          )
          .replace(
            /import\s+(\w+)\s+from\s+(['"`])([^'"`]+\.webp)\2/g,
            "const $1 = 'test-file.webp'"
          )
        return next === code ? null : { code: next, map: null }
      },
      load(id) {
        const clean = id.split('?')[0]
        if (clean.endsWith('.webp')) return "export default 'test-file.webp'"
        return null
      },
    },
    react(),
  ],
  resolve: {
    alias: [
      {
        find: /\.webp$/,
        replacement: webpMock,
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
