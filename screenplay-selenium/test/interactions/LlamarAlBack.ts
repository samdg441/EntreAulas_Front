import { Interaction, notes } from '@serenity-js/core'
import { CallAnApi } from '@serenity-js/rest'

export interface NotasDelActor {
  respuesta: { status: number; data: any }
  tokenAdmin: string
  enlaceDeRecuperacion: string
  tokenDeRecuperacion: string
  correoCreado: string
  tokenAnterior: string
}

export const LlamarAlBack = {
  post: (descripcion: string, url: string, datos: object, conTokenDeAdmin = false) =>
    Interaction.where(`#actor ${descripcion}`, async actor => {
      const token = conTokenDeAdmin ? await actor.answer(notes<NotasDelActor>().get('tokenAdmin')) : undefined
      const respuesta = await CallAnApi.as(actor).request({
        method: 'POST',
        url,
        data: datos,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      await notes<NotasDelActor>().set('respuesta', { status: respuesta.status, data: respuesta.data }).performAs(actor)
    }),
}
