import { Question } from '@serenity-js/core'

import { paginaDe } from '../interactions/NavegadorPlaywright'

/** Valor numérico de una tarjeta del dashboard del estudiante. */
export const valorDeLaEstadistica = (titulo: string) =>
  Question.about<string>(`la estadística "${titulo}"`, async (actor) => {
    const pagina = await paginaDe(actor)
    const tarjeta = pagina.getByText(titulo, { exact: true }).locator('xpath=ancestor::div[contains(@class,"shadow-md")][1]')
    return ((await tarjeta.locator('.text-3xl').textContent()) ?? '').trim()
  })
