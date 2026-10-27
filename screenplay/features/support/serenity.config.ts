import { AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber'
import { Cast, configure, TakeNotes } from '@serenity-js/core'
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright'
import { CallAnApi } from '@serenity-js/rest'
import { Photographer, TakePhotosOfInteractions } from '@serenity-js/web'
import { Browser, chromium } from 'playwright'

import { apiUrl, frontUrl, tokenCoordinador } from '../../test/support/entorno'

let browser: Browser | undefined

// Render (plan gratuito) puede tardar en despertar en los escenarios @api.
setDefaultTimeout(60_000)

/**
 * Chromium de Playwright si está instalado (CI); si no se pudo descargar, el Edge que trae
 * Windows. NAVEGADOR=msedge|chrome fuerza un canal concreto.
 */
/** Argos pide estas flags para que el texto no cambie entre tu máquina y la de CI. */
function opcionesDeArgos(): { args?: string[] } {
  if (!process.env.ARGOS) return {}
  return { args: ['--disable-lcd-text', '--font-render-hinting=none'] }
}

async function lanzarNavegador(): Promise<Browser> {
  const headless = process.env.HEADLESS !== 'false'
  const extra = opcionesDeArgos()
  if (process.env.NAVEGADOR) return chromium.launch({ headless, channel: process.env.NAVEGADOR, ...extra })
  try {
    return await chromium.launch({ headless, ...extra })
  } catch {
    return chromium.launch({ headless, channel: 'msedge', ...extra })
  }
}

/** Render apaga el plan gratuito sin tráfico: la primera petición puede tardar más de 10 s. */
async function despertarApi() {
  try {
    await fetch(`${apiUrl()}/health`, { signal: AbortSignal.timeout(90_000) })
  } catch {
    // Si no despierta, los escenarios @api fallarán con su propio mensaje.
  }
}

BeforeAll(async () => {
  if (process.env.SERENITY_API_ONLY === 'true') await despertarApi()
  else browser = await lanzarNavegador()

  configure({
    actors: Cast.where((actor) => {
      actor.whoCan(TakeNotes.usingAnEmptyNotepad(), CallAnApi.using({ baseURL: apiUrl(), timeout: 60_000 }))
      if (browser) {
        actor.whoCan(BrowseTheWebWithPlaywright.using(browser, { baseURL: frontUrl(), acceptDownloads: true }))
      }
      return actor
    }),
    crew: [
      '@serenity-js/console-reporter',
      Photographer.whoWill(TakePhotosOfInteractions),
      [
        '@serenity-js/html-reporter',
        { specDirectory: './features', outputDirectory: '../reports/serenity-js', title: 'EntreAulas — E2E Screenplay (RQ10–RQ13, RQ18–RQ25, RQ29–RQ31)' },
      ],
    ],
  })
})

Before({ tags: '@con-token' }, function () {
  if (!tokenCoordinador()) return 'skipped'
})

AfterAll(async () => {
  await browser?.close()
})
