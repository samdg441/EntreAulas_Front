import { defineConfig } from 'cypress'
import base from './cypress.config'

/** Solo API y seguridad contra el back real: no necesita el front levantado. */
export default defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    baseUrl: undefined,
    specPattern: ['cypress/e2e/api/**/*.cy.ts', 'cypress/e2e/security/**/*.cy.ts'],
    video: false,
  },
})
