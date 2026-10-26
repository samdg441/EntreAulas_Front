import { After } from '@cucumber/cucumber'
import { actorInTheSpotlight } from '@serenity-js/core'
import percySnapshot from '@percy/playwright'

import { paginaDe } from '../../test/interactions/NavegadorPlaywright'

/**
 * Percy compara la captura de cada escenario @percy con la línea base.
 * Sin PERCY_TOKEN no sube nada: la suite de Screenplay sigue corriendo igual.
 * Con token: PERCY_TOKEN=... npm run test:percy
 */
After({ tags: '@percy' }, async function (escenario) {
  if (!process.env.PERCY_TOKEN) return
  const pagina = await paginaDe(actorInTheSpotlight())
  await percySnapshot(pagina, escenario.pickle.name)
})
