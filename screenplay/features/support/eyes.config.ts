import { After, AfterAll, Status } from '@cucumber/cucumber'
import { ClassicRunner, Eyes, Target } from '@applitools/eyes-playwright'
import { actorInTheSpotlight } from '@serenity-js/core'

import { paginaDe } from '../../test/interactions/NavegadorPlaywright'

const runner = new ClassicRunner()
const eyes = new Eyes(runner)
eyes.setBatch('EntreAulas RQ10 RQ11 RQ13 RQ29 RQ30 RQ31')

function requisitoDe(etiquetas: readonly { name: string }[]): string {
  return etiquetas.map((etiqueta) => etiqueta.name.replace('@', '')).find((etiqueta) => /^RQ\d+$/.test(etiqueta)) ?? 'RQ'
}

/**
 * Applitools compara la captura de cada escenario @eyes con la línea base.
 * Sin APPLITOOLS_API_KEY no sube nada.
 * Con clave: APPLITOOLS_API_KEY=... npm run test:eyes
 */
function enlaceDe(resultado: { getUrl?: () => string; getAppUrls?: () => { getBatch?: () => string } | undefined }): string {
  const lote = resultado.getAppUrls?.()?.getBatch?.()
  const sesion = resultado.getUrl?.()
  return lote || sesion || ''
}

After({ tags: '@eyes' }, async function (escenario) {
  if (!process.env.APPLITOOLS_API_KEY || escenario.result?.status !== Status.PASSED) return
  const pagina = await paginaDe(actorInTheSpotlight())
  const nombre = `${requisitoDe(escenario.pickle.tags)} ${escenario.pickle.name}`
  await pagina.setViewportSize({ width: 1280, height: 720 })
  try {
    await eyes.open(pagina, 'EntreAulas', nombre)
    await eyes.check(escenario.pickle.name, Target.window().fully())
    const resultado = await eyes.close(false)
    const enlace = enlaceDe(resultado)
    const linea = enlace
      ? `Applitools: ${enlace}`
      : `Applitools: resultado de "${nombre}" sin enlace. Ábrelo en https://eyes.applitools.com`
    console.log(linea)
    this.log?.(linea)
  } catch (error) {
    await eyes.abort().catch(() => undefined)
    throw error
  }
})

AfterAll(async function () {
  if (!process.env.APPLITOOLS_API_KEY) return
  try {
    const resumen = await runner.getAllTestResults(false)
    const enlaces = resumen
      .getAllResults()
      .map((contenedor) => contenedor.getTestResults())
      .filter((resultado): resultado is NonNullable<typeof resultado> => Boolean(resultado))
      .map((resultado) => enlaceDe(resultado))
      .filter((enlace, indice, todos) => enlace && todos.indexOf(enlace) === indice)
    if (enlaces.length) enlaces.forEach((enlace) => console.log(`Applitools: ${enlace}`))
    else console.log('Applitools: abre https://eyes.applitools.com y entra a la aplicación EntreAulas')
  } catch (error) {
    console.log('Applitools: abre https://eyes.applitools.com y entra a la aplicación EntreAulas')
    console.warn(error)
  }
})
