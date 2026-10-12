import { notes, Question } from '@serenity-js/core'

import type { NotasDelActor } from '../interactions/LlamarAlBack'

export const Respuesta = {
  estado: () => notes<NotasDelActor>().get('respuesta').as(r => r.status).describedAs('el código de estado de la respuesta'),
  campo: (nombre: string) =>
    Question.about<any>(`el campo "${nombre}" de la respuesta`, async actor => {
      const r = await actor.answer(notes<NotasDelActor>().get('respuesta'))
      return r.data?.[nombre]
    }),
}
