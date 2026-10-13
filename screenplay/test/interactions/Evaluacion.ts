import { Interaction } from '@serenity-js/core'

import { paginaDe } from './NavegadorPlaywright'

/** Recorre la selección de docente y envía la encuesta. El comentario "repetida" lo rechaza el back simulado. */
export const EnviarEvaluacionDeAna = (comentario: string) =>
  Interaction.where(`#actor envía la evaluación de Ana Pérez con el comentario "${comentario}"`, async (actor) => {
    const pagina = await paginaDe(actor)
    await pagina.getByRole('heading', { name: 'Ana Pérez', exact: true }).click()
    await pagina.locator('select').selectOption({ label: 'Programación I (SIS-101)' })
    await pagina.getByText('Grupo 1', { exact: true }).click()
    await pagina.getByRole('button', { name: /Continuar a Evaluación/ }).click()
    await pagina.getByRole('heading', { name: 'Claridad Expositiva' }).waitFor()
    await pagina.getByRole('button', { name: '5', exact: true }).click()
    await pagina.getByPlaceholder('Escribe tus comentarios aquí...').fill(comentario)
    await pagina.getByRole('button', { name: 'Finalizar Evaluación' }).click()
    await pagina.getByRole('button', { name: 'Confirmar y Enviar' }).click()
  })
