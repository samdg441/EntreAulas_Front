import { defineConfig } from 'cypress'
import base from './cypress.config'

/** Solo peticiones al back real: no levanta ni necesita el front. */
export default defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    baseUrl: null,
    specPattern: ['cypress/e2e/api/**/*.cy.ts'],
    video: false,
  },
})
