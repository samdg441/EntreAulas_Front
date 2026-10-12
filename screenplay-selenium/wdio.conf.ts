import { Duration } from '@serenity-js/core'
import type { WebdriverIOConfig } from '@serenity-js/webdriverio'

const navegador = (process.env.NAVEGADOR ?? 'chrome').toLowerCase()
const headless = process.env.HEADLESS !== 'false'
const binarioChrome = process.env.NAVEGADOR_BIN ?? '/usr/bin/brave'

const capacidades = navegador === 'firefox'
  ? [{
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: headless ? ['-headless'] : [],
        ...(process.env.NAVEGADOR_BIN && { binary: process.env.NAVEGADOR_BIN }),
      },
    }]
  : [{
      browserName: 'chrome',
      'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_BIN ?? `${process.env.HOME}/.cache/chromedriver-154/chromedriver-linux64/chromedriver` },
      'goog:chromeOptions': {
        args: [...(headless ? ['--headless=new'] : []), '--no-sandbox', '--window-size=1366,900'],
        binary: binarioChrome,
      },
    }]

export const config: WebdriverIOConfig = {
  runner: 'local',
  framework: '@serenity-js/webdriverio',
  serenity: {
    runner: 'cucumber',
    interactionTimeout: Duration.ofSeconds(20),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/core:ArtifactArchiver', { outputDirectory: './target/site/serenity' }],
      ['@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' }],
      ['@serenity-js/serenity-bdd', { specDirectory: './features' }],
    ],
  },
  specs: ['./features/**/*.feature'],
  maxInstances: 1,
  capabilities: capacidades as WebdriverIOConfig['capabilities'],
  baseUrl: process.env.FRONT_URL ?? 'http://localhost:3001',
  logLevel: 'warn',
  waitforTimeout: 10_000,
  cucumberOpts: {
    require: ['./features/**/*.ts'],
    timeout: 60_000,
    tags: process.env.TAGS ?? '',
  },
}
