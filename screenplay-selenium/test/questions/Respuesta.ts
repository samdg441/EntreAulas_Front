import { notes, Question } from '@serenity-js/core'

import type { NotasDelActor } from '../interactions/LlamarAlBack'

const leer = (data: any, ruta: string) =>
  ruta.split('.').reduce((valor, clave) => valor?.[clave], data)

export const Respuesta = {
  estado: () => notes<NotasDelActor>().get('respuesta').as(r => r.status).describedAs('el código de estado de la respuesta'),
  campo: (nombre: string) =>
    Question.about<any>(`el campo "${nombre}" de la respuesta`, async actor => {
      const r = await actor.answer(notes<NotasDelActor>().get('respuesta'))
      return leer(r.data, nombre)
    }),
  tipoDe: (nombre: string) =>
    Question.about<string>(`el tipo del campo "${nombre}"`, async actor => typeof await actor.answer(Respuesta.campo(nombre))),
  menciona: (texto: string) =>
    Question.about<boolean>(`si la respuesta menciona "${texto}"`, async actor => {
      const r = await actor.answer(notes<NotasDelActor>().get('respuesta'))
      return JSON.stringify(r.data ?? '').includes(texto)
    }),
}
