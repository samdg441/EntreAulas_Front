import { Task } from '@serenity-js/core'
import { By, Click, PageElement } from '@serenity-js/web'

import { EnviarEvaluacionDeAna } from '../interactions/Evaluacion'

const nuevaEvaluacion = () =>
  PageElement.located(By.cssContainingText('button', 'Nueva Evaluación')).describedAs('el botón Nueva Evaluación')

export const AbrirNuevaEvaluacion = () =>
  Task.where('#actor abre una nueva evaluación', Click.on(nuevaEvaluacion()))

export const EnviarEvaluacion = {
  deAna: (comentario: string) =>
    Task.where(`#actor envía la evaluación de Ana Pérez`, EnviarEvaluacionDeAna(comentario)),
}
