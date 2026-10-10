import { defineConfig } from 'cypress'
import { rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const requireDelFront = createRequire(path.resolve(__dirname, '..', 'package.json'))

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    specPattern: ['cypress/e2e/regresion/**/*.cy.ts', 'cypress/e2e/api/**/*.cy.ts'],
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1366,
    viewportHeight: 900,
    defaultCommandTimeout: 8000,
    retries: { runMode: 1, openMode: 0 },
    downloadsFolder: 'cypress/downloads',
    screenshotsFolder: '../reports/cypress/screenshots',
    videosFolder: '../reports/cypress/videos',
    video: true,
    // Valores públicos. El token va aparte como secreto: CYPRESS_TOKEN_COORDINADOR (se lee con cy.env).
    expose: {
      apiUrl: process.env.API_URL || 'https://entreaulas-back.onrender.com',
    },
    setupNodeEvents(on) {
      on('task', {
        limpiarDescargas() {
          rmSync(path.resolve(__dirname, 'cypress', 'downloads'), { recursive: true, force: true })
          return null
        },
        /** Lee el .xlsx descargado con la misma librería que lo generó en el front. */
        leerExcel(ruta: string) {
          const XLSX = requireDelFront('xlsx')
          const libro = XLSX.readFile(ruta)
          return {
            hojas: libro.SheetNames,
            filas: XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1 }),
          }
        },
      })
    },
  },
})
