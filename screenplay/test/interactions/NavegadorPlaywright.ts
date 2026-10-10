import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { Interaction, Question, TakeNotes, type Answerable, type UsesAbilities } from '@serenity-js/core'
import { BrowseTheWebWithPlaywright, type PlaywrightPage } from '@serenity-js/playwright'
import type { PageElement } from '@serenity-js/web'
import type { Page } from 'playwright'

import { instalarBackSimulado, peticionesDe, type Peticion } from '../support/back-simulado'

export type NotasDelActor = { archivoDescargado: string }

/** Página nativa de Playwright del actor: la necesitan las interacciones que Serenity/JS no trae. */
export async function paginaDe(actor: UsesAbilities): Promise<Page> {
  const pagina = (await BrowseTheWebWithPlaywright.as(actor).currentPage()) as PlaywrightPage
  return pagina.nativePage()
}

export const UsarElBackSimulado = () =>
  Interaction.where('#actor usa EntreAulas con el back simulado', async (actor) => {
    await instalarBackSimulado(await paginaDe(actor))
  })

/** Pulsa el elemento, espera la descarga que provoca y anota el nombre del archivo. */
export const DescargarAlPulsar = (elemento: Answerable<PageElement>) =>
  Interaction.where(`#actor descarga el archivo que genera ${elemento}`, async (actor) => {
    const pagina = await paginaDe(actor)
    const boton = await actor.answer(elemento)
    const [descarga] = await Promise.all([pagina.waitForEvent('download'), boton.click()])

    const carpeta = path.resolve(__dirname, '..', '..', 'descargas')
    mkdirSync(carpeta, { recursive: true })
    await descarga.saveAs(path.join(carpeta, descarga.suggestedFilename()))
    TakeNotes.as<TakeNotes<NotasDelActor>>(actor).notepad.set('archivoDescargado', descarga.suggestedFilename())
  })

/** Lo que el back simulado recibió desde el navegador del actor. */
export const PeticionesAlBack = {
  a: (ruta: string) =>
    Question.about<Peticion[]>(`las peticiones a ${ruta}`, async (actor) =>
      peticionesDe(await paginaDe(actor)).filter((p) => p.ruta === ruta)
    ),
  // React StrictMode duplica la petición inicial en desarrollo: importa la última, no "la siguiente".
  parametro: (ruta: string, parametro: string) =>
    Question.about<string>(`el parámetro "${parametro}" de la última consulta a ${ruta}`, async (actor) => {
      const peticiones = peticionesDe(await paginaDe(actor)).filter((p) => p.ruta === ruta)
      return peticiones.at(-1)?.query[parametro] ?? '(sin el parámetro)'
    }),
}
