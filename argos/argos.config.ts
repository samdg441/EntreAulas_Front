import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

import { argosScreenshot } from '@argos-ci/playwright'
import { After, BeforeAll, Status } from '@cucumber/cucumber'
import { actorInTheSpotlight } from '@serenity-js/core'

import { paginaDe } from '../screenplay/test/interactions/NavegadorPlaywright'

const carpeta = path.resolve(__dirname, 'screenshots')

function nombre(escenario: { pickle: { name: string; tags: readonly { name: string }[] } }): string {
  const requisito = escenario.pickle.tags
    .map((etiqueta) => etiqueta.name.replace('@', ''))
    .find((etiqueta) => /^RQ\d+$/.test(etiqueta)) ?? 'RQ'
  const base = escenario.pickle.name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${requisito}/${base}`
}

/**
 * Argos compara estas capturas con la línea base del historial de Git.
 * `npm run test:argos` las deja en EntreAulas_Front/argos/screenshots.
 * La subida es aparte: ARGOS_TOKEN=... npm run argos:upload
 */
BeforeAll(function () {
  if (!process.env.ARGOS) return
  rmSync(carpeta, { recursive: true, force: true })
  mkdirSync(carpeta, { recursive: true })
})

After({ tags: '@argos' }, async function (escenario) {
  if (!process.env.ARGOS || escenario.result?.status !== Status.PASSED) return
  try {
    const pagina = await paginaDe(actorInTheSpotlight())
    await pagina.setViewportSize({ width: 1280, height: 720 })
    await argosScreenshot(pagina, nombre(escenario), { root: carpeta, fullPage: true })
  } catch (error) {
    console.warn(`Argos: no se pudo capturar "${escenario.pickle.name}".`, error)
  }
})
