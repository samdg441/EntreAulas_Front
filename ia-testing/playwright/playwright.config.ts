import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas de RQ1–RQ5 generadas con los agentes de IA de Playwright (ver PLAN-IA.md).
 * El front corre en :3001 y el back se simula en memoria con page.route (fixtures/back-simulado.ts).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../reports/playwright/html', open: 'never' }],
    ['junit', { outputFile: '../../reports/playwright/junit-rq1-rq5.xml' }],
  ],
  outputDir: '../../reports/playwright/resultados',
  use: {
    baseURL: process.env.FRONT_URL || 'http://localhost:3001',
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    locale: 'es-CO',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.FRONT_URL
    ? undefined
    : { command: 'npm run front', url: 'http://localhost:3001', reuseExistingServer: true, timeout: 120_000 },
})
