import { defineConfig } from 'cypress'
import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor'
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild'
import base from './cypress.config'

/**
 * BDD: escenarios Gherkin (cypress/features) ejecutados con el patrón Screenplay (cypress/screenplay).
 * Los escenarios @web usan el front local con el back simulado; los @api llaman al back real (API_URL).
 */
export default defineConfig({
  ...base,
  e2e: {
    ...base.e2e,
    specPattern: 'cypress/features/**/*.feature',
    screenshotsFolder: '../reports/cypress/bdd/screenshots',
    videosFolder: '../reports/cypress/bdd/videos',
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config)
      on('file:preprocessor', createBundler({ plugins: [createEsbuildPlugin(config)] }))
      base.e2e?.setupNodeEvents?.(on, config)
      return config
    },
  },
})
